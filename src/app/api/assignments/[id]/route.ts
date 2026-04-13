import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { assignmentUpdateSchema } from '@/lib/validations/assignments'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          subject: true,
          level: true,
          academyId: true,
        },
      },
      teacher: { select: { id: true, name: true, email: true } },
      submissions:
        session.user.role === 'STUDENT'
          ? { where: { studentId: session.user.id } }
          : true,
    },
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

  if (session.user.role === 'STUDENT') {
    const enrolled = await prisma.enrollment.findFirst({
      where: {
        classId: assignment.classId,
        studentId: session.user.id,
        active: true,
      },
    })
    if (!enrolled) {
      return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
    }
  }

  return successResponse(assignment)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.assignment.findUnique({
    where: { id },
    include: { class: { select: { academyId: true } } },
  })
  if (!current) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }
  if (current.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(current.teacherId === session.user.id || (await teacherHasClassAccess(session.user.id, current.classId)))
  ) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = assignmentUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '과제 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.teacherId ? { teacherId: data.teacherId } : {}),
      ...(data.title ? { title: data.title } : {}),
      ...(data.content !== undefined ? { content: data.content ?? null } : {}),
      ...(data.type ? { type: data.type } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate ? new Date(data.dueDate) : null }
        : {}),
      ...(data.teacherNote !== undefined
        ? { teacherNote: data.teacherNote ?? null }
        : {}),
      ...(data.imageUrls ? { imageUrls: data.imageUrls } : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  })

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.assignment.findUnique({
    where: { id },
    include: { class: { select: { academyId: true } } },
  })
  if (!current) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }
  if (current.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(current.teacherId === session.user.id || (await teacherHasClassAccess(session.user.id, current.classId)))
  ) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  await prisma.assignment.delete({ where: { id } })
  return successResponse({ id })
}
