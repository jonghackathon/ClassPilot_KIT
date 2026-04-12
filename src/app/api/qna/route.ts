import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds, getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { qnaCreateSchema } from '@/lib/validations/qna'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId') ?? undefined
  const status = searchParams.get('status') ?? undefined
  const studentId =
    session.user.role === 'STUDENT'
      ? session.user.id
      : searchParams.get('studentId') ?? undefined
  const teacherClassIds =
    session.user.role === 'TEACHER' ? await getTeacherClassIds(session.user.id) : []
  const teacherStudentIds =
    session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []

  const where: Record<string, unknown> = {
    student: { academyId: session.user.academyId },
    ...(session.user.role === 'TEACHER'
      ? {
          OR: [
            { classId: { in: teacherClassIds } },
            { studentId: { in: teacherStudentIds } },
          ],
        }
      : {}),
    ...(classId ? { classId } : {}),
    ...(status ? { status } : {}),
    ...(studentId ? { studentId } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.botQuestion.count({ where }),
    prisma.botQuestion.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        student: { select: { id: true, name: true, email: true } },
        class: { select: { id: true, name: true } },
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
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error || !session) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = qnaCreateSchema.safeParse({
    ...body,
    studentId: body.studentId ?? session.user.id,
  })
  if (!parsed.success) {
    return errorResponse('VALIDATION', '질문 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  if (
    session.user.role === 'TEACHER' &&
    data.classId &&
    !teacherClassIds.includes(data.classId)
  ) {
    return errorResponse('FORBIDDEN', '담당 반 질문만 등록할 수 있습니다.', 403)
  }

  const created = await prisma.botQuestion.create({
    data: {
      studentId: data.studentId,
      classId: data.classId ?? null,
      question: data.question,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { select: { id: true, name: true } },
    },
  })

  return successResponse(created, 201)
}
