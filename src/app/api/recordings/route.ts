import { z } from 'zod'

import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { getPageParams, withAuth } from '@/lib/with-auth'

const recordingStatuses = new Set(['PROCESSING', 'COMPLETED', 'FAILED'] as const)

const recordingCreateSchema = z.object({
  lessonId: z.string().cuid(),
  audioUrl: z.string().trim().url().optional().nullable(),
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

export async function POST(request: Request) {
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

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file')
      const parsed = recordingCreateSchema.safeParse({
        lessonId: formData.get('lessonId'),
        audioUrl:
          file instanceof File && file.name
            ? `upload://${file.name}`
            : formData.get('audioUrl'),
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

    const normalizedTranscript = data.transcript?.trim() || null
    const generated = normalizedTranscript ? summarizeTranscript(normalizedTranscript) : null

    const created = await prisma.recordingSummary.create({
      data: {
        lessonId: data.lessonId,
        audioUrl: data.audioUrl?.trim() || null,
        transcript: normalizedTranscript,
        summary: generated?.summary ?? null,
        questions: generated?.questions ?? null,
        nextPoints: generated?.nextPoints ?? null,
        status: generated ? 'COMPLETED' : 'PROCESSING',
        progress: generated ? 100 : 15,
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
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리를 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
