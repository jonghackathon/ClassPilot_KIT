'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import useSWR from 'swr'
import {
  ArrowRight,
  BookOpenText,
  CalendarClock,
  ClipboardCheck,
  LoaderCircle,
  MessageSquareDot,
  NotebookPen,
} from 'lucide-react'

import {
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED'
type QuestionStatus = 'PENDING' | 'AI_ANSWERED' | 'TEACHER_ANSWERED'
type ChurnLevel = 'SAFE' | 'WARNING' | 'DANGER'

type ApiEnvelope<T> = {
  success: boolean
  data: T
}

type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type ScheduleItem = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  class: {
    id: string
    name: string
    subject: string | null
  }
}

type AttendanceItem = {
  id: string
  classId: string
  status: 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
}

type AssignmentItem = {
  id: string
  title: string
  dueDate: string | null
  class: {
    id: string
    name: string
  }
  submissions: Array<{
    id: string
    status: SubmissionStatus
    teacherFeedback: string | null
  }>
}

type QuestionItem = {
  id: string
  question: string
  status: QuestionStatus
  class: {
    id: string
    name: string
  } | null
  student: {
    id: string
    name: string
  }
  createdAt: string
}

type ChurnItem = {
  id: string
  score: number
  level: ChurnLevel
  attendanceFactor: number
  homeworkFactor: number
  accessFactor: number
  questionFactor: number
  student: {
    id: string
    name: string
    enrollments: Array<{
      class: {
        id: string
        name: string
      }
    }>
  }
}

type ConsultationItem = {
  id: string
  content: string
  createdAt: string
  student: {
    id: string
    name: string
  }
}

const swrOptions = {
  refreshInterval: 300_000,
  revalidateOnFocus: false,
}

function getTodayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTodayDayOfWeek() {
  return ((new Date().getDay() + 6) % 7) + 1
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '일정 미정'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDueDate(value?: string | null) {
  if (!value) {
    return '마감일 미정'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(value))
}

function getRiskMeta(level: ChurnLevel) {
  if (level === 'DANGER') {
    return { label: '고위험', tone: 'rose' as Tone }
  }

  if (level === 'WARNING') {
    return { label: '주의', tone: 'amber' as Tone }
  }

  return { label: '안정', tone: 'emerald' as Tone }
}

function buildRiskReason(item: ChurnItem) {
  const factors: Array<[string, number]> = [
    ['출결', item.attendanceFactor],
    ['과제', item.homeworkFactor],
    ['접속', item.accessFactor],
    ['질문', item.questionFactor],
  ]

  return factors
    .sort((left, right) => right[1] - left[1])
    .filter(([, value]) => value > 0)
    .slice(0, 2)
    .map(([label, value]) => `${label} ${value}`)
    .join(' · ')
}

export function TeacherDashboardManager() {
  const today = getTodayDateKey()
  const dayOfWeek = getTodayDayOfWeek()

  const { data: scheduleResponse, error: scheduleError } = useSWR<
    ApiEnvelope<PaginatedData<ScheduleItem>>
  >(`/api/schedule?dayOfWeek=${dayOfWeek}&limit=100`, swrOptions)
  const { data: attendanceResponse, error: attendanceError } = useSWR<
    ApiEnvelope<PaginatedData<AttendanceItem>>
  >(`/api/attendance?dateFrom=${today}&dateTo=${today}&limit=200`, swrOptions)
  const { data: assignmentsResponse, error: assignmentsError } = useSWR<
    ApiEnvelope<PaginatedData<AssignmentItem>>
  >('/api/assignments?limit=100', swrOptions)
  const { data: questionsResponse, error: questionsError } = useSWR<
    ApiEnvelope<PaginatedData<QuestionItem>>
  >('/api/qna?limit=100', swrOptions)
  const { data: churnResponse, error: churnError } = useSWR<
    ApiEnvelope<PaginatedData<ChurnItem>>
  >('/api/churn?limit=100', swrOptions)
  const { data: consultationsResponse, error: consultationsError } = useSWR<
    ApiEnvelope<PaginatedData<ConsultationItem>>
  >('/api/consultations?limit=20', swrOptions)

  const schedules = useMemo(() => scheduleResponse?.data.items ?? [], [scheduleResponse])
  const attendanceItems = useMemo(
    () => attendanceResponse?.data.items ?? [],
    [attendanceResponse],
  )
  const assignments = useMemo(() => assignmentsResponse?.data.items ?? [], [assignmentsResponse])
  const questions = useMemo(() => questionsResponse?.data.items ?? [], [questionsResponse])
  const churnItems = useMemo(() => churnResponse?.data.items ?? [], [churnResponse])
  const consultations = useMemo(
    () => consultationsResponse?.data.items ?? [],
    [consultationsResponse],
  )

  const isLoading =
    !scheduleResponse ||
    !attendanceResponse ||
    !assignmentsResponse ||
    !questionsResponse ||
    !churnResponse ||
    !consultationsResponse

  const hasError =
    scheduleError ||
    attendanceError ||
    assignmentsError ||
    questionsError ||
    churnError ||
    consultationsError

  const attendanceByClass = useMemo(() => {
    return attendanceItems.reduce<Map<string, number>>((map, item) => {
      map.set(item.classId, (map.get(item.classId) ?? 0) + 1)
      return map
    }, new Map())
  }, [attendanceItems])

  const todayClasses = useMemo(
    () =>
      [...schedules].sort((left, right) => left.startTime.localeCompare(right.startTime)),
    [schedules],
  )

  const uncheckedClasses = useMemo(
    () => todayClasses.filter((item) => !attendanceByClass.has(item.class.id)),
    [attendanceByClass, todayClasses],
  )

  const feedbackPendingCount = useMemo(
    () =>
      assignments.reduce(
        (sum, item) =>
          sum +
          item.submissions.filter(
            (submission) =>
              submission.status === 'SUBMITTED' && !submission.teacherFeedback?.trim(),
          ).length,
        0,
      ),
    [assignments],
  )

  const openQuestions = useMemo(
    () => questions.filter((item) => item.status !== 'TEACHER_ANSWERED'),
    [questions],
  )

  const riskStudents = useMemo(
    () => [...churnItems].sort((left, right) => right.score - left.score).slice(0, 3),
    [churnItems],
  )

  const upcomingAssignments = useMemo(
    () =>
      [...assignments]
        .sort((left, right) => {
          const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          return leftTime - rightTime
        })
        .slice(0, 3),
    [assignments],
  )

  const recentConsultations = useMemo(() => consultations.slice(0, 4), [consultations])

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 홈"
        title="오늘 수업 흐름과 후속 조치를 실데이터로 바로 확인해요"
        description="담당 반 일정, 출결 입력 상태, 피드백 대기 과제, 미답변 질문, 이탈 위험 학생을 한 화면에서 이어서 볼 수 있게 연결했습니다."
      />

      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-[32px] border border-slate-200 bg-white text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          강사 대시보드를 불러오는 중입니다.
        </div>
      ) : null}

      {!isLoading && hasError ? (
        <div className="rounded-[32px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          강사 대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : null}

      {!isLoading && !hasError ? (
        <>
          <SurfaceCard className="overflow-hidden p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-violet-600">Today Focus</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  오늘 수업 {todayClasses.length}개,
                  <br className="hidden sm:block" />
                  바로 봐야 할 질문 {openQuestions.length}건이 있습니다.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  출결이 아직 없는 반과 피드백 대기 과제를 먼저 확인하고, 상담이 필요한
                  학생으로 자연스럽게 이어질 수 있게 구성했습니다.
                </p>
              </div>

              <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next Action</p>
                <p className="mt-2 text-xl font-semibold">
                  {uncheckedClasses[0]
                    ? `${uncheckedClasses[0].class.name} 출결 먼저 확인`
                    : openQuestions[0]
                      ? `${openQuestions[0].student.name} 질문 답변`
                      : '담당 반 위험 학생 점검'}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {uncheckedClasses[0]
                    ? `${formatTime(uncheckedClasses[0].startTime)} 수업의 출결 기록이 아직 없습니다.`
                    : '오늘 우선순위가 높은 항목부터 바로 이동할 수 있습니다.'}
                </p>
              </div>
            </div>
          </SurfaceCard>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              href="/teacher/attendance"
              icon={CalendarClock}
              label="오늘 수업"
              value={`${todayClasses.length}반`}
              detail={todayClasses[0] ? `${formatTime(todayClasses[0].startTime)} 첫 수업` : '오늘 수업 없음'}
              tone="sky"
            />
            <MetricCard
              href="/teacher/attendance"
              icon={ClipboardCheck}
              label="미체크 출결"
              value={`${uncheckedClasses.length}반`}
              detail={uncheckedClasses.length ? '출결 입력 필요' : '모든 반 출결 기록 확인'}
              tone={uncheckedClasses.length ? 'amber' : 'emerald'}
            />
            <MetricCard
              href="/teacher/assignments"
              icon={BookOpenText}
              label="피드백 대기"
              value={`${feedbackPendingCount}건`}
              detail={upcomingAssignments[0] ? '제출된 과제 검토 필요' : '진행 중인 과제 없음'}
              tone={feedbackPendingCount ? 'violet' : 'slate'}
            />
            <MetricCard
              href="/teacher/bot"
              icon={MessageSquareDot}
              label="미답변 질문"
              value={`${openQuestions.length}건`}
              detail={openQuestions[0] ? 'AI 초안 또는 대기 질문 있음' : '질문 대응 완료'}
              tone={openQuestions.length ? 'rose' : 'emerald'}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <SurfaceCard>
              <SectionHeading
                title="오늘 수업"
                subtitle="담당 반 기준 일정과 출결 입력 상태입니다."
                action={<Link href="/teacher/attendance" className="text-sm font-semibold text-indigo-600">출결 화면으로</Link>}
              />
              <div className="mt-5 space-y-3">
                {todayClasses.length === 0 ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    오늘 등록된 수업이 없습니다.
                  </div>
                ) : (
                  todayClasses.map((item) => {
                    const checkedCount = attendanceByClass.get(item.class.id) ?? 0
                    const hasAttendance = checkedCount > 0

                    return (
                      <div
                        key={item.id}
                        className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{item.class.name}</p>
                              <StatusBadge
                                label={hasAttendance ? `출결 ${checkedCount}건` : '출결 미입력'}
                                tone={hasAttendance ? 'emerald' : 'amber'}
                              />
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                              {formatTime(item.startTime)} - {formatTime(item.endTime)}
                              {' · '}
                              {item.room ?? '강의실 미정'}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {item.class.subject ?? '과목 미지정'}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Link
                              href="/teacher/attendance"
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                            >
                              출결 보기
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </SurfaceCard>

            <div className="space-y-6">
              <SurfaceCard>
                <SectionHeading
                  title="미답변 질문"
                  subtitle="강사 답변이 아직 없는 질문입니다."
                  action={<Link href="/teacher/bot" className="text-sm font-semibold text-violet-600">질문봇으로</Link>}
                />
                <div className="mt-5 space-y-3">
                  {openQuestions.length === 0 ? (
                    <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      답변이 필요한 질문이 없습니다.
                    </div>
                  ) : (
                    openQuestions.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href="/teacher/bot"
                        className="block rounded-[24px] bg-slate-50 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            label={item.status === 'AI_ANSWERED' ? 'AI 초안 있음' : '답변 대기'}
                            tone={item.status === 'AI_ANSWERED' ? 'violet' : 'amber'}
                          />
                          <StatusBadge label={item.class?.name ?? '반 미지정'} tone="sky" />
                        </div>
                        <p className="mt-3 font-semibold leading-6 text-slate-900">{item.question}</p>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                          <span>{item.student.name}</span>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <SectionHeading
                  title="다가오는 과제"
                  subtitle="마감이 가까운 과제를 먼저 볼 수 있습니다."
                  action={<Link href="/teacher/assignments" className="text-sm font-semibold text-indigo-600">과제 관리로</Link>}
                />
                <div className="mt-5 space-y-3">
                  {upcomingAssignments.length === 0 ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      등록된 과제가 없습니다.
                    </div>
                  ) : (
                    upcomingAssignments.map((item) => (
                      <Link
                        key={item.id}
                        href={`/teacher/assignments/${item.id}`}
                        className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <StatusBadge label={formatDueDate(item.dueDate)} tone="amber" />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                          <span>{item.class.name}</span>
                          <span>피드백 대기 {item.submissions.filter((submission) => submission.status === 'SUBMITTED' && !submission.teacherFeedback?.trim()).length}건</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </SurfaceCard>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard>
              <SectionHeading
                title="담당 반 이탈 위험"
                subtitle="점수가 높은 학생부터 빠르게 확인합니다."
                action={<Link href="/teacher/churn" className="text-sm font-semibold text-rose-600">상세 보기</Link>}
              />
              <div className="mt-5 space-y-3">
                {riskStudents.length === 0 ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    현재 주의가 필요한 학생이 없습니다.
                  </div>
                ) : (
                  riskStudents.map((item) => {
                    const riskMeta = getRiskMeta(item.level)
                    const className = item.student.enrollments[0]?.class.name ?? '반 미배정'

                    return (
                      <Link
                        key={item.id}
                        href="/teacher/churn"
                        className="block rounded-[24px] border border-rose-100 bg-white px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{item.student.name}</p>
                              <StatusBadge label={className} tone="sky" />
                              <StatusBadge label={riskMeta.label} tone={riskMeta.tone} />
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {buildRiskReason(item) || '위험 요인 데이터 없음'}
                            </p>
                          </div>
                          <span className="text-2xl font-semibold text-rose-700">{item.score}%</span>
                        </div>
                        <div className="mt-4">
                          <ProgressBar value={item.score} tone={riskMeta.tone} />
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeading
                title="최근 상담 메모"
                subtitle="최근 남긴 후속 메모를 다시 확인합니다."
                action={<Link href="/teacher/churn" className="text-sm font-semibold text-slate-700">상담 이어가기</Link>}
              />
              <div className="mt-5 space-y-3">
                {recentConsultations.length === 0 ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    최근 상담 기록이 없습니다.
                  </div>
                ) : (
                  recentConsultations.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-slate-200 px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <NotebookPen className="h-4 w-4 text-violet-500" />
                            <p className="font-semibold text-slate-900">{item.student.name}</p>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                            {item.content}
                          </p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <div className="grid gap-3 pt-2 sm:grid-cols-3">
                  <Link
                    href="/teacher/attendance"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    출결 보기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/teacher/assignments"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    과제 관리
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/teacher/churn"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    이탈 관리
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </SurfaceCard>
          </section>
        </>
      ) : null}
    </div>
  )
}
