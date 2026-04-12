import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { qnaAnswerSchema } from '@/lib/validations/qna'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.botQuestion.findUnique({
    where: { id },
    include: {
      student: { select: { academyId: true } },
    },
  })
  if (!current || current.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '질문을 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(
      (current.classId &&
        (await getTeacherClassIds(session.user.id)).includes(current.classId)) ||
      (await getTeacherStudentIds(session.user.id)).includes(current.studentId)
    )
  ) {
    return errorResponse('FORBIDDEN', '담당 반 질문만 답변할 수 있습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = qnaAnswerSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '답변 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const updated = await prisma.botQuestion.update({
    where: { id },
    data: {
      teacherAnswer: parsed.data.teacherAnswer,
      status: 'TEACHER_ANSWERED',
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
  })

  return successResponse(updated)
}
