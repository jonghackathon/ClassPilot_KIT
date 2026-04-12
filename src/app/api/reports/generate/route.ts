import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'

const generateSchema = z.object({
  studentId: z.string().cuid(),
  monthStr: z.string().regex(/^\d{4}-\d{2}$/),
})

function makeMonthRange(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))
  return { start, end }
}

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const body = await request.json().catch(() => null)

  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = generateSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      'VALIDATION',
      '보고서 생성 요청이 올바르지 않습니다.',
      400,
      parsed.error.flatten(),
    )
  }

  if (
    session.user.role === 'TEACHER' &&
    !(await getTeacherStudentIds(session.user.id)).includes(parsed.data.studentId)
  ) {
    return errorResponse('FORBIDDEN', '담당 수강생 보고서만 생성할 수 있습니다.', 403)
  }

  const { start, end } = makeMonthRange(parsed.data.monthStr)

  const [attendances, submissions, weekNotes, student] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        studentId: parsed.data.studentId,
        date: { gte: start, lte: end },
      },
      select: { status: true, homeworkStatus: true },
    }),
    prisma.submission.findMany({
      where: {
        studentId: parsed.data.studentId,
        submittedAt: { gte: start, lte: end },
      },
      select: { status: true, teacherFeedback: true },
    }),
    prisma.weekNote.findMany({
      where: {
        date: { gte: start, lte: end },
        class: {
          enrollments: {
            some: {
              studentId: parsed.data.studentId,
              active: true,
            },
          },
        },
      },
      select: {
        content: true,
        studentReaction: true,
      },
      take: 6,
    }),
    prisma.user.findUnique({
      where: { id: parsed.data.studentId },
      select: { id: true, name: true, academyId: true },
    }),
  ])

  if (!student || student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수강생을 찾을 수 없습니다.', 404)
  }

  const attendanceSummary = `출결 ${attendances.length}회 / 지각 ${attendances.filter((item) => item.status === 'LATE').length}회 / 결석 ${attendances.filter((item) => item.status === 'ABSENT').length}회`
  const assignmentSummary = `제출 ${submissions.length}건 / 피드백 완료 ${submissions.filter((item) => Boolean(item.teacherFeedback)).length}건`
  const growth = weekNotes.length
    ? weekNotes
        .map((item) => item.studentReaction || item.content)
        .filter(Boolean)
        .slice(0, 3)
        .join(' / ')
    : '이번 달 수업 기록을 기반으로 다음 목표를 함께 조정해 주세요.'

  const report = await prisma.reportData.upsert({
    where: {
      studentId_monthStr: {
        studentId: parsed.data.studentId,
        monthStr: parsed.data.monthStr,
      },
    },
    create: {
      studentId: parsed.data.studentId,
      monthStr: parsed.data.monthStr,
      comment: `${student.name} 수강생 월간 리포트 초안`,
      growth,
      attendanceSummary,
      assignmentSummary,
    },
    update: {
      comment: `${student.name} 수강생 월간 리포트 초안`,
      growth,
      attendanceSummary,
      assignmentSummary,
    },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return successResponse(report, 201)
}
