import { qnaAnswerSchema, qnaUpdateSchema } from '@/lib/validations/qna'
import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { id } = await params
    const item = await prisma.botQuestion.findFirst({
      where: {
        id,
        ...(session.user.role === 'STUDENT' ? { studentId: session.user.id } : {}),
      },
    })

    if (!item) {
      return errorResponse('NOT_FOUND', '질문을 찾을 수 없습니다.', 404)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '질문 상세를 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { id } = await params
    const json = await request.json()

    const existing = await prisma.botQuestion.findFirst({
      where: {
        id,
        ...(session.user.role === 'STUDENT' ? { studentId: session.user.id } : {}),
      },
      select: { id: true },
    })

    if (!existing) {
      return errorResponse('NOT_FOUND', '질문을 찾을 수 없습니다.', 404)
    }

    if ('teacherAnswer' in json) {
      if (session.user.role === 'STUDENT') {
        return errorResponse('FORBIDDEN', '답변 권한이 없습니다.', 403)
      }

      const parsed = qnaAnswerSchema.safeParse(json)

      if (!parsed.success) {
        return errorResponse('VALIDATION', '답변 데이터를 다시 확인해 주세요.', 400, parsed.error.flatten())
      }

      const updated = await prisma.botQuestion.update({
        where: { id },
        data: {
          teacherAnswer: parsed.data.teacherAnswer,
          status: 'TEACHER_ANSWERED',
        },
      })

      return successResponse(updated)
    }

    const parsed = qnaUpdateSchema.safeParse(json)

    if (!parsed.success) {
      return errorResponse('VALIDATION', '질문 상태를 다시 확인해 주세요.', 400, parsed.error.flatten())
    }

    const updated = await prisma.botQuestion.update({
      where: { id },
      data: {
        ...(parsed.data.helpful !== undefined ? { helpful: parsed.data.helpful } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : '질문을 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
