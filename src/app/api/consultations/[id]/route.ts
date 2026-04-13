import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { consultationUpdateSchema } from '@/lib/validations/consultations'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.consultation.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            student: { academyId: session.user.academyId },
          }
        : {
            id,
            OR: [
              { ownerId: session.user.id },
              {
                student: {
                  enrollments: {
                    some: {
                      active: true,
                      class: {
                        teachers: {
                          some: { teacherId: session.user.id },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
    include: {
      student: true,
      owner: true,
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '상담 기록을 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, consultationUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.consultation.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            student: { academyId: session.user.academyId },
          }
        : {
            id,
            ownerId: session.user.id,
          },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '상담 기록을 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.consultation.update({
    where: { id },
    data: {
      studentId: data.studentId,
      ownerId: session.user.role === 'TEACHER' ? session.user.id : data.ownerId,
      type: data.type,
      content: data.content,
    },
    include: {
      student: true,
      owner: true,
    },
  })

  return successResponse(updated)
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.consultation.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            student: { academyId: session.user.academyId },
          }
        : {
            id,
            ownerId: session.user.id,
          },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '상담 기록을 찾을 수 없습니다.', 404)
  }

  await prisma.consultation.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
