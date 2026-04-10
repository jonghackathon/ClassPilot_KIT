import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody, toDate } from '@/lib/route-helpers'
import { attendanceUpdateSchema } from '@/lib/validations/attendance'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.attendance.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            class: { academyId: session.user.academyId },
          }
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
              studentId: session.user.id,
            },
    include: {
      class: true,
      student: true,
      lesson: true,
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '출결 정보를 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, attendanceUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.attendance.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? { id, class: { academyId: session.user.academyId } }
        : {
            id,
            class: {
              academyId: session.user.academyId,
              teachers: { some: { teacherId: session.user.id } },
            },
          },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '출결 정보를 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      classId: data.classId,
      studentId: data.studentId,
      lessonId: data.lessonId,
      date: data.date === undefined ? undefined : toDate(data.date),
      status: data.status,
      homeworkStatus: data.homeworkStatus,
      homeworkNote: data.homeworkNote,
      absenceReason: data.absenceReason,
    },
    include: {
      class: true,
      student: true,
      lesson: true,
    },
  })

  return successResponse(updated)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.attendance.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? { id, class: { academyId: session.user.academyId } }
        : {
            id,
            class: {
              academyId: session.user.academyId,
              teachers: { some: { teacherId: session.user.id } },
            },
          },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '출결 정보를 찾을 수 없습니다.', 404)
  }

  await prisma.attendance.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
