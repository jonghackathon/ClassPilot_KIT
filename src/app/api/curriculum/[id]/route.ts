import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { curriculumUpdateSchema } from '@/lib/validations/curriculum'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.curriculumClass.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
    },
    include: {
      classes: {
        include: {
          teachers: {
            include: {
              teacher: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '커리큘럼을 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, curriculumUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.curriculumClass.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '커리큘럼을 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.curriculumClass.update({
    where: { id },
    data: {
      name: data.name,
      subject: data.subject,
      level: data.level,
      stages: data.stages,
      sortOrder: data.sortOrder,
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

  const found = await prisma.curriculumClass.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '커리큘럼을 찾을 수 없습니다.', 404)
  }

  await prisma.curriculumClass.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
