import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

const sessionUpdateSchema = z.object({
  topic: z.string().trim().min(1).max(200).optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED']).optional(),
})

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const id = await getRouteId({ params })

    const item = await prisma.copilotSession.findUnique({
      where: { id },
      include: {
        lesson: {
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
              },
            },
          },
        },
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!item || item.lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, item.lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 코파일럿 세션만 조회할 수 있습니다.', 403)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const id = await getRouteId({ params })

    const existing = await prisma.copilotSession.findUnique({
      where: { id },
      include: {
        lesson: {
          include: {
            class: {
              select: {
                id: true,
                academyId: true,
              },
            },
          },
        },
      },
    })

    if (!existing || existing.lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, existing.lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 코파일럿 세션만 수정할 수 있습니다.', 403)
    }

    const { data, error: validationError } = await parseRequestBody(request, sessionUpdateSchema)
    if (validationError || !data) {
      return validationError
    }

    const updated = await prisma.copilotSession.update({
      where: { id },
      data: {
        ...(data.topic !== undefined ? { topic: data.topic?.trim() || null } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        lesson: {
          select: {
            id: true,
            date: true,
            topic: true,
            status: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
