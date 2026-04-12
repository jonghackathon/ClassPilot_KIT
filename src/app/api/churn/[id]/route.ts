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

    const item = await prisma.churnPrediction.findFirst({
      where: {
        id,
        student: {
          academyId: session.user.academyId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!item) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 상세를 불러오지 못했습니다.'
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
      level?: 'LOW' | 'MEDIUM' | 'HIGH'
      score?: number
      factors?: unknown
      note?: string | null
      resolved?: boolean
    }

    const existing = await prisma.churnPrediction.findFirst({
      where: {
        id,
        student: {
          academyId: session.user.academyId,
        },
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    const updated = await prisma.churnPrediction.update({
      where: { id },
      data: {
        ...(body.level ? { level: body.level } : {}),
        ...(typeof body.score === 'number'
          ? { score: Math.max(0, Math.min(100, body.score)) }
          : {}),
        ...(body.factors !== undefined ? { factors: body.factors } : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        ...(body.resolved !== undefined ? { resolved: body.resolved } : {}),
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 정보를 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { id } = await params

    const existing = await prisma.churnPrediction.findFirst({
      where: {
        id,
        student: {
          academyId: session.user.academyId,
        },
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '이탈 예측 정보를 찾을 수 없습니다.', 404)
    }

    await prisma.churnPrediction.delete({ where: { id } })

    return successResponse({ id, deleted: true })
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '이탈 예측 정보를 삭제하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
