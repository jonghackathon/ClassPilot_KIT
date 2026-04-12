import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { scheduleCreateSchema } from '@/lib/validations/classes'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId')
  const dayOfWeek = searchParams.get('dayOfWeek')

  const where =
    session.user.role === 'ADMIN'
      ? {
          class: {
            academyId: session.user.academyId,
          },
          ...(classId ? { classId } : {}),
          ...(dayOfWeek ? { dayOfWeek: Number(dayOfWeek) } : {}),
        }
      : session.user.role === 'TEACHER'
        ? {
            class: {
              academyId: session.user.academyId,
              teachers: {
                some: { teacherId: session.user.id },
              },
            },
            ...(classId ? { classId } : {}),
            ...(dayOfWeek ? { dayOfWeek: Number(dayOfWeek) } : {}),
          }
        : {
            class: {
              academyId: session.user.academyId,
              enrollments: {
                some: {
                  studentId: session.user.id,
                  active: true,
                },
              },
            },
            ...(classId ? { classId } : {}),
            ...(dayOfWeek ? { dayOfWeek: Number(dayOfWeek) } : {}),
          }

  const [items, total] = await prisma.$transaction([
    prisma.schedule.findMany({
      where,
      include: {
        class: true,
        lessons: {
          orderBy: { date: 'asc' },
          take: 12,
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.schedule.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, scheduleCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const foundClass = await prisma.class.findFirst({
    where: {
      id: data.classId,
      academyId: session.user.academyId,
    },
    select: { id: true },
  })

  if (!foundClass) {
    return errorResponse('NOT_FOUND', '반을 찾을 수 없습니다.', 404)
  }

  const created = await prisma.schedule.create({
    data: {
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room ?? null,
      color: data.color ?? null,
      note: data.note ?? null,
    },
    include: {
      class: true,
    },
  })

  return successResponse(created, 201)
}
