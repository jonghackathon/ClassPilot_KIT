import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody, toDate } from '@/lib/route-helpers'
import { userUpdateSchema } from '@/lib/validations/users'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const user = await prisma.user.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            academyId: session.user.academyId,
          }
        : {
            id,
            academyId: session.user.academyId,
            role: 'STUDENT',
            enrollments: {
              some: {
                class: {
                  teachers: {
                    some: { teacherId: session.user.id },
                  },
                },
              },
            },
          },
    include: {
      studentProfile: {
        include: {
          parents: true,
        },
      },
      enrollments: {
        include: {
          class: true,
        },
      },
    },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', '사용자를 찾을 수 없습니다.', 404)
  }

  return successResponse(user)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, userUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const user = await prisma.user.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
    },
    select: {
      id: true,
      role: true,
      studentProfile: {
        select: {
          id: true,
          parents: {
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', '사용자를 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      studentProfile:
        user.role === 'STUDENT' || data.role === 'STUDENT'
          ? {
              upsert: {
                create: {
                  grade: data.grade ?? null,
                  school: data.school ?? null,
                  birthDate: toDate(data.birthDate),
                  memo: data.memo ?? null,
                  parents:
                    data.parentName && data.parentPhone
                      ? {
                          create: [
                            {
                              name: data.parentName,
                              phone: data.parentPhone,
                            },
                          ],
                        }
                      : undefined,
                },
                update: {
                  grade: data.grade,
                  school: data.school,
                  birthDate: data.birthDate === undefined ? undefined : toDate(data.birthDate),
                  memo: data.memo,
                  parents:
                    data.parentName && data.parentPhone
                      ? user.studentProfile?.parents?.[0]
                        ? {
                            update: {
                              where: { id: user.studentProfile.parents[0].id },
                              data: {
                                name: data.parentName,
                                phone: data.parentPhone,
                              },
                            },
                          }
                        : {
                            create: [
                              {
                                name: data.parentName,
                                phone: data.parentPhone,
                              },
                            ],
                          }
                      : undefined,
                },
              },
            }
          : undefined,
    },
    include: {
      studentProfile: {
        include: {
          parents: true,
        },
      },
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

  const user = await prisma.user.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
    },
    select: { id: true },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', '사용자를 찾을 수 없습니다.', 404)
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  })

  return successResponse({ id, active: false })
}
