import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { churnBatchSchema } from '@/lib/validations/churn'
import { withAuth } from '@/lib/with-auth'

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS)
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getLevel(score: number) {
  if (score >= 60) {
    return 'DANGER' as const
  }

  if (score >= 30) {
    return 'WARNING' as const
  }

  return 'SAFE' as const
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  const isCronRequest =
    Boolean(cronSecret) && authorization === `Bearer ${cronSecret}`

  let sessionAcademyId: string | null = null

  if (!isCronRequest) {
    const { session, error } = await withAuth(['ADMIN'])

    if (error) {
    return error
  }

    sessionAcademyId = session.user.academyId
  }

  const body = await request.json().catch(() => ({}))
  const parsed = churnBatchSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse('VALIDATION', '이탈 예측 요청이 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const requestedStudentIds = parsed.data.studentIds
  const since30Days = daysAgo(30)
  const since14Days = daysAgo(14)
  const since7Days = daysAgo(7)
  const now = new Date()

  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      ...(sessionAcademyId ? { academyId: sessionAcademyId } : {}),
      ...(requestedStudentIds?.length ? { id: { in: requestedStudentIds } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      academyId: true,
      enrollments: {
        where: { active: true },
        select: {
          classId: true,
        },
      },
    },
  })

  if (students.length === 0) {
    return successResponse({
      calculatedAt: new Date().toISOString(),
      count: 0,
      items: [],
      dangerStudents: [],
    })
  }

  const studentIds = students.map((student: { id: string }) => student.id)
  const classIds = [
    ...new Set(
      students.flatMap(
        (student: { enrollments: Array<{ classId: string }> }) =>
          student.enrollments.map((enrollment: { classId: string }) => enrollment.classId),
      ),
    ),
  ]

  const [attendanceRows, assignmentRows, submissionRows, questionRows] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        date: { gte: since30Days },
      },
      select: {
        studentId: true,
        status: true,
        date: true,
      },
      orderBy: { date: 'desc' },
    }),
    prisma.assignment.findMany({
      where: {
        classId: { in: classIds.length ? classIds : ['__none__'] },
        dueDate: { gte: since30Days, lte: now },
      },
      select: {
        id: true,
        classId: true,
      },
    }),
    prisma.submission.findMany({
      where: {
        studentId: { in: studentIds },
        assignment: {
          dueDate: { gte: since30Days, lte: now },
        },
      },
      select: {
        studentId: true,
        assignmentId: true,
        status: true,
      },
    }),
    prisma.botQuestion.findMany({
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: since30Days },
      },
      select: {
        studentId: true,
      },
    }),
  ])

  type AttendanceRow = (typeof attendanceRows)[number]
  const attendanceByStudent = new Map<string, AttendanceRow[]>()
  const submissionsByStudent = new Map<string, typeof submissionRows>()
  const questionsByStudent = new Map<string, number>()
  const assignmentsByClass = new Map<string, string[]>()

  for (const row of attendanceRows) {
    const existing = attendanceByStudent.get(row.studentId) ?? []
    existing.push(row)
    attendanceByStudent.set(row.studentId, existing)
  }

  for (const row of submissionRows) {
    const existing = submissionsByStudent.get(row.studentId) ?? []
    existing.push(row)
    submissionsByStudent.set(row.studentId, existing)
  }

  for (const row of questionRows) {
    questionsByStudent.set(row.studentId, (questionsByStudent.get(row.studentId) ?? 0) + 1)
  }

  for (const row of assignmentRows) {
    const existing = assignmentsByClass.get(row.classId) ?? []
    existing.push(row.id)
    assignmentsByClass.set(row.classId, existing)
  }

  const calculatedAt = new Date()

  const items = await Promise.all(
    students.map(
      async (student: { id: string; enrollments: Array<{ classId: string }> }) => {
      const studentAttendances = attendanceByStudent.get(student.id) ?? []
      const latestAttendance = studentAttendances[0]?.date ?? null
      const totalAttendanceCount = studentAttendances.length
      const absentCount = studentAttendances.filter((item) => item.status === 'ABSENT').length
      const lateCount = studentAttendances.filter((item) => item.status === 'LATE').length

      const attendanceFactor = totalAttendanceCount
        ? clampScore(((absentCount + lateCount * 0.5) / totalAttendanceCount) * 100)
        : 0

      const recentClassAssignmentIds = [
        ...new Set(
          student.enrollments.flatMap(
            (enrollment: { classId: string }) => assignmentsByClass.get(enrollment.classId) ?? [],
          ),
        ),
      ]
      const studentSubmissions = submissionsByStudent.get(student.id) ?? []
      const submittedAssignmentIds = new Set(
        studentSubmissions
          .filter((item: { status: string }) => item.status === 'SUBMITTED')
          .map((item: { assignmentId: string }) => item.assignmentId),
      )
      const missedAssignmentCount = recentClassAssignmentIds.filter(
        (assignmentId: string) => !submittedAssignmentIds.has(assignmentId),
      ).length
      const homeworkFactor = recentClassAssignmentIds.length
        ? clampScore((missedAssignmentCount / recentClassAssignmentIds.length) * 100)
        : 0

      let accessFactor = 0
      if (!latestAttendance || latestAttendance < since14Days) {
        accessFactor = 100
      } else if (latestAttendance < since7Days) {
        accessFactor = 50
      }

      const questionFactor = (questionsByStudent.get(student.id) ?? 0) === 0 ? 40 : 0
      const score = clampScore(
        attendanceFactor * 0.4 +
          homeworkFactor * 0.3 +
          accessFactor * 0.2 +
          questionFactor * 0.1,
      )
      const level = getLevel(score)

      return prisma.churnPrediction.create({
        data: {
          studentId: student.id,
          score,
          level,
          attendanceFactor,
          homeworkFactor,
          accessFactor,
          questionFactor,
          calculatedAt,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
      },
    ),
  )

  const dangerStudents = items
    .filter((item) => item.level === 'DANGER')
    .map((item) => ({
      id: item.student.id,
      name: item.student.name,
      score: item.score,
    }))

  return successResponse({
    calculatedAt: calculatedAt.toISOString(),
    count: items.length,
    items,
    dangerStudents,
  }, 201)
}
