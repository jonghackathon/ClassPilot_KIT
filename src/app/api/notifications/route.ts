import { randomUUID } from 'node:crypto'

import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getTeacherClassIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'
import type { UserRole } from '@/types'

const notificationToneSchema = z.enum(['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose', 'slate'])
const notificationAudienceSchema = z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'ALL'])

const notificationCreateSchema = z.object({
  title: z.string().trim().min(1).max(80),
  detail: z.string().trim().min(1).max(400),
  href: z.string().trim().max(200).optional().nullable(),
  tone: notificationToneSchema.optional().default('indigo'),
  audience: notificationAudienceSchema.optional().default('ALL'),
})

type NotificationTone = z.infer<typeof notificationToneSchema>
type NotificationAudience = z.infer<typeof notificationAudienceSchema>

type NotificationItem = {
  id: string
  title: string
  detail: string
  href: string | null
  tone: NotificationTone
  audience: NotificationAudience
  source: 'system' | 'manual'
  createdAt: string
}

function compactNotifications(items: Array<NotificationItem | null>) {
  return items.filter((item): item is NotificationItem => item !== null)
}

type StoredNotification = {
  title: string
  detail: string
  href?: string | null
  tone?: NotificationTone
  audience?: NotificationAudience
  createdAt?: string
}

function audienceMatches(audience: NotificationAudience, role: UserRole) {
  return audience === 'ALL' || audience === role
}

async function getAdminNotifications(academyId: string): Promise<NotificationItem[]> {
  const [pendingComplaints, unpaidPayments, dangerStudents] = await Promise.all([
    prisma.complaint.count({
      where: {
        status: 'PENDING',
        student: { academyId },
      },
    }),
    prisma.payment.count({
      where: {
        status: { in: ['UNPAID', 'PARTIAL'] },
        student: { academyId },
      },
    }),
    prisma.churnPrediction.count({
      where: {
        level: 'DANGER',
        student: { academyId },
      },
    }),
  ])

  return compactNotifications([
    pendingComplaints > 0
      ? {
          id: 'admin-complaints',
          title: '민원 응답 대기',
          detail: `답변이 필요한 민원 ${pendingComplaints}건이 있습니다.`,
          href: '/admin/complaints',
          tone: 'rose',
          audience: 'ADMIN',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    unpaidPayments > 0
      ? {
          id: 'admin-payments',
          title: '미납/부분 납부 확인 필요',
          detail: `수납 확인이 필요한 결제 ${unpaidPayments}건이 있습니다.`,
          href: '/admin/payments',
          tone: 'amber',
          audience: 'ADMIN',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    dangerStudents > 0
      ? {
          id: 'admin-churn',
          title: '위험 학생 모니터링',
          detail: `이탈 위험도가 높은 학생 ${dangerStudents}명이 감지되었습니다.`,
          href: '/admin/churn',
          tone: 'violet',
          audience: 'ADMIN',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
  ])
}

async function getTeacherNotifications(academyId: string, teacherId: string): Promise<NotificationItem[]> {
  const teacherClassIds = await getTeacherClassIds(teacherId)

  if (teacherClassIds.length === 0) {
    return []
  }

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setHours(23, 59, 59, 999)

  const [todayLessons, feedbackPending, activeCopilotSessions] = await Promise.all([
    prisma.lesson.count({
      where: {
        classId: { in: teacherClassIds },
        class: { academyId },
        date: { gte: start, lte: end },
      },
    }),
    prisma.submission.count({
      where: {
        assignment: {
          classId: { in: teacherClassIds },
          class: { academyId },
        },
        status: 'SUBMITTED',
        teacherFeedback: null,
      },
    }),
    prisma.copilotSession.count({
      where: {
        teacherId,
        status: 'ACTIVE',
        lesson: {
          class: { academyId },
        },
      },
    }),
  ])

  return compactNotifications([
    todayLessons > 0
      ? {
          id: 'teacher-lessons',
          title: '오늘 수업 준비',
          detail: `오늘 진행 예정 수업 ${todayLessons}건을 확인해 보세요.`,
          href: '/teacher/dashboard',
          tone: 'sky',
          audience: 'TEACHER',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    feedbackPending > 0
      ? {
          id: 'teacher-feedback',
          title: '과제 피드백 대기',
          detail: `피드백이 필요한 제출물 ${feedbackPending}건이 남아 있습니다.`,
          href: '/teacher/assignments',
          tone: 'amber',
          audience: 'TEACHER',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    activeCopilotSessions > 0
      ? {
          id: 'teacher-copilot',
          title: '진행 중인 코파일럿',
          detail: `현재 활성 코파일럿 세션 ${activeCopilotSessions}건을 이어서 확인할 수 있습니다.`,
          href: '/teacher/copilot',
          tone: 'violet',
          audience: 'TEACHER',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
  ])
}

async function getStudentNotifications(academyId: string, studentId: string): Promise<NotificationItem[]> {
  const now = new Date()
  const dueSoonEnd = new Date(now)
  dueSoonEnd.setDate(dueSoonEnd.getDate() + 7)

  const [dueSoonAssignments, unreadReviews, answeredQuestions] = await Promise.all([
    prisma.assignment.count({
      where: {
        class: {
          academyId,
          enrollments: {
            some: {
              studentId,
              active: true,
            },
          },
        },
        dueDate: {
          gte: now,
          lte: dueSoonEnd,
        },
        submissions: {
          none: {
            studentId,
            status: 'SUBMITTED',
          },
        },
      },
    }),
    prisma.reviewSummary.count({
      where: {
        studentId,
        readAt: null,
      },
    }),
    prisma.botQuestion.count({
      where: {
        studentId,
        helpful: null,
        OR: [
          { aiAnswer: { not: null } },
          { teacherAnswer: { not: null } },
        ],
      },
    }),
  ])

  return compactNotifications([
    dueSoonAssignments > 0
      ? {
          id: 'student-assignments',
          title: '과제 마감 예정',
          detail: `이번 주 안에 제출해야 할 과제 ${dueSoonAssignments}건이 있습니다.`,
          href: '/student/assignments',
          tone: 'amber',
          audience: 'STUDENT',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    unreadReviews > 0
      ? {
          id: 'student-reviews',
          title: '새 복습 자료 도착',
          detail: `읽지 않은 복습 자료 ${unreadReviews}건이 있습니다.`,
          href: '/student/review',
          tone: 'sky',
          audience: 'STUDENT',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
    answeredQuestions > 0
      ? {
          id: 'student-qna',
          title: '질문 답변 확인',
          detail: `확인이 필요한 질문 답변 ${answeredQuestions}건이 도착했습니다.`,
          href: '/student/qna',
          tone: 'indigo',
          audience: 'STUDENT',
          source: 'system',
          createdAt: new Date().toISOString(),
        }
      : null,
  ])
}

function parseStoredNotification(id: string, rawValue: string): NotificationItem | null {
  try {
    const parsed = JSON.parse(rawValue) as StoredNotification
    if (!parsed.title || !parsed.detail) {
      return null
    }

    return {
      id,
      title: parsed.title,
      detail: parsed.detail,
      href: parsed.href ?? null,
      tone: parsed.tone ?? 'indigo',
      audience: parsed.audience ?? 'ALL',
      source: 'manual',
      createdAt: parsed.createdAt ?? new Date(0).toISOString(),
    }
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error) {
    return error
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.max(1, Math.min(20, Number(searchParams.get('limit') ?? '5')))

  const [manualSettings, systemNotifications] = await Promise.all([
    prisma.appSetting.findMany({
      where: {
        academyId: session.user.academyId,
        key: {
          startsWith: 'notification:',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    session.user.role === 'ADMIN'
      ? getAdminNotifications(session.user.academyId)
      : session.user.role === 'TEACHER'
        ? getTeacherNotifications(session.user.academyId, session.user.id)
        : getStudentNotifications(session.user.academyId, session.user.id),
  ])

  const manualNotifications = manualSettings
    .map((item) => parseStoredNotification(item.id, item.value))
    .filter((item): item is NotificationItem => Boolean(item))
    .filter((item) => audienceMatches(item.audience, session.user.role))

  const items = [...manualNotifications, ...systemNotifications]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit)

  return successResponse({
    items,
    total: items.length,
    unreadCount: items.length,
  })
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, notificationCreateSchema)
  if (validationError || !data) {
    return validationError
  }

  if (session.user.role === 'TEACHER' && data.audience === 'ADMIN') {
    return errorResponse('FORBIDDEN', '강사는 관리자 전용 알림을 등록할 수 없습니다.', 403)
  }

  const createdAt = new Date().toISOString()
  const key = `notification:${createdAt}:${randomUUID()}`

  const created = await prisma.appSetting.create({
    data: {
      academyId: session.user.academyId,
      key,
      value: JSON.stringify({
        ...data,
        createdAt,
      }),
    },
  })

  return successResponse(
    {
      id: created.id,
      ...data,
      createdAt,
      source: 'manual' as const,
    },
    201,
  )
}
