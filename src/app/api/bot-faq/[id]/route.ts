import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

type Params = Promise<{ id: string }>

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const { id } = await params
    const body = (await request.json()) as {
      question?: string
      answer?: string
      sortOrder?: number
    }

    const existing = await prisma.botFAQ.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', 'FAQ를 찾을 수 없습니다.', 404)
    }

    const updated = await prisma.botFAQ.update({
      where: { id },
      data: {
        ...(body.question !== undefined ? { question: body.question.trim() } : {}),
        ...(body.answer !== undefined ? { answer: body.answer.trim() } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'FAQ를 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const { id } = await params

    const existing = await prisma.botFAQ.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', 'FAQ를 찾을 수 없습니다.', 404)
    }

    await prisma.botFAQ.delete({ where: { id } })

    return successResponse({ id, deleted: true })
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'FAQ를 삭제하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
