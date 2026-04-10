import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { weekNoteUpdateSchema } from '@/lib/validations/week-notes'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const item = await prisma.weekNote.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, academyId: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  if (!item || item.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업 기록을 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, item.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 조회할 수 있습니다.', 403)
  }

  return successResponse(item)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.weekNote.findUnique({
    where: { id },
    include: { class: { select: { academyId: true } } },
  })
  if (!current || current.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업 기록을 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, current.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 수정할 수 있습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = weekNoteUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '수업 기록이 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const updated = await prisma.weekNote.update({
    where: { id },
    data: {
      ...(data.classId ? { classId: data.classId } : {}),
      ...(data.scheduleId !== undefined
        ? { scheduleId: data.scheduleId ?? null }
        : {}),
      ...(data.lessonId !== undefined ? { lessonId: data.lessonId ?? null } : {}),
      ...(data.date ? { date: new Date(data.date) } : {}),
      ...(data.content ? { content: data.content } : {}),
      ...(data.studentReaction !== undefined
        ? { studentReaction: data.studentReaction ?? null }
        : {}),
      ...(data.curriculumStage !== undefined
        ? { curriculumStage: data.curriculumStage ?? null }
        : {}),
      ...(data.curriculumLesson !== undefined
        ? { curriculumLesson: data.curriculumLesson ?? null }
        : {}),
      ...(data.autoAssign !== undefined ? { autoAssign: data.autoAssign } : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.weekNote.findUnique({
    where: { id },
    include: { class: { select: { academyId: true } } },
  })
  if (!current || current.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업 기록을 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, current.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 삭제할 수 있습니다.', 403)
  }

  await prisma.weekNote.delete({ where: { id } })
  return successResponse({ id })
}
