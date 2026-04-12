import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains } from '@/lib/route-helpers'
import { classCreateSchema } from '@/lib/validations/classes'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const keyword = searchParams.get('q')
  const subject = searchParams.get('subject')
  const level = searchParams.get('level')
  const curriculumId = searchParams.get('curriculumId')
  const teacherId = searchParams.get('teacherId')
  const studentId = searchParams.get('studentId')

  const baseWhere = {
    academyId: session.user.academyId,
    ...(subject ? { subject } : {}),
    ...(level ? { level } : {}),
    ...(curriculumId ? { curriculumId } : {}),
    ...(keyword
      ? {
          OR: [
            { name: searchContains(keyword) },
            { subject: searchContains(keyword) },
            { level: searchContains(keyword) },
            { description: searchContains(keyword) },
          ],
        }
      : {}),
  }

  const where =
    session.user.role === 'ADMIN'
      ? {
          ...baseWhere,
          ...(teacherId ? { teachers: { some: { teacherId } } } : {}),
          ...(studentId ? { enrollments: { some: { studentId, active: true } } } : {}),
        }
      : session.user.role === 'TEACHER'
        ? {
            ...baseWhere,
            teachers: {
              some: {
                teacherId: session.user.id,
              },
            },
          }
        : {
            ...baseWhere,
            enrollments: {
              some: {
                studentId: session.user.id,
                active: true,
              },
            },
          }

  const [items, total] = await prisma.$transaction([
    prisma.class.findMany({
      where,
      include: {
        curriculum: true,
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        enrollments: {
          where: { active: true },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        schedules: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.class.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, classCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const created = await prisma.class.create({
    data: {
      academyId: session.user.academyId,
      curriculumId: data.curriculumId ?? null,
      name: data.name,
      subject: data.subject ?? null,
      level: data.level ?? null,
      description: data.description ?? null,
      capacity: data.capacity,
    },
    include: {
      curriculum: true,
    },
  })

  return successResponse(created, 201)
}
