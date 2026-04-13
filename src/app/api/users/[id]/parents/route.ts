import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { parentCreateSchema } from '@/lib/validations/users'
import { withAuth } from '@/lib/with-auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error) {
    return error
  }

  const userId = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(
    request,
    parentCreateSchema,
  )

  if (validationError || !data) {
    return validationError
  }

  const student = await prisma.user.findFirst({
    where: {
      id: userId,
      academyId: session.user.academyId,
      role: 'STUDENT',
    },
    select: {
      id: true,
      studentProfile: {
        select: {
          id: true,
          parents: {
            select: {
              id: true,
            },
            orderBy: { createdAt: 'asc' },
            take: 1,
          },
        },
      },
    },
  })

  if (!student) {
    return errorResponse('NOT_FOUND', '학생을 찾을 수 없습니다.', 404)
  }

  if (!student.studentProfile) {
    const createdProfile = await prisma.studentProfile.create({
      data: {
        userId: student.id,
        parents: {
          create: {
            name: data.name,
            phone: data.phone,
            relation: data.relation ?? null,
          },
        },
      },
      include: {
        parents: true,
      },
    })

    return successResponse(createdProfile.parents[0], 201)
  }

  if (student.studentProfile.parents[0]) {
    const updatedParent = await prisma.parentContact.update({
      where: {
        id: student.studentProfile.parents[0].id,
      },
      data: {
        name: data.name,
        phone: data.phone,
        relation: data.relation ?? null,
      },
    })

    return successResponse(updatedParent)
  }

  const createdParent = await prisma.parentContact.create({
    data: {
      studentProfileId: student.studentProfile.id,
      name: data.name,
      phone: data.phone,
      relation: data.relation ?? null,
    },
  })

  return successResponse(createdParent, 201)
}
