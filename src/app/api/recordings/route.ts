import { prisma } from '@/lib/db'
import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getPageParams, withAuth } from '@/lib/with-auth'

function summarizeTranscript(transcript: string) {
  const snippet = transcript.trim().slice(0, 180)

  return {
    summary: snippet ? `${snippet}${transcript.length > 180 ? '...' : ''}` : '요약 준비 중',
    keyPhrases: transcript
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5),
    actionItems: ['다음 수업 목표를 정리합니다.', '복습 과제를 연결합니다.'],
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
    const status = searchParams.get('status')

    const where = {
      ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      ...(classId ? { classId } : {}),
      ...(status
        ? {
            status: status as 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.recordingSummary.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
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
    const body = (await request.json()) as {
      classId?: string | null
      title?: string | null
      originalFileName?: string | null
      transcript?: string | null
      audioUrl?: string | null
    }

    const generated = summarizeTranscript(body.transcript ?? '')

    const created = await prisma.recordingSummary.create({
      data: {
        classId: body.classId ?? null,
        teacherId: session.user.id,
        title: body.title ?? '새 녹음 정리',
        originalFileName: body.originalFileName ?? 'recording.m4a',
        transcript: body.transcript ?? '',
        audioUrl: body.audioUrl ?? null,
        status: 'COMPLETED',
        summary: generated.summary,
        keyPhrases: generated.keyPhrases,
        actionItems: generated.actionItems,
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리를 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
