import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { submissionSchema } from '@/lib/validations/assignments'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id: assignmentId } = await Promise.resolve(context.params)
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: { select: { academyId: true } } },
  })
  if (!assignment) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }
  if (assignment.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 조회할 수 있습니다.', 403)
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const studentId =
    session.user.role === 'STUDENT'
      ? session.user.id
      : searchParams.get('studentId') ?? undefined

  const where: Record<string, unknown> = {
    assignmentId,
    ...(studentId ? { studentId } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip,
      take: limit,
      include: {
        student: { select: { id: true, name: true, email: true } },
        assignment: { select: { id: true, title: true, type: true } },
        history: { orderBy: { createdAt: 'desc' }, take: 5 },
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

export async function POST(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id: assignmentId } = await Promise.resolve(context.params)
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: { select: { academyId: true } } },
  })
  if (!assignment) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }
  if (assignment.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 제출물을 등록할 수 있습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '제출 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const nextStatus = parsed.data.status ?? 'SUBMITTED'
  const submittedAt = nextStatus === 'SUBMITTED' ? new Date() : null

  const studentId =
    session.user.role === 'STUDENT'
      ? session.user.id
      : body.studentId ?? session.user.id

  if (session.user.role === 'STUDENT') {
    const enrolled = await prisma.enrollment.findFirst({
      where: { classId: assignment.classId, studentId, active: true },
    })
    if (!enrolled) {
      return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
    }
  }

  const submission = await prisma.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId,
        studentId,
      },
    },
    create: {
      assignmentId,
      studentId,
      content: parsed.data.content ?? null,
      attachments: parsed.data.attachments ?? [],
      aiUsed: parsed.data.aiUsed ?? false,
      aiUsageDetail: parsed.data.aiUsageDetail ?? null,
      status: nextStatus,
      submittedAt,
    },
    update: {
      content: parsed.data.content ?? null,
      attachments: parsed.data.attachments ?? [],
      aiUsed: parsed.data.aiUsed ?? false,
      aiUsageDetail: parsed.data.aiUsageDetail ?? null,
      status: nextStatus,
      submittedAt,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, type: true } },
      history: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  await prisma.submissionHistory.create({
    data: {
      submissionId: submission.id,
      content: parsed.data.content ?? '',
      attachments: parsed.data.attachments ?? [],
      charCount: (parsed.data.content ?? '').length,
    },
  })

  return successResponse(submission, 201)
}
