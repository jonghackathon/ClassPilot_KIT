import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { reportUpdateSchema } from '@/lib/validations/reports'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const report = await prisma.reportData.findUnique({
    where: { id },
    include: { student: { select: { id: true, name: true, email: true, academyId: true } } },
  })

  if (!report || report.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '보고서를 찾을 수 없습니다.', 404)
  }

  if (session.user.role === 'STUDENT' && report.studentId !== session.user.id) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  return successResponse(report)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.reportData.findUnique({
    where: { id },
    include: { student: { select: { academyId: true } } },
  })
  if (!current || current.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '보고서를 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await getTeacherStudentIds(session.user.id)).includes(current.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 보고서만 수정할 수 있습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = reportUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '보고서 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const updated = await prisma.reportData.update({
    where: { id },
    data: {
      ...(data.studentId ? { studentId: data.studentId } : {}),
      ...(data.monthStr ? { monthStr: data.monthStr } : {}),
      ...(data.comment !== undefined ? { comment: data.comment ?? null } : {}),
      ...(data.growth !== undefined ? { growth: data.growth ?? null } : {}),
      ...(data.attendanceSummary !== undefined
        ? { attendanceSummary: data.attendanceSummary ?? null }
        : {}),
      ...(data.assignmentSummary !== undefined
        ? { assignmentSummary: data.assignmentSummary ?? null }
        : {}),
    },
    include: { student: { select: { id: true, name: true, email: true } } },
  })

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.reportData.findUnique({
    where: { id },
    include: { student: { select: { academyId: true } } },
  })
  if (!current || current.student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '보고서를 찾을 수 없습니다.', 404)
  }
  if (
    session.user.role === 'TEACHER' &&
    !(await getTeacherStudentIds(session.user.id)).includes(current.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 보고서만 삭제할 수 있습니다.', 403)
  }

  await prisma.reportData.delete({ where: { id } })
  return successResponse({ id })
}
