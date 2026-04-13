import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { assignmentCreateSchema } from '@/lib/validations/assignments'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId') ?? undefined
  const status = searchParams.get('status') ?? undefined

  let classIds: string[] | undefined = classId ? [classId] : undefined
  if (session.user.role === 'STUDENT') {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.user.id, active: true },
      select: { classId: true },
    })
    classIds = enrollments.map((item: { classId: string }) => item.classId)
  }
  if (session.user.role === 'TEACHER' && !classId) {
    classIds = await getTeacherClassIds(session.user.id)
  }

  const where: Record<string, unknown> = {
    class: { academyId: session.user.academyId },
    ...(classIds ? { classId: { in: classIds } } : {}),
    ...(status ? { submissions: { some: { status } } } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.assignment.count({ where }),
    prisma.assignment.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        class: { select: { id: true, name: true, subject: true } },
        teacher: { select: { id: true, name: true, email: true } },
        submissions:
          session.user.role === 'STUDENT'
            ? {
                where: { studentId: session.user.id },
                select: {
                  id: true,
                  status: true,
                  teacherFeedback: true,
                },
              }
            : {
                select: {
                  id: true,
                  status: true,
                  teacherFeedback: true,
                },
              },
      },
    }),
  ])

  return successResponse({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = assignmentCreateSchema.safeParse({
    ...body,
    teacherId: body.teacherId ?? session.user.id,
  })
  if (!parsed.success) {
    return errorResponse('VALIDATION', '과제 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, data.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반에만 과제를 생성할 수 있습니다.', 403)
  }

  const assignment = await prisma.assignment.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    include: {
      class: { select: { id: true, name: true, subject: true } },
      teacher: { select: { id: true, name: true, email: true } },
      submissions: {
        select: {
          id: true,
          status: true,
          teacherFeedback: true,
        },
      },
    },
  })

  return successResponse(assignment, 201)
}
