'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import useSWR from 'swr'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  LoaderCircle,
  ShieldAlert,
  TrendingUp,
  Users,
  UserSquare2,
} from 'lucide-react'

import {
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type AttendanceStatus = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'
type ChurnLevel = 'SAFE' | 'WARNING' | 'DANGER'
type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

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

type StudentItem = {
  id: string
  name: string
  active: boolean
}

type ClassItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
  enrollments: Array<{
    student: {
      id: string
      name: string
      studentProfile: {
        grade: string | null
      } | null
    }
  }>
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

type PaymentItem = {
  id: string
  amount: number
  status: PaymentStatus
  month: string
  student: {
    id: string
    name: string
  }
  class: {
    id: string
    name: string
  } | null
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

type ComplaintItem = {
  id: string
  status: ComplaintStatus
  content: string
  createdAt: string
  student: {
    id: string
    name: string
  }
}

type ConsultationItem = {
  id: string
  createdAt: string
  student: {
    id: string
    name: string
  }
  owner: {
    id: string
    name: string
  }
}

type AttendanceItem = {
  id: string
  classId: string
  status: AttendanceStatus
  class: {
    id: string
    name: string
  }
}

type AssignmentItem = {
  id: string
  title: string
  dueDate: string | null
  class: {
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatTime(value: string) {
  return value.slice(0, 5)
}

function getAttendanceRate(items: AttendanceItem[]) {
  if (items.length === 0) {
    return null
  }

  const attended = items.filter((item) => item.status !== 'ABSENT').length
  return Math.round((attended / items.length) * 100)
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

function getComplaintMeta(status: ComplaintStatus) {
  if (status === 'RESOLVED') {
    return { label: '완료', tone: 'emerald' as Tone }
  }

  if (status === 'IN_PROGRESS') {
    return { label: '처리중', tone: 'amber' as Tone }
  }

  return { label: '미처리', tone: 'rose' as Tone }
}

function buildRiskReason(item: ChurnItem) {
  const factors: Array<[string, number]> = [
    ['출결', item.attendanceFactor],
    ['과제', item.homeworkFactor],
    ['접속', item.accessFactor],
    ['질문', item.questionFactor],
  ]

  factors.sort((left, right) => right[1] - left[1])

  return factors
    .filter(([, value]) => value > 0)
    .slice(0, 2)
    .map(([label, value]) => `${label} ${value}`)
    .join(', ')
}

function DashboardMetricCard({
  href,
  icon: Icon,
  label,
  value,
  change,
  tone,
}: {
  href: string
  icon: typeof Users
  label: string
  value: string
  change: string
  tone: string
}) {
  return (
    <Link href={href} className="block">
      <article className="surface-card rounded-[28px] border border-white/70 p-5">
        <div className={cx('inline-flex rounded-2xl bg-gradient-to-br p-3 text-white', tone)}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="mt-5 text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-slate-500">{change}</span>
          <ArrowUpRight className="h-4 w-4 text-slate-400" />
        </div>
      </article>
    </Link>
  )
}

export function AdminDashboardManagerPage() {
  const today = getTodayDateKey()
  const dayOfWeek = getTodayDayOfWeek()

  const { data: studentsResponse, error: studentsError } = useSWR<
    ApiEnvelope<PaginatedData<StudentItem>>
  >('/api/users?role=STUDENT&active=true&limit=100', swrOptions)
  const { data: classesResponse, error: classesError } = useSWR<
    ApiEnvelope<PaginatedData<ClassItem>>
  >('/api/classes?limit=100', swrOptions)
  const { data: scheduleResponse, error: scheduleError } = useSWR<
    ApiEnvelope<PaginatedData<ScheduleItem>>
  >(`/api/schedule?dayOfWeek=${dayOfWeek}&limit=100`, swrOptions)
  const { data: paymentsResponse, error: paymentsError } = useSWR<
    ApiEnvelope<PaginatedData<PaymentItem>>
  >('/api/payments?limit=100', swrOptions)
  const { data: churnResponse, error: churnError } = useSWR<
    ApiEnvelope<PaginatedData<ChurnItem>>
  >('/api/churn?limit=100', swrOptions)
  const { data: complaintsResponse, error: complaintsError } = useSWR<
    ApiEnvelope<PaginatedData<ComplaintItem>>
  >('/api/complaints?limit=100', swrOptions)
  const { data: consultationsResponse, error: consultationsError } = useSWR<
    ApiEnvelope<PaginatedData<ConsultationItem>>
  >('/api/consultations?limit=100', swrOptions)
  const { data: attendanceResponse, error: attendanceError } = useSWR<
    ApiEnvelope<PaginatedData<AttendanceItem>>
  >(`/api/attendance?dateFrom=${today}&dateTo=${today}&limit=100`, swrOptions)
  const { data: assignmentsResponse, error: assignmentsError } = useSWR<
    ApiEnvelope<PaginatedData<AssignmentItem>>
  >('/api/assignments?limit=100', swrOptions)
  const { data: academyResponse } = useSWR<
    ApiEnvelope<{ id: string; name: string; code: string }>
  >('/api/academy', swrOptions)

  const academyCode = academyResponse?.data.code ?? null

  const students = useMemo(() => studentsResponse?.data.items ?? [], [studentsResponse])
  const classes = useMemo(() => classesResponse?.data.items ?? [], [classesResponse])
  const schedules = useMemo(() => scheduleResponse?.data.items ?? [], [scheduleResponse])
  const payments = useMemo(() => paymentsResponse?.data.items ?? [], [paymentsResponse])
  const churnItems = useMemo(() => churnResponse?.data.items ?? [], [churnResponse])
  const complaints = useMemo(() => complaintsResponse?.data.items ?? [], [complaintsResponse])
  const consultations = useMemo(
    () => consultationsResponse?.data.items ?? [],
    [consultationsResponse],
  )
  const attendanceItems = useMemo(
    () => attendanceResponse?.data.items ?? [],
    [attendanceResponse],
  )
  const assignments = useMemo(
    () => assignmentsResponse?.data.items ?? [],
    [assignmentsResponse],
  )

  const isLoading =
    !studentsResponse ||
    !classesResponse ||
    !scheduleResponse ||
    !paymentsResponse ||
    !churnResponse ||
    !complaintsResponse ||
    !consultationsResponse ||
    !attendanceResponse ||
    !assignmentsResponse

  const hasError =
    studentsError ||
    classesError ||
    scheduleError ||
    paymentsError ||
    churnError ||
    complaintsError ||
    consultationsError ||
    attendanceError ||
    assignmentsError

  const attendanceRate = useMemo(() => getAttendanceRate(attendanceItems), [attendanceItems])

  const attendanceByClass = useMemo(() => {
    return attendanceItems.reduce<Map<string, { total: number; checked: number }>>(
      (map, item) => {
        const current = map.get(item.classId) ?? { total: 0, checked: 0 }
        current.total += 1
        if (item.status !== 'ABSENT') {
          current.checked += 1
        }
        map.set(item.classId, current)
        return map
      },
      new Map(),
    )
  }, [attendanceItems])

  const classMap = useMemo(() => {
    return classes.reduce<Map<string, ClassItem>>((map, item) => {
      map.set(item.id, item)
      return map
    }, new Map())
  }, [classes])

  const openComplaints = useMemo(
    () => complaints.filter((item) => item.status !== 'RESOLVED'),
    [complaints],
  )

  const unpaidPayments = useMemo(
    () => payments.filter((item) => item.status !== 'PAID'),
    [payments],
  )

  const unpaidAmount = unpaidPayments.reduce((sum, item) => sum + item.amount, 0)
  const dangerStudents = churnItems.filter((item) => item.level === 'DANGER')

  const recentConsultations = useMemo(() => {
    const todayStart = new Date(`${today}T00:00:00`).getTime()
    const threshold = todayStart - 6 * 24 * 60 * 60 * 1000
    return consultations.filter((item) => new Date(item.createdAt).getTime() >= threshold)
  }, [consultations, today])

  const riskStudents = useMemo(() => {
    return [...churnItems].sort((left, right) => right.score - left.score).slice(0, 3)
  }, [churnItems])

  const todayClasses = useMemo(() => {
    return schedules.slice(0, 4).map((item) => {
      const attendance = attendanceByClass.get(item.class.id)
      const linkedClass = classMap.get(item.class.id)

      return {
        id: item.id,
        title: item.class.name,
        time: formatTime(item.startTime),
        room: item.room ?? '강의실 미정',
        status: attendance
          ? `${attendance.checked}/${attendance.total} 출석 체크`
          : linkedClass
            ? `수강생 ${linkedClass.enrollments.length}명`
            : '출석 기록 없음',
      }
    })
  }, [attendanceByClass, classMap, schedules])

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .sort((left, right) => {
        const leftTime = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        const rightTime = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER
        return leftTime - rightTime
      })
      .slice(0, 3)
  }, [assignments])

  const recentComplaintItems = useMemo(() => complaints.slice(0, 3), [complaints])

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="운영 요약"
        title="오늘 학원 흐름과 우선 대응 항목을 한 번에 봐요"
        description="학생, 수업, 수납, 민원, 이탈 예측 데이터를 묶어서 운영 우선순위를 바로 확인할 수 있게 구성했습니다."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-4 rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 to-white px-6 py-5 transition hover:border-violet-300 hover:shadow-md hover:shadow-violet-100"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-500/25">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">강사 페이지</p>
            <p className="mt-0.5 text-sm text-slate-500">출결·과제·이탈 현황·진도 관리</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-violet-400" />
        </Link>
        <Link
          href="/student/home"
          className="flex items-center gap-4 rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-6 py-5 transition hover:border-sky-300 hover:shadow-md hover:shadow-sky-100"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/25">
            <UserSquare2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">학생 페이지</p>
            <p className="mt-0.5 text-sm text-slate-500">출결 확인·과제·복습·Q&A</p>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-sky-400" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-[32px] border border-slate-200 bg-white text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          대시보드 데이터를 불러오는 중입니다.
        </div>
      ) : null}

      {!isLoading && hasError ? (
        <div className="rounded-[32px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          대시보드 준비 중입니다.
        </div>
      ) : null}

      {!isLoading && !hasError ? (
        <>
          <section className="surface-card overflow-hidden rounded-[32px] border border-white/70 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">운영 요약</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  오늘은 {todayClasses.length}개 수업이 예정되어 있고,
                  <br className="hidden sm:block" />
                  {dangerStudents.length}명의 고위험 학생을 먼저 보는 편이 좋습니다.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  대시보드에서 위험 신호를 먼저 확인하고, 이후 학생 상세와 각 운영 화면으로 자연스럽게 드릴다운할 수 있게 연결했습니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">출석률</p>
                  <p className="mt-2 text-2xl font-semibold">
                    {attendanceRate === null ? '-' : `${attendanceRate}%`}
                  </p>
                </div>
                <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">민원</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {openComplaints.length}건
                  </p>
                </div>
                <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">최근 상담</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {recentConsultations.length}건
                  </p>
                </div>
                <div className="col-span-2 rounded-3xl border border-indigo-100 bg-indigo-50 px-5 py-4 sm:col-span-1">
                  <p className="text-xs uppercase tracking-[0.22em] text-indigo-400">학원 코드</p>
                  <p className="mt-2 text-xl font-bold tracking-[0.15em] text-indigo-700">
                    {academyCode ?? '···'}
                  </p>
                  <p className="mt-1 text-xs text-indigo-500">수강생 로그인 시 사용</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-4">
            <DashboardMetricCard
              change={`활성 학생 ${students.length}명`}
              href="/admin/students"
              icon={Users}
              label="전체 수강생"
              tone="from-indigo-600 to-indigo-500"
              value={`${students.length}명`}
            />
            <DashboardMetricCard
              change={`오늘 일정 ${todayClasses.length}개`}
              href="/admin/schedule"
              icon={CalendarClock}
              label="오늘 수업"
              tone="from-sky-500 to-cyan-500"
              value={`${todayClasses.length}반`}
            />
            <DashboardMetricCard
              change={`미납/부분 납부 ${unpaidPayments.length}건`}
              href="/admin/payments"
              icon={CircleDollarSign}
              label="미납 수강료"
              tone="from-amber-500 to-orange-500"
              value={formatCurrency(unpaidAmount)}
            />
            <DashboardMetricCard
              change="상담 우선 필요"
              href="/admin/churn"
              icon={ShieldAlert}
              label="이탈 위험"
              tone="from-rose-500 to-red-500"
              value={`${dangerStudents.length}명`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="surface-card rounded-[32px] border border-white/70 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600">이탈 위험 학생</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    우선 대응이 필요한 학생
                  </h2>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                  실시간 확인
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {riskStudents.length === 0 ? (
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                    현재 고위험 또는 주의 학생이 없습니다.
                  </div>
                ) : (
                  riskStudents.map((student) => {
                    const riskMeta = getRiskMeta(student.level)
                    const linkedClass = student.student.enrollments[0]?.class.name ?? '미배정'

                    return (
                      <Link
                        key={student.id}
                        href={`/admin/students/${student.student.id}`}
                        className="block rounded-[26px] border border-rose-100 bg-white p-5 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-rose-500" />
                              <p className="text-lg font-semibold text-slate-900">
                                {student.student.name}
                              </p>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                                {linkedClass}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {buildRiskReason(student) || '위험 요인 데이터 없음'}
                            </p>
                          </div>

                          <div className="min-w-[140px] rounded-2xl bg-rose-50 px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.22em] text-rose-400">
                              {riskMeta.label}
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-rose-700">
                              {student.score}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <ProgressBar value={student.score} tone={riskMeta.tone} />
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            </article>

            <div className="space-y-6">
              <article className="surface-card rounded-[32px] border border-white/70 p-6">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-sky-500" />
                  <h2 className="text-xl font-semibold text-slate-950">오늘 수업 현황</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {todayClasses.length === 0 ? (
                    <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                      오늘 등록된 수업이 없습니다.
                    </div>
                  ) : (
                    todayClasses.map((lesson) => (
                      <Link
                        key={lesson.id}
                        href="/admin/schedule"
                        className="block rounded-[24px] bg-slate-50 px-4 py-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900">{lesson.title}</p>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                            {lesson.time}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{lesson.status}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {lesson.room}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </article>

              <article className="surface-card rounded-[32px] border border-white/70 p-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  <h2 className="text-xl font-semibold text-slate-950">다가오는 과제</h2>
                </div>
                <div className="mt-5 space-y-3">
                  {upcomingAssignments.length === 0 ? (
                    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                      등록된 과제가 없습니다.
                    </div>
                  ) : (
                    upcomingAssignments.map((item) => (
                      <Link
                        key={item.id}
                        href="/admin/classes"
                        className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-slate-900">{item.title}</p>
                          <TrendingUp className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{item.class.name}</p>
                        <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                          <span>{formatDate(item.dueDate)}</span>
                          <span>마감 예정</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </article>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <SurfaceCard>
              <SectionHeading
                title="민원 대응 현황"
                subtitle="최근 등록된 민원과 현재 상태를 빠르게 확인합니다."
              />
              <div className="mt-5 space-y-3">
                {recentComplaintItems.length === 0 ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    최근 민원이 없습니다.
                  </div>
                ) : (
                  recentComplaintItems.map((item) => {
                    const meta = getComplaintMeta(item.status)

                    return (
                      <Link
                        key={item.id}
                        href="/admin/complaints"
                        className="block rounded-[24px] border border-slate-200 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{item.student.name}</p>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                              {item.content}
                            </p>
                          </div>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {formatDate(item.createdAt)}
                        </p>
                      </Link>
                    )
                  })
                )}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeading
                title="최근 상담과 운영 연결"
                subtitle="상담 기록과 이동 경로를 함께 보면서 후속 조치를 이어갑니다."
              />
              <div className="mt-5 space-y-3">
                {recentConsultations.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{item.student.name}</p>
                        <p className="mt-1 text-sm text-slate-500">담당자 {item.owner.name}</p>
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="grid gap-3 pt-2 sm:grid-cols-3">
                  <Link
                    href="/admin/students"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    학생 관리
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/churn"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    이탈 관리
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/admin/payments"
                    className="inline-flex items-center justify-between rounded-[24px] border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-700"
                  >
                    수납 관리
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
