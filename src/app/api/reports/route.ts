import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { reportCreateSchema } from '@/lib/validations/reports'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const studentId =
    session.user.role === 'STUDENT'
      ? session.user.id
      : searchParams.get('studentId') ?? undefined
  const monthStr = searchParams.get('monthStr') ?? undefined
  const teacherStudentIds =
    session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []

  const where: Record<string, unknown> = {
    student: { academyId: session.user.academyId },
    ...(session.user.role === 'TEACHER' ? { studentId: { in: teacherStudentIds } } : {}),
    ...(studentId ? { studentId } : {}),
    ...(monthStr ? { monthStr } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.reportData.count({ where }),
    prisma.reportData.findMany({
      where,
      orderBy: [{ monthStr: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: { student: { select: { id: true, name: true, email: true } } },
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
  if (error || !session) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = reportCreateSchema.safeParse({
    ...body,
    studentId: body.studentId ?? session.user.id,
  })
  if (!parsed.success) {
    return errorResponse('VALIDATION', '보고서 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  if (
    session.user.role === 'TEACHER' &&
    !teacherStudentIds.includes(data.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 보고서만 작성할 수 있습니다.', 403)
  }

  const created = await prisma.reportData.upsert({
    where: {
      studentId_monthStr: {
        studentId: data.studentId,
        monthStr: data.monthStr,
      },
    },
    create: {
      ...data,
      comment: data.comment ?? null,
      growth: data.growth ?? null,
      attendanceSummary: data.attendanceSummary ?? null,
      assignmentSummary: data.assignmentSummary ?? null,
    },
    update: {
      comment: data.comment ?? null,
      growth: data.growth ?? null,
      attendanceSummary: data.attendanceSummary ?? null,
      assignmentSummary: data.assignmentSummary ?? null,
    },
    include: { student: { select: { id: true, name: true, email: true } } },
  })

  return successResponse(created, 201)
}
