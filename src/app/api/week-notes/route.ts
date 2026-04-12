import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { weekNoteCreateSchema } from '@/lib/validations/week-notes'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId') ?? undefined
  const teacherClassIds =
    session.user.role === 'TEACHER' ? await getTeacherClassIds(session.user.id) : []
  const where: Record<string, unknown> = {
    class: { academyId: session.user.academyId },
    ...(session.user.role === 'TEACHER' ? { classId: { in: teacherClassIds } } : {}),
    ...(classId ? { classId } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.weekNote.count({ where }),
    prisma.weekNote.findMany({
      where,
      orderBy: [{ date: 'desc' }],
      skip,
      take: limit,
      include: {
        class: { select: { id: true, name: true } },
        schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
        lesson: { select: { id: true, date: true, topic: true } },
      },
    }),
  ])

  return successResponse({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = weekNoteCreateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '수업 기록이 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, data.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 기록할 수 있습니다.', 403)
  }

  const created = await prisma.weekNote.upsert({
    where: {
      classId_date: {
        classId: data.classId,
        date: new Date(data.date),
      },
    },
    create: {
      ...data,
      date: new Date(data.date),
    },
    update: {
      scheduleId: data.scheduleId ?? undefined,
      lessonId: data.lessonId ?? undefined,
      content: data.content,
      studentReaction: data.studentReaction ?? null,
      curriculumStage: data.curriculumStage ?? null,
      curriculumLesson: data.curriculumLesson ?? null,
      autoAssign: data.autoAssign ?? false,
      date: new Date(data.date),
    },
    include: {
      class: { select: { id: true, name: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  return successResponse(created, 201)
}
