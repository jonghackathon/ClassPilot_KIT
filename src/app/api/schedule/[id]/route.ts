import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { scheduleUpdateSchema } from '@/lib/validations/classes'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)

  const where =
    session.user.role === 'ADMIN'
      ? { id, class: { academyId: session.user.academyId } }
      : session.user.role === 'TEACHER'
        ? {
            id,
            class: {
              academyId: session.user.academyId,
              teachers: { some: { teacherId: session.user.id } },
            },
          }
        : {
            id,
            class: {
              academyId: session.user.academyId,
              enrollments: { some: { studentId: session.user.id, active: true } },
            },
          }

  const found = await prisma.schedule.findFirst({
    where,
    include: {
      class: true,
      lessons: {
        orderBy: { date: 'asc' },
      },
      weekNotes: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '시간표를 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, scheduleUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.schedule.findFirst({
    where: {
      id,
      class: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '시간표를 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.schedule.update({
    where: { id },
    data: {
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room,
      color: data.color,
      note: data.note,
    },
    include: {
      class: true,
    },
  })

  return successResponse(updated)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.schedule.findFirst({
    where: {
      id,
      class: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '시간표를 찾을 수 없습니다.', 404)
  }

  await prisma.schedule.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
