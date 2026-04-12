import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains } from '@/lib/route-helpers'
import { consultationCreateSchema } from '@/lib/validations/consultations'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const studentId = searchParams.get('studentId')
  const ownerId = searchParams.get('ownerId')
  const type = searchParams.get('type')
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
          ...(studentId ? { studentId } : {}),
          ...(ownerId ? { ownerId } : {}),
          ...(type ? { type: type as 'PHONE' | 'TEXT' | 'IN_PERSON' } : {}),
        }
      : {
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
          ...(studentId ? { studentId } : {}),
          ...(type ? { type: type as 'PHONE' | 'TEXT' | 'IN_PERSON' } : {}),
        }

  const [items, total] = await prisma.$transaction([
    prisma.consultation.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        owner: {
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
    prisma.consultation.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, consultationCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  if (session.user.role === 'ADMIN' && !data.ownerId) {
    return errorResponse('VALIDATION', '상담 담당자를 선택해 주세요.', 400)
  }

  const created = await prisma.consultation.create({
    data: {
      studentId: data.studentId,
      ownerId: session.user.role === 'TEACHER' ? session.user.id : data.ownerId!,
      type: data.type,
      content: data.content,
    },
    include: {
      student: true,
      owner: true,
    },
  })

  return successResponse(created, 201)
}
