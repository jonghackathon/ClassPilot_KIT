import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { reviewCreateSchema } from '@/lib/validations/review'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const requestedStudentId =
    session.user.role === 'STUDENT'
      ? session.user.id
      : searchParams.get('studentId') ?? undefined
  const teacherStudentIds =
    session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []
  const studentIdFilter =
    session.user.role === 'TEACHER'
      ? requestedStudentId
        ? teacherStudentIds.includes(requestedStudentId)
          ? requestedStudentId
          : { in: [] as string[] }
        : { in: teacherStudentIds }
      : requestedStudentId

  const where: Record<string, unknown> = {
    student: { academyId: session.user.academyId },
    ...(studentIdFilter ? { studentId: studentIdFilter } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.reviewSummary.count({ where }),
    prisma.reviewSummary.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        student: { select: { id: true, name: true, email: true } },
        lesson: { select: { id: true, date: true, topic: true } },
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
  if (error || !session) return error
  const teacherStudentIds =
    session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = reviewCreateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '복습 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  if (
    session.user.role === 'TEACHER' &&
    !teacherStudentIds.includes(data.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 복습만 생성할 수 있습니다.', 403)
  }

  const created = await prisma.reviewSummary.create({
    data: {
      studentId: data.studentId,
      lessonId: data.lessonId ?? null,
      summary: data.summary,
      quiz: data.quiz ?? undefined,
      preview: data.preview ?? null,
      readAt: data.readAt ? new Date(data.readAt) : null,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  return successResponse(created, 201)
}
