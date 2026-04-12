import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { feedbackSchema } from '@/lib/validations/assignments'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { class: { select: { academyId: true } } },
  })
  if (!assignment) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }
  if (assignment.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(assignment.teacherId === session.user.id || (await teacherHasClassAccess(session.user.id, assignment.classId)))
  ) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '피드백 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      feedback: parsed.data.feedback ?? parsed.data.teacherFeedback,
    },
  })

  return successResponse(updated)
}
