import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { qnaAnswerSchema } from '@/lib/validations/qna'
import { withAuth } from '@/lib/with-auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, qnaAnswerSchema)

  if (validationError || !data) {
    return validationError
  }

  const question = await prisma.botQuestion.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: {
      id: true,
      classId: true,
    },
  })

  if (!question) {
    return errorResponse('NOT_FOUND', '질문을 찾을 수 없습니다.', 404)
  }

  if (session.user.role === 'TEACHER') {
    const teacherClassIds = await getTeacherClassIds(session.user.id)

    if (!teacherClassIds.includes(question.classId ?? '')) {
      return errorResponse('FORBIDDEN', '담당 반 질문만 답변할 수 있습니다.', 403)
    }
  }

  const updated = await prisma.botQuestion.update({
    where: { id },
    data: {
      teacherAnswer: data.teacherAnswer,
      status: 'TEACHER_ANSWERED',
    },
  })

  return successResponse(updated)
}
