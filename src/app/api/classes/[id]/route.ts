import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { classUpdateSchema } from '@/lib/validations/classes'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const where =
    session.user.role === 'ADMIN'
      ? { id, academyId: session.user.academyId }
      : session.user.role === 'TEACHER'
        ? {
            id,
            academyId: session.user.academyId,
            teachers: { some: { teacherId: session.user.id } },
          }
        : {
            id,
            academyId: session.user.academyId,
            enrollments: { some: { studentId: session.user.id, active: true } },
          }

  const found = await prisma.class.findFirst({
    where,
    include: {
      curriculum: true,
      teachers: {
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      enrollments: {
        where: { active: true },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              studentProfile: {
                select: {
                  grade: true,
                  school: true,
                },
              },
            },
          },
        },
      },
      schedules: true,
      assignments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      lessons: {
        orderBy: { date: 'desc' },
        take: 10,
      },
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '반을 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, classUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.class.findFirst({
    where: { id, academyId: session.user.academyId },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '반을 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.class.update({
    where: { id },
    data: {
      curriculumId: data.curriculumId === undefined ? undefined : data.curriculumId,
      name: data.name,
      subject: data.subject,
      level: data.level,
      description: data.description,
      capacity: data.capacity,
    },
    include: {
      curriculum: true,
    },
  })

  return successResponse(updated)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.class.findFirst({
    where: { id, academyId: session.user.academyId },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '반을 찾을 수 없습니다.', 404)
  }

  await prisma.class.delete({
    where: { id },
  })

  return successResponse({ id, deleted: true })
}
