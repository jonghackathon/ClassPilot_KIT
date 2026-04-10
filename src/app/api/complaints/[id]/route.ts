import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody } from '@/lib/route-helpers'
import { complaintUpdateSchema } from '@/lib/validations/complaints'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.complaint.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? {
            id,
            student: { academyId: session.user.academyId },
          }
        : {
            id,
            studentId: session.user.id,
          },
    include: {
      student: true,
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '민원을 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, complaintUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.complaint.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '민원을 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.complaint.update({
    where: { id },
    data: {
      studentId: data.studentId,
      content: data.content,
      response: data.response,
      aiDraft: data.aiDraft,
      status: data.status,
    },
    include: {
      student: true,
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

  const found = await prisma.complaint.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '민원을 찾을 수 없습니다.', 404)
  }

  await prisma.complaint.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
