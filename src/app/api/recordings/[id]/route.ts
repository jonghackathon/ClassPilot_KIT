import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { id } = await params
    const item = await prisma.recordingSummary.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      },
    })

    if (!item) {
      return errorResponse('NOT_FOUND', '녹음 정리 정보를 찾을 수 없습니다.', 404)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리 상세를 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { id } = await params
    const body = (await request.json()) as {
      title?: string | null
      summary?: string | null
      transcript?: string | null
      keyPhrases?: unknown
      actionItems?: unknown
      status?: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    }

    const existing = await prisma.recordingSummary.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '녹음 정리 정보를 찾을 수 없습니다.', 404)
    }

    const updated = await prisma.recordingSummary.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.summary !== undefined ? { summary: body.summary } : {}),
        ...(body.transcript !== undefined ? { transcript: body.transcript } : {}),
        ...(body.keyPhrases !== undefined ? { keyPhrases: body.keyPhrases } : {}),
        ...(body.actionItems !== undefined ? { actionItems: body.actionItems } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리 정보를 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
