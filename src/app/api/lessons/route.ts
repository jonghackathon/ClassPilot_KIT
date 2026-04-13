import { NextRequest } from 'next/server'

import { errorResponse, paginatedResponse } from '@/lib/api-response'
import { getTeacherClassIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { getPageParams, withAuth } from '@/lib/with-auth'

const lessonStatuses = new Set(['SCHEDULED', 'COMPLETED', 'CANCELLED'])

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function parseDateParam(value?: string | null, boundary: 'start' | 'end' = 'start') {
  if (!value) {
    return null
  }

  const parsed = isDateOnly(value)
    ? new Date(`${value}T${boundary === 'start' ? '00:00:00.000' : '23:59:59.999'}`)
    : new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId') ?? undefined
  const scheduleId = searchParams.get('scheduleId') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const from = parseDateParam(searchParams.get('from'), 'start')
  const to = parseDateParam(searchParams.get('to'), 'end')

  if ((searchParams.get('from') && !from) || (searchParams.get('to') && !to)) {
    return errorResponse('VALIDATION', '날짜 필터 형식이 올바르지 않습니다.', 400)
  }
  if (status && !lessonStatuses.has(status)) {
    return errorResponse('VALIDATION', '수업 상태 필터가 올바르지 않습니다.', 400)
  }

  const teacherClassIds =
    session.user.role === 'TEACHER' ? await getTeacherClassIds(session.user.id) : []

  const where: Record<string, unknown> = {
    class: { academyId: session.user.academyId },
    ...(session.user.role === 'TEACHER' ? { classId: { in: teacherClassIds } } : {}),
    ...(classId ? { classId } : {}),
    ...(scheduleId ? { scheduleId } : {}),
    ...(status ? { status } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.lesson.findMany({
      where,
      include: {
        class: { select: { id: true, name: true } },
        schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
        weekNotes: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            studentReaction: true,
            curriculumStage: true,
            curriculumLesson: true,
            autoAssign: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.lesson.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}
