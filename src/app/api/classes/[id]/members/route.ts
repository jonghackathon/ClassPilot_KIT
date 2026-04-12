import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { classMemberSchema } from '@/lib/validations/classes'
import { withAuth } from '@/lib/with-auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const classId = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, classMemberSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.class.findFirst({
    where: { id: classId, academyId: session.user.academyId },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '반을 찾을 수 없습니다.', 404)
  }

  await prisma.$transaction([
    ...data.addStudentIds.map((studentId) =>
      prisma.enrollment.upsert({
        where: {
          classId_studentId: {
            classId,
            studentId,
          },
        },
        create: {
          classId,
          studentId,
          active: true,
        },
        update: {
          active: true,
          deletedAt: null,
        },
      }),
    ),
    ...(data.removeStudentIds.length
      ? [
          prisma.enrollment.updateMany({
            where: {
              classId,
              studentId: { in: data.removeStudentIds },
            },
            data: {
              active: false,
              deletedAt: new Date(),
            },
          }),
        ]
      : []),
  ])

  const members = await prisma.enrollment.findMany({
    where: {
      classId,
      active: true,
    },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return successResponse({ classId, members })
}
