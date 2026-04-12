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

    const item = await prisma.copilotSession.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!item) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 불러오지 못했습니다.'
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
      context?: string | null
      status?: 'READY' | 'IN_PROGRESS' | 'COMPLETED'
    }

    const existing = await prisma.copilotSession.findFirst({
      where: {
        id,
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    const updated = await prisma.copilotSession.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.context !== undefined ? { context: body.context } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
