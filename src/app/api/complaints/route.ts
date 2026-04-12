import { paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains } from '@/lib/route-helpers'
import { complaintCreateSchema } from '@/lib/validations/complaints'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const status = searchParams.get('status')
  const studentId = searchParams.get('studentId')
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
          ...(status ? { status: status as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' } : {}),
          ...(studentId ? { studentId } : {}),
        }
      : {
          studentId: session.user.id,
          ...(status ? { status: status as 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' } : {}),
        }

  const [items, total] = await prisma.$transaction([
    prisma.complaint.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, complaintCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const created = await prisma.complaint.create({
    data: {
      studentId: session.user.role === 'STUDENT' ? session.user.id : data.studentId,
      content: data.content,
      response: data.response ?? null,
      aiDraft: data.aiDraft ?? null,
      status: data.status ?? 'PENDING',
    },
    include: {
      student: true,
    },
  })

  return successResponse(created, 201)
}
