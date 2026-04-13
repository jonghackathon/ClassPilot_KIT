import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { feedbackSchema, submissionSchema } from '@/lib/validations/assignments'

type RouteContext = {
  params: { id: string; submissionId: string } | Promise<{ id: string; submissionId: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id: assignmentId, submissionId } = await Promise.resolve(context.params)
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, assignmentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, type: true, classId: true } },
      history: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!submission) {
    return errorResponse('NOT_FOUND', '제출물을 찾을 수 없습니다.', 404)
  }

  if (
    session.user.role === 'STUDENT' &&
    submission.studentId !== session.user.id
  ) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, submission.assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 조회할 수 있습니다.', 403)
  }

  return successResponse(submission)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id: assignmentId, submissionId } = await Promise.resolve(context.params)
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, assignmentId },
    include: { assignment: { select: { classId: true, class: { select: { academyId: true } } } } },
  })
  if (!submission) {
    return errorResponse('NOT_FOUND', '제출물을 찾을 수 없습니다.', 404)
  }
  if (submission.assignment.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, submission.assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 수정할 수 있습니다.', 403)
  }
  if (
    session.user.role === 'STUDENT' &&
    submission.studentId !== session.user.id
  ) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const payload = {
    ...body,
    ...(body.teacherFeedback ? body : {}),
  }
  const parsedSubmission = submissionSchema.safeParse(payload)
  const parsedFeedback = feedbackSchema.safeParse(body)

  if (!parsedSubmission.success && !parsedFeedback.success) {
    return errorResponse('VALIDATION', '제출 데이터가 올바르지 않습니다.', 400, {
      submission: parsedSubmission.success ? null : parsedSubmission.error.flatten(),
      feedback: parsedFeedback.success ? null : parsedFeedback.error.flatten(),
    })
  }

  const updated = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      ...(parsedSubmission.success
        ? {
            content: parsedSubmission.data.content ?? undefined,
            attachments: parsedSubmission.data.attachments ?? undefined,
            aiUsed:
              parsedSubmission.data.aiUsed !== undefined
                ? parsedSubmission.data.aiUsed
                : undefined,
            aiUsageDetail:
              parsedSubmission.data.aiUsageDetail !== undefined
                ? parsedSubmission.data.aiUsageDetail ?? null
                : undefined,
            status:
              parsedSubmission.data.status !== undefined
                ? parsedSubmission.data.status
                : undefined,
            submittedAt:
              parsedSubmission.data.status !== undefined
                ? parsedSubmission.data.status === 'SUBMITTED'
                  ? new Date()
                  : null
                : undefined,
          }
        : {}),
      ...(parsedFeedback.success
        ? {
            teacherFeedback:
              parsedFeedback.data.teacherFeedback ?? body.teacherFeedback ?? null,
          }
        : {}),
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, type: true } },
      history: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (
    parsedSubmission.success &&
    session.user.role === 'STUDENT' &&
    (parsedSubmission.data.content !== undefined ||
      parsedSubmission.data.attachments !== undefined ||
      parsedSubmission.data.status !== undefined)
  ) {
    await prisma.submissionHistory.create({
      data: {
        submissionId: updated.id,
        content: updated.content ?? '',
        attachments: updated.attachments ?? [],
        charCount: (updated.content ?? '').length,
      },
    })
  }

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id: assignmentId, submissionId } = await Promise.resolve(context.params)
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, assignmentId },
    include: { assignment: { select: { classId: true, class: { select: { academyId: true } } } } },
  })
  if (!submission) {
    return errorResponse('NOT_FOUND', '제출물을 찾을 수 없습니다.', 404)
  }
  if (submission.assignment.class.academyId !== session.user.academyId) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, submission.assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반만 삭제할 수 있습니다.', 403)
  }

  await prisma.submission.delete({ where: { id: submissionId } })
  return successResponse({ id: submissionId })
}
