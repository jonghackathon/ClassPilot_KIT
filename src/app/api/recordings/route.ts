import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { toFile } from 'openai'
import { after } from 'next/server'
import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getOpenAIClient, getWhisperModel } from '@/lib/ai/openai'
import { getTeacherClassIds, teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { parseRequestBody } from '@/lib/route-helpers'
import { getPageParams, withAuth } from '@/lib/with-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

const recordingStatuses = new Set(['PROCESSING', 'COMPLETED', 'FAILED'] as const)
const publicRecordingDir = path.join(process.cwd(), 'public', 'uploads', 'recordings')
const audioUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.startsWith('/') || z.string().url().safeParse(value).success,
    '녹음 파일 경로는 URL 또는 /uploads 경로여야 합니다.',
  )

const recordingCreateSchema = z.object({
  lessonId: z.string().cuid(),
  audioUrl: audioUrlSchema.optional().nullable(),
  transcript: z.string().trim().optional().nullable(),
})

function summarizeTranscript(transcript: string) {
  const snippet = transcript.trim().slice(0, 180)
  const keywords = transcript
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)

  return {
    summary: snippet ? `${snippet}${transcript.length > 180 ? '...' : ''}` : '요약 준비 중',
    questions: keywords.length
      ? keywords.map((item, index) => `${index + 1}. ${item}와 관련된 학생 질문을 다시 확인해 보세요.`).join('\n')
      : null,
    nextPoints: keywords.length
      ? `${keywords[0]} 복습 질문과 다음 수업 연결 포인트를 먼저 확인합니다.`
      : '다음 수업 연결 포인트를 정리합니다.',
  }
}

function buildStoredFileName(originalName: string, mimeType: string) {
  const extension = path.extname(originalName).trim() || mimeType.split('/')[1]?.trim() || 'webm'
  const sanitizedBase = path
    .basename(originalName, path.extname(originalName))
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${Date.now()}-${randomUUID()}-${sanitizedBase || 'recording'}.${extension.replace(/^\./, '')}`
}

async function storeRecordingFile(file: File) {
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  const storedName = buildStoredFileName(file.name || 'recording', file.type || 'audio/webm')
  const absolutePath = path.join(publicRecordingDir, storedName)
  await mkdir(publicRecordingDir, { recursive: true })
  await writeFile(absolutePath, fileBuffer)

  return {
    fileBuffer,
    audioUrl: `/uploads/recordings/${storedName}`,
    storedName,
  }
}

async function transcribeRecording(params: {
  fileBuffer: Buffer
  fileName: string
  mimeType: string
}) {
  const client = getOpenAIClient()
  const transcription = await client.audio.transcriptions.create({
    model: getWhisperModel(),
    file: await toFile(params.fileBuffer, params.fileName, {
      type: params.mimeType || 'audio/webm',
    }),
  })

  return transcription.text?.trim() || ''
}

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { searchParams, page, limit, skip } = getPageParams(request)
    const classId = searchParams.get('classId')
    const lessonId = searchParams.get('lessonId')
    const status = searchParams.get('status')

    if (status && !recordingStatuses.has(status as 'PROCESSING' | 'COMPLETED' | 'FAILED')) {
      return errorResponse('VALIDATION', '녹음 상태 필터가 올바르지 않습니다.', 400)
    }

    const teacherClassIds =
      session.user.role === 'TEACHER' ? await getTeacherClassIds(session.user.id) : []

    const where = {
      lesson: {
        class: {
          academyId: session.user.academyId,
          ...(session.user.role === 'TEACHER' ? { id: { in: teacherClassIds } } : {}),
          ...(classId ? { id: classId } : {}),
        },
      },
      ...(lessonId ? { lessonId } : {}),
      ...(status ? { status: status as 'PROCESSING' | 'COMPLETED' | 'FAILED' } : {}),
    }

    const [items, total] = await Promise.all([
      prisma.recordingSummary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          lesson: {
            select: {
              id: true,
              date: true,
              topic: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.recordingSummary.count({ where }),
    ])

    return paginatedResponse(items, total, page, limit)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리 목록을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = rateLimit(request, { limit: 5, windowMs: 60_000 })
  if (rateLimitError) return rateLimitError

  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const contentType = request.headers.get('content-type') ?? ''
    let data:
      | {
          lessonId: string
          audioUrl?: string | null
          transcript?: string | null
        }
      | null = null
    let uploadedFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      uploadedFile = file instanceof File ? file : null

      if (!uploadedFile || uploadedFile.size === 0) {
        return errorResponse('VALIDATION', '녹음 파일을 선택해 주세요.', 400)
      }

      if (
        uploadedFile.type &&
        !uploadedFile.type.startsWith('audio/') &&
        uploadedFile.type !== 'video/webm'
      ) {
        return errorResponse('VALIDATION', '오디오 파일만 업로드할 수 있습니다.', 400)
      }

      const parsed = recordingCreateSchema.safeParse({
        lessonId: formData.get('lessonId'),
        audioUrl: null,
        transcript: formData.get('transcript'),
      })

      if (!parsed.success) {
        return errorResponse(
          'VALIDATION',
          '녹음 업로드 요청이 올바르지 않습니다.',
          400,
          parsed.error.flatten(),
        )
      }

      data = parsed.data
    } else {
      const parsedBody = await parseRequestBody(request, recordingCreateSchema)
      if (parsedBody.error || !parsedBody.data) {
        return parsedBody.error
      }
      data = parsedBody.data
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId },
      include: {
        class: {
          select: {
            id: true,
            academyId: true,
            name: true,
          },
        },
      },
    })

    if (!lesson || lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '수업을 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 수업 녹음만 등록할 수 있습니다.', 403)
    }

    let audioUrl = data.audioUrl?.trim() || null
    const normalizedTranscript = data.transcript?.trim() || null

    // If a transcript was provided directly, we can complete immediately
    if (!uploadedFile) {
      const generated = normalizedTranscript ? summarizeTranscript(normalizedTranscript) : null
      const created = await prisma.recordingSummary.create({
        data: {
          lessonId: data.lessonId,
          audioUrl,
          transcript: normalizedTranscript,
          summary: generated?.summary ?? null,
          questions: generated?.questions ?? null,
          nextPoints: generated?.nextPoints ?? null,
          status: normalizedTranscript ? 'COMPLETED' : 'PROCESSING',
          progress: normalizedTranscript ? 100 : 15,
        },
        include: {
          lesson: {
            select: {
              id: true,
              date: true,
              topic: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      })
      return successResponse(created, 201)
    }

    // File upload: store the file and return a PROCESSING record immediately.
    // Whisper transcription runs after the response is sent via after().
    const stored = await storeRecordingFile(uploadedFile)
    audioUrl = stored.audioUrl

    const created = await prisma.recordingSummary.create({
      data: {
        lessonId: data.lessonId,
        audioUrl,
        transcript: normalizedTranscript,
        summary: null,
        questions: null,
        nextPoints: null,
        status: normalizedTranscript ? 'COMPLETED' : 'PROCESSING',
        progress: normalizedTranscript ? 100 : 25,
      },
      include: {
        lesson: {
          select: {
            id: true,
            date: true,
            topic: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!normalizedTranscript) {
      const recordingId = created.id
      const { storedName } = stored
      const mimeType = uploadedFile.type

      after(async () => {
        try {
          const fileBuffer = await readFile(path.join(publicRecordingDir, storedName))
          const transcript = await transcribeRecording({ fileBuffer, fileName: storedName, mimeType })

          if (transcript) {
            const generated = summarizeTranscript(transcript)
            await prisma.recordingSummary.update({
              where: { id: recordingId },
              data: {
                transcript,
                summary: generated.summary,
                questions: generated.questions,
                nextPoints: generated.nextPoints,
                status: 'COMPLETED',
                progress: 100,
              },
            })
          } else {
            await prisma.recordingSummary.update({
              where: { id: recordingId },
              data: { status: 'FAILED', progress: 0 },
            })
          }
        } catch {
          await prisma.recordingSummary.update({
            where: { id: recordingId },
            data: { status: 'FAILED', progress: 0 },
          }).catch(() => {})
        }
      })
    }

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리를 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
