import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

const lessonProgressSchema = z.object({
  date: z.string().datetime().optional(),
  scheduleId: z.string().cuid().optional().nullable(),
  content: z.string().min(1),
  studentReaction: z.string().optional().nullable(),
  curriculumStage: z.string().optional().nullable(),
  curriculumLesson: z.string().optional().nullable(),
  autoAssign: z.boolean().optional(),
})

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, academyId: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
    },
  })

  if (!lesson || lesson.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업을 찾을 수 없습니다.', 404)
  }

  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, lesson.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 진도 기록을 남길 수 있습니다.', 403)
  }

  const { data, error: validationError } = await parseRequestBody(request, lessonProgressSchema)
  if (validationError || !data) {
    return validationError
  }

  const noteDate = data.date ? new Date(data.date) : lesson.date
  if (Number.isNaN(noteDate.getTime())) {
    return errorResponse('VALIDATION', '진도 기록 날짜가 올바르지 않습니다.', 400)
  }

  const progress = await prisma.weekNote.upsert({
    where: {
      classId_date: {
        classId: lesson.classId,
        date: noteDate,
      },
    },
    create: {
      classId: lesson.classId,
      scheduleId: data.scheduleId ?? lesson.scheduleId ?? null,
      lessonId: lesson.id,
      date: noteDate,
      content: data.content.trim(),
      studentReaction: data.studentReaction?.trim() || null,
      curriculumStage: data.curriculumStage?.trim() || null,
      curriculumLesson: data.curriculumLesson?.trim() || null,
      autoAssign: data.autoAssign ?? true,
    },
    update: {
      scheduleId: data.scheduleId ?? lesson.scheduleId ?? null,
      lessonId: lesson.id,
      date: noteDate,
      content: data.content.trim(),
      studentReaction: data.studentReaction?.trim() || null,
      curriculumStage: data.curriculumStage?.trim() || null,
      curriculumLesson: data.curriculumLesson?.trim() || null,
      autoAssign: data.autoAssign ?? true,
    },
    include: {
      class: { select: { id: true, name: true } },
      schedule: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: true } },
      lesson: { select: { id: true, date: true, topic: true, status: true } },
    },
  })

  const updatedLesson = await prisma.lesson.update({
    where: { id: lesson.id },
    data: { status: 'COMPLETED' },
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
  })

  return successResponse(
    {
      lesson: updatedLesson,
      progress,
    },
    201,
  )
}
