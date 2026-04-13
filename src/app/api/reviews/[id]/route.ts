import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { reviewUpdateSchema } from '@/lib/validations/review'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const review = await prisma.reviewSummary.findUnique({
    where: { id },
    include: { student: { select: { id: true, name: true, email: true, academyId: true } } },
  })

  if (!review || review.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '복습 기록을 찾을 수 없습니다.', 404)
  }

  if (session.user.role === 'STUDENT' && review.studentId !== session.user.id) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  return successResponse(review)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.reviewSummary.findUnique({
    where: { id },
    include: { student: { select: { academyId: true } } },
  })
  if (!current || current.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '복습 기록을 찾을 수 없습니다.', 404)
  }

  // STUDENT: 본인 복습의 readAt(읽음 처리)만 가능
  if (session.user.role === 'STUDENT') {
    if (current.studentId !== session.user.id) {
      return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
    }
    const updated = await prisma.reviewSummary.update({
      where: { id },
      data: { readAt: new Date() },
    })
    return successResponse(updated)
  }

  if (
    session.user.role === 'TEACHER' &&
    !(await getTeacherStudentIds(session.user.id)).includes(current.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 복습만 수정할 수 있습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = reviewUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '복습 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const updated = await prisma.reviewSummary.update({
    where: { id },
    data: {
      ...(data.studentId ? { studentId: data.studentId } : {}),
      ...(data.lessonId !== undefined ? { lessonId: data.lessonId ?? null } : {}),
      ...(data.summary ? { summary: data.summary } : {}),
      ...(data.quiz !== undefined ? { quiz: data.quiz ?? null } : {}),
      ...(data.preview !== undefined ? { preview: data.preview ?? null } : {}),
      ...(data.readAt !== undefined
        ? { readAt: data.readAt ? new Date(data.readAt) : null }
        : {}),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.reviewSummary.findUnique({
    where: { id },
    include: { student: { select: { academyId: true } } },
  })
  if (!current || current.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '복습 기록을 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await getTeacherStudentIds(session.user.id)).includes(current.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 복습만 삭제할 수 있습니다.', 403)
  }

  await prisma.reviewSummary.delete({ where: { id } })
  return successResponse({ id })
}
