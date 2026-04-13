import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          academyId: true,
        },
      },
      schedule: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          room: true,
        },
      },
      weekNotes: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          date: true,
          content: true,
          studentReaction: true,
          curriculumStage: true,
          curriculumLesson: true,
          autoAssign: true,
          updatedAt: true,
        },
      },
      copilotSessions: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          teacherId: true,
          topic: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      recordings: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          audioUrl: true,
          transcript: true,
          summary: true,
          questions: true,
          nextPoints: true,
          status: true,
          progress: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!lesson || lesson.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업을 찾을 수 없습니다.', 404)
  }

  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, lesson.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반 수업만 조회할 수 있습니다.', 403)
  }

  return successResponse(lesson)
}
