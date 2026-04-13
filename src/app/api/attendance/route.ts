import { paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, toDate } from '@/lib/route-helpers'
import { attendanceCreateSchema } from '@/lib/validations/attendance'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId')
  const studentId = searchParams.get('studentId')
  const status = searchParams.get('status')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const dateFilter = {
    ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
    ...(dateTo ? { lte: new Date(dateTo) } : {}),
  }

  const where =
    session.user.role === 'ADMIN'
      ? {
          class: { academyId: session.user.academyId },
          ...(classId ? { classId } : {}),
          ...(studentId ? { studentId } : {}),
          ...(status ? { status: status as 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' } : {}),
          ...(dateFrom || dateTo ? { date: dateFilter } : {}),
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
            ...(studentId ? { studentId } : {}),
            ...(status ? { status: status as 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' } : {}),
            ...(dateFrom || dateTo ? { date: dateFilter } : {}),
          }
        : {
            studentId: session.user.id,
            ...(classId ? { classId } : {}),
            ...(status ? { status: status as 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT' } : {}),
            ...(dateFrom || dateTo ? { date: dateFilter } : {}),
          }

  const [items, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      include: {
        class: true,
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lesson: true,
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, attendanceCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const foundClass = await prisma.class.findFirst({
    where:
      session.user.role === 'ADMIN'
        ? { id: data.classId, academyId: session.user.academyId }
        : {
            id: data.classId,
            academyId: session.user.academyId,
            teachers: { some: { teacherId: session.user.id } },
          },
    select: { id: true },
  })

  if (!foundClass) {
    return Response.json(
      {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '출결을 기록할 반을 찾을 수 없습니다.',
        },
      },
      { status: 404 },
    )
  }

  const created = await prisma.attendance.upsert({
    where: {
      date_studentId_classId: {
        date: new Date(data.date),
        studentId: data.studentId,
        classId: data.classId,
      },
    },
    create: {
      classId: data.classId,
      studentId: data.studentId,
      lessonId: data.lessonId ?? null,
      date: new Date(data.date),
      status: data.status,
      homeworkStatus: data.homeworkStatus ?? null,
      homeworkNote: data.homeworkNote ?? null,
      absenceReason: data.absenceReason ?? null,
    },
    update: {
      lessonId: data.lessonId ?? null,
      status: data.status,
      homeworkStatus: data.homeworkStatus ?? null,
      homeworkNote: data.homeworkNote ?? null,
      absenceReason: data.absenceReason ?? null,
    },
    include: {
      class: true,
      student: true,
      lesson: true,
    },
  })

  return successResponse(created, 201)
}
