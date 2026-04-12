import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId, parseRequestBody, toDate } from '@/lib/route-helpers'
import { paymentUpdateSchema } from '@/lib/validations/payments'
import { withAuth } from '@/lib/with-auth'

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)

  const found = await prisma.payment.findFirst({
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
      class: true,
    },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '수납 정보를 찾을 수 없습니다.', 404)
  }

  return successResponse(found)
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const id = await getRouteId(context)
  const { data, error: validationError } = await parseRequestBody(request, paymentUpdateSchema)

  if (validationError || !data) {
    return validationError
  }

  const found = await prisma.payment.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '수납 정보를 찾을 수 없습니다.', 404)
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: {
      studentId: data.studentId,
      classId: data.classId,
      amount: data.amount,
      status: data.status,
      month: data.month,
      paidAt: data.paidAt === undefined ? undefined : toDate(data.paidAt),
      note: data.note,
    },
    include: {
      student: true,
      class: true,
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

  const found = await prisma.payment.findFirst({
    where: {
      id,
      student: { academyId: session.user.academyId },
    },
    select: { id: true },
  })

  if (!found) {
    return errorResponse('NOT_FOUND', '수납 정보를 찾을 수 없습니다.', 404)
  }

  await prisma.payment.delete({ where: { id } })

  return successResponse({ id, deleted: true })
}
