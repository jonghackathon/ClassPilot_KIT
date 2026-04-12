import { paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains, toDate } from '@/lib/route-helpers'
import { paymentCreateSchema } from '@/lib/validations/payments'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const month = searchParams.get('month')
  const status = searchParams.get('status')
  const studentId = searchParams.get('studentId')
  const classId = searchParams.get('classId')
  const keyword = searchParams.get('q')

  const where =
    session.user.role === 'ADMIN'
      ? {
          student: {
            academyId: session.user.academyId,
            ...(keyword
              ? {
                  OR: [
                    { name: searchContains(keyword) },
                    { email: searchContains(keyword) },
                  ],
                }
              : {}),
          },
          ...(month ? { month } : {}),
          ...(status ? { status: status as 'PAID' | 'UNPAID' | 'PARTIAL' } : {}),
          ...(studentId ? { studentId } : {}),
          ...(classId ? { classId } : {}),
        }
      : {
          studentId: session.user.id,
          ...(month ? { month } : {}),
          ...(status ? { status: status as 'PAID' | 'UNPAID' | 'PARTIAL' } : {}),
          ...(classId ? { classId } : {}),
        }

  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: true,
      },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, paymentCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const created = await prisma.payment.upsert({
    where: {
      studentId_classId_month: {
        studentId: data.studentId,
        classId: data.classId,
        month: data.month,
      },
    },
    create: {
      studentId: data.studentId,
      classId: data.classId,
      amount: data.amount,
      status: data.status,
      month: data.month,
      paidAt: toDate(data.paidAt),
      note: data.note ?? null,
    },
    update: {
      amount: data.amount,
      status: data.status,
      paidAt: toDate(data.paidAt),
      note: data.note ?? null,
    },
    include: {
      student: true,
      class: true,
    },
  })

  return successResponse(created, 201)
}
