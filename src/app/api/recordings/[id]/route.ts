import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

const recordingUpdateSchema = z.object({
  audioUrl: z.string().trim().url().optional().nullable(),
  transcript: z.string().trim().optional().nullable(),
  summary: z.string().trim().optional().nullable(),
  questions: z.string().trim().optional().nullable(),
  nextPoints: z.string().trim().optional().nullable(),
  status: z.enum(['PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
})

type Params = Promise<{ id: string }>

export async function GET(_request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const id = await getRouteId({ params })
    const item = await prisma.recordingSummary.findUnique({
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
                room: true,
              },
            },
          },
        },
      },
    })

    if (!item || item.lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '녹음 정리 정보를 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, item.lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 녹음 정리만 조회할 수 있습니다.', 403)
    }

    return successResponse(item)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리 상세를 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function PATCH(request: Request, { params }: { params: Params }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const id = await getRouteId({ params })
    const existing = await prisma.recordingSummary.findUnique({
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
      return errorResponse('NOT_FOUND', '녹음 정리 정보를 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, existing.lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 녹음 정리만 수정할 수 있습니다.', 403)
    }

    const { data, error: validationError } = await parseRequestBody(request, recordingUpdateSchema)
    if (validationError || !data) {
      return validationError
    }

    const updated = await prisma.recordingSummary.update({
      where: { id },
      data: {
        ...(data.audioUrl !== undefined ? { audioUrl: data.audioUrl?.trim() || null } : {}),
        ...(data.transcript !== undefined ? { transcript: data.transcript?.trim() || null } : {}),
        ...(data.summary !== undefined ? { summary: data.summary?.trim() || null } : {}),
        ...(data.questions !== undefined ? { questions: data.questions?.trim() || null } : {}),
        ...(data.nextPoints !== undefined ? { nextPoints: data.nextPoints?.trim() || null } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
      },
      include: {
        lesson: {
          select: {
            id: true,
            date: true,
            topic: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    })

    return successResponse(updated)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '녹음 정리 정보를 수정하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
