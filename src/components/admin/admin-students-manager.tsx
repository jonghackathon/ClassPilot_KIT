'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  MessageSquareWarning,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'

import { useClasses } from '@/hooks/useClasses'
import { useUsers } from '@/hooks/useUsers'
import { apiRequest } from '@/lib/fetcher'
import {
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type RiskFilter = '전체' | '높음' | '주의' | '정상'
type AttendanceStatus = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
type ChurnLevel = 'SAFE' | 'WARNING' | 'DANGER'
type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'
type ConsultationType = 'PHONE' | 'TEXT' | 'IN_PERSON'
type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED'

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

type ClassItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
}

type ParentContact = {
  id: string
  name: string
  phone: string
  relation: string | null
}

type StudentProfile = {
  grade: string | null
  school: string | null
  birthDate?: string | null
  memo: string | null
  parents: ParentContact[]
}

type EnrollmentItem = {
  class: ClassItem
}

type AttendanceSummaryItem = {
  status: AttendanceStatus
}

type AttendanceDetailItem = {
  id: string
  date: string
  status: AttendanceStatus
  absenceReason: string | null
  homeworkStatus: 'COMPLETE' | 'INCOMPLETE' | null
  class: {
    id: string
    name: string
    subject: string | null
  }
}

type ChurnPredictionItem = {
  level: ChurnLevel
  score: number
  calculatedAt?: string
}

type SubmissionItem = {
  id: string
  status: SubmissionStatus
  submittedAt: string | null
  createdAt?: string
  assignment: {
    id: string
    title: string
    dueDate: string | null
    class: {
      id: string
      name: string
    }
  }
}

type ConsultationItem = {
  id: string
  type: ConsultationType
  content: string
  createdAt: string
  owner: {
    id: string
    name: string
    email: string | null
  }
}

type PaymentItem = {
  id: string
  month: string
  amount: number
  status: PaymentStatus
  paidAt: string | null
  note: string | null
  class: {
    id: string
    name: string
  } | null
}

type StudentListItem = {
  id: string
  name: string
  email: string
  phone: string | null
  active: boolean
  studentProfile: StudentProfile | null
  enrollments: EnrollmentItem[]
  attendances: AttendanceSummaryItem[]
  churnPredictions: ChurnPredictionItem[]
}

type StudentDetailItem = StudentListItem & {
  attendances: AttendanceDetailItem[]
  submissions: SubmissionItem[]
  studentConsultations: ConsultationItem[]
  payments: PaymentItem[]
}

type MeUser = {
  id: string
  name: string
}

type StudentFormState = {
  name: string
  email: string
  password: string
  phone: string
  grade: string
  school: string
  birthDate: string
  memo: string
  parentName: string
  parentPhone: string
  classIds: string[]
}

type ConsultationFormState = {
  type: ConsultationType
  content: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyStudentForm: StudentFormState = {
  name: '',
  email: '',
  password: '1234',
  phone: '',
  grade: '',
  school: '',
  birthDate: '',
  memo: '',
  parentName: '',
  parentPhone: '',
  classIds: [],
}

const emptyConsultationForm: ConsultationFormState = {
  type: 'PHONE',
  content: '',
}

function OverlayPanel({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-h-full w-full max-w-[720px] overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Admin Flow</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  textarea = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  textarea?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <input
          className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          value={value}
        />
      )}
    </label>
  )
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatMonth(value: string) {
  const [year, month] = value.split('-')

  if (!year || !month) {
    return value
  }

  return `${year}년 ${month}월`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getAttendanceRate(attendances: AttendanceSummaryItem[]) {
  if (attendances.length === 0) {
    return null
  }

  const attended = attendances.filter((item) => item.status !== 'ABSENT').length
  return Math.round((attended / attendances.length) * 100)
}

function getAttendanceTone(rate: number | null): Tone {
  if (rate === null) {
    return 'slate'
  }

  if (rate >= 90) {
    return 'emerald'
  }

  if (rate >= 75) {
    return 'amber'
  }

  return 'rose'
}

function getRiskMeta(level?: ChurnLevel | null) {
  if (level === 'DANGER') {
    return { label: '높음', tone: 'rose' as Tone }
  }

  if (level === 'WARNING') {
    return { label: '주의', tone: 'amber' as Tone }
  }

  return { label: '정상', tone: 'emerald' as Tone }
}

function getAttendanceStatusMeta(status: AttendanceStatus) {
  if (status === 'PRESENT') {
    return { label: '출석', tone: 'emerald' as Tone }
  }

  if (status === 'LATE') {
    return { label: '지각', tone: 'amber' as Tone }
  }

  if (status === 'EARLY_LEAVE') {
    return { label: '조퇴', tone: 'sky' as Tone }
  }

  return { label: '결석', tone: 'rose' as Tone }
}

function getPaymentStatusMeta(status: PaymentStatus) {
  if (status === 'PAID') {
    return { label: '완납', tone: 'emerald' as Tone }
  }

  if (status === 'PARTIAL') {
    return { label: '부분 납부', tone: 'amber' as Tone }
  }

  return { label: '미납', tone: 'rose' as Tone }
}

function getConsultationTypeLabel(type: ConsultationType) {
  if (type === 'PHONE') {
    return '전화 상담'
  }

  if (type === 'TEXT') {
    return '문자 상담'
  }

  return '방문 상담'
}

function getSubmissionStatusMeta(status: SubmissionStatus) {
  if (status === 'REVIEWED') {
    return { label: '피드백 완료', tone: 'emerald' as Tone }
  }

  if (status === 'SUBMITTED') {
    return { label: '제출 완료', tone: 'indigo' as Tone }
  }

  return { label: '작성 중', tone: 'slate' as Tone }
}

async function syncStudentClasses(
  studentId: string,
  nextClassIds: string[],
  currentClassIds: string[],
) {
  const addTargets = nextClassIds.filter((classId) => !currentClassIds.includes(classId))
  const removeTargets = currentClassIds.filter((classId) => !nextClassIds.includes(classId))

  await Promise.all([
    ...addTargets.map((classId) =>
      apiRequest(`/api/classes/${classId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          addStudentIds: [studentId],
          removeStudentIds: [],
        }),
      }),
    ),
    ...removeTargets.map((classId) =>
      apiRequest(`/api/classes/${classId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          addStudentIds: [],
          removeStudentIds: [studentId],
        }),
      }),
    ),
  ])
}

function StudentFormFields({
  form,
  onChange,
  classes,
}: {
  form: StudentFormState
  onChange: (patch: Partial<StudentFormState>) => void
  classes: ClassItem[]
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="학생 이름"
          onChange={(value) => onChange({ name: value })}
          placeholder="민수"
          value={form.name}
        />
        <Field
          label="이메일"
          onChange={(value) => onChange({ email: value })}
          placeholder="student@academind.kr"
          type="email"
          value={form.email}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="초기 비밀번호"
          onChange={(value) => onChange({ password: value })}
          placeholder="1234"
          value={form.password}
        />
        <Field
          label="연락처"
          onChange={(value) => onChange({ phone: value })}
          placeholder="010-0000-0000"
          value={form.phone}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="학년"
          onChange={(value) => onChange({ grade: value })}
          placeholder="중2"
          value={form.grade}
        />
        <Field
          label="학교"
          onChange={(value) => onChange({ school: value })}
          placeholder="중앙중"
          value={form.school}
        />
        <Field
          label="생년월일"
          onChange={(value) => onChange({ birthDate: value })}
          placeholder="2020-01-01"
          type="date"
          value={form.birthDate}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="학부모 이름"
          onChange={(value) => onChange({ parentName: value })}
          placeholder="민수 어머니"
          value={form.parentName}
        />
        <Field
          label="학부모 연락처"
          onChange={(value) => onChange({ parentPhone: value })}
          placeholder="010-9999-0001"
          value={form.parentPhone}
        />
      </div>

      <Field
        label="학생 메모"
        onChange={(value) => onChange({ memo: value })}
        placeholder="학습 메모나 운영 메모를 입력해 주세요."
        textarea
        value={form.memo}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">수강반 배정</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {classes.map((item) => {
            const checked = form.classIds.includes(item.id)

            return (
              <label
                key={item.id}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-[24px] border px-4 py-4 transition',
                  checked
                    ? 'border-indigo-200 bg-indigo-50/70'
                    : 'border-slate-200 bg-white',
                )}
              >
                <input
                  checked={checked}
                  className="mt-1"
                  onChange={() =>
                    onChange({
                      classIds: checked
                        ? form.classIds.filter((classId) => classId !== item.id)
                        : [...form.classIds, item.id],
                    })
                  }
                  type="checkbox"
                />
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.subject ?? '과목 미설정'}
                    {item.level ? ` · ${item.level}` : ''}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AdminStudentsManagerPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('전체')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState<StudentFormState>(emptyStudentForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => window.clearTimeout(timeout)
  }, [search])

  const usersQuery = useMemo(() => {
    const params = new URLSearchParams({
      role: 'STUDENT',
      limit: '100',
    })

    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    }

    return `?${params.toString()}`
  }, [debouncedSearch])

  const { data, isLoading, mutate } =
    useUsers<ApiEnvelope<PaginatedData<StudentListItem>>>(usersQuery)
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')

  const students = data?.data.items ?? []
  const classes = classesResponse?.data.items ?? []

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const risk = getRiskMeta(student.churnPredictions[0]?.level).label
      return riskFilter === '전체' ? true : risk === riskFilter
    })
  }, [riskFilter, students])

  const riskCounts = useMemo(() => {
    return filteredStudents.reduce(
      (acc, student) => {
        const risk = getRiskMeta(student.churnPredictions[0]?.level).label
        acc[risk] += 1
        return acc
      },
      { 높음: 0, 주의: 0, 정상: 0 },
    )
  }, [filteredStudents])

  const highlightedStudents = useMemo(() => {
    return [...filteredStudents]
      .sort((a, b) => {
        const scoreA = a.churnPredictions[0]?.score ?? 0
        const scoreB = b.churnPredictions[0]?.score ?? 0
        return scoreB - scoreA
      })
      .slice(0, 3)
  }, [filteredStudents])

  async function handleCreateStudent() {
    if (!registerForm.name || !registerForm.email) {
      setFeedback({
        tone: 'amber',
        title: '필수 정보를 먼저 입력해 주세요.',
        description: '학생 이름과 이메일은 반드시 필요합니다.',
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await apiRequest<ApiEnvelope<{ id: string }>>('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          password: registerForm.password || '1234',
          role: 'STUDENT',
          phone: registerForm.phone || null,
          grade: registerForm.grade || null,
          school: registerForm.school || null,
          birthDate: registerForm.birthDate || null,
          memo: registerForm.memo || null,
          parentName: registerForm.parentName || null,
          parentPhone: registerForm.parentPhone || null,
        }),
      })

      await syncStudentClasses(response.data.id, registerForm.classIds, [])
      await mutate()
      setFeedback({
        tone: 'emerald',
        title: '학생 등록을 완료했습니다.',
        description: `${registerForm.name} 학생 정보를 저장하고 반 배정까지 반영했습니다.`,
      })
      setRegisterForm(emptyStudentForm)
      setRegisterOpen(false)
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '학생 등록에 실패했습니다.',
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 관리"
        title="학생 목록과 위험 신호를 실제 데이터 기준으로 관리해요"
        description="검색, 위험도 필터, 학생 등록, 상세 진입까지 운영자가 가장 자주 쓰는 흐름을 실제 API와 연결했습니다."
        action={
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            onClick={() => setRegisterOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            학생 등록
          </button>
        }
      />

      {feedback ? (
        <SurfaceCard
          className={cx(
            feedback.tone === 'emerald'
              ? 'border border-emerald-100 bg-emerald-50/80'
              : feedback.tone === 'rose'
                ? 'border border-rose-100 bg-rose-50/80'
                : 'border border-amber-100 bg-amber-50/80',
          )}
        >
          <p className="font-semibold text-slate-900">{feedback.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.description}</p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="이름, 이메일로 학생 찾기"
                value={search}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(['전체', '높음', '주의', '정상'] as const).map((risk) => (
                <button
                  key={risk}
                  className={cx(
                    chipButton,
                    riskFilter === risk
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200',
                  )}
                  onClick={() => setRiskFilter(risk)}
                  type="button"
                >
                  {risk === '전체' ? '위험도 전체' : risk}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-300" />
              <p className="text-sm font-semibold">실시간 학생 요약</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">높음</p>
                <p className="mt-2 text-2xl font-semibold">{riskCounts.높음}명</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">주의</p>
                <p className="mt-2 text-2xl font-semibold">{riskCounts.주의}명</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">정상</p>
                <p className="mt-2 text-2xl font-semibold">{riskCounts.정상}명</p>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading
            title="학생 목록"
            subtitle={
              isLoading ? '학생 데이터를 불러오는 중입니다.' : `필터 결과 ${filteredStudents.length}명`
            }
          />

          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              학생 데이터를 불러오는 중입니다.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
              조건에 맞는 학생이 없습니다.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">이름</th>
                    <th className="pb-3 font-medium">학년</th>
                    <th className="pb-3 font-medium">수강반</th>
                    <th className="pb-3 font-medium">출석률</th>
                    <th className="pb-3 font-medium">이탈</th>
                    <th className="pb-3 font-medium text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => {
                    const attendanceRate = getAttendanceRate(student.attendances)
                    const risk = getRiskMeta(student.churnPredictions[0]?.level)

                    return (
                      <tr key={student.id}>
                        <td className="py-4 font-semibold text-slate-900">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="transition hover:text-indigo-600"
                          >
                            {student.name}
                          </Link>
                        </td>
                        <td className="py-4 text-slate-600">
                          {student.studentProfile?.grade ?? '미설정'}
                        </td>
                        <td className="py-4 text-slate-600">
                          {student.enrollments.length > 0
                            ? student.enrollments.map((item) => item.class.name).join(', ')
                            : '미배정'}
                        </td>
                        <td className="py-4 text-slate-600">
                          {attendanceRate === null ? '기록 없음' : `${attendanceRate}%`}
                        </td>
                        <td className="py-4">
                          <StatusBadge label={risk.label} tone={risk.tone} />
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/admin/students/${student.id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600"
                          >
                            보기
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading
              title="주의 학생 요약"
              subtitle="이탈 점수가 높은 학생부터 바로 볼 수 있습니다."
            />
            <div className="mt-5 space-y-3">
              {highlightedStudents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  표시할 학생이 없습니다.
                </div>
              ) : (
                highlightedStudents.map((student) => {
                  const risk = getRiskMeta(student.churnPredictions[0]?.level)
                  const score = student.churnPredictions[0]?.score ?? 0

                  return (
                    <Link
                      key={student.id}
                      href={`/admin/students/${student.id}`}
                      className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:border-indigo-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{student.name}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {student.enrollments.map((item) => item.class.name).join(', ') || '반 미배정'}
                          </p>
                        </div>
                        <StatusBadge label={risk.label} tone={risk.tone} />
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={score} tone={risk.tone} />
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="등록 체크리스트" subtitle="실제 등록 폼과 연결된 항목입니다." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatusBadge label="이름 / 이메일" tone="indigo" />
              <StatusBadge label="학교 / 학년" tone="sky" />
              <StatusBadge label="수강반 매핑" tone="violet" />
              <StatusBadge label="학부모 연락처" tone="amber" />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        description="학생 기본 정보와 반 배정을 한 번에 저장합니다."
        onClose={() => setRegisterOpen(false)}
        open={registerOpen}
        title="신규 학생 등록"
      >
        <StudentFormFields
          classes={classes}
          form={registerForm}
          onChange={(patch) => setRegisterForm((current) => ({ ...current, ...patch }))}
        />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRegisterOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSubmitting}
            onClick={handleCreateStudent}
            type="button"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            학생 등록
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminStudentDetailManagerPage({ studentId }: { studentId: string }) {
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'assignment' | 'consultation' | 'payment'
  >('attendance')
  const [editOpen, setEditOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)
  const [editForm, setEditForm] = useState<StudentFormState>(emptyStudentForm)
  const [consultationForm, setConsultationForm] =
    useState<ConsultationFormState>(emptyConsultationForm)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data, error, isLoading, mutate } =
    useSWR<ApiEnvelope<StudentDetailItem>>(`/api/users/${studentId}`)
  const { data: meResponse } = useSWR<ApiEnvelope<MeUser>>('/api/auth/me')
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')

  const student = data?.data ?? null
  const classes = classesResponse?.data.items ?? []

  useEffect(() => {
    if (!student) {
      return
    }

    setEditForm({
      name: student.name,
      email: student.email,
      password: '1234',
      phone: student.phone ?? '',
      grade: student.studentProfile?.grade ?? '',
      school: student.studentProfile?.school ?? '',
      birthDate: student.studentProfile?.birthDate
        ? student.studentProfile.birthDate.slice(0, 10)
        : '',
      memo: student.studentProfile?.memo ?? '',
      parentName: student.studentProfile?.parents[0]?.name ?? '',
      parentPhone: student.studentProfile?.parents[0]?.phone ?? '',
      classIds: student.enrollments.map((item) => item.class.id),
    })
  }, [student])

  const attendanceRate = student ? getAttendanceRate(student.attendances) : null
  const latestRisk = student ? getRiskMeta(student.churnPredictions[0]?.level) : null
  const currentClassIds = student?.enrollments.map((item) => item.class.id) ?? []

  const attendanceCounts = useMemo(() => {
    return (
      student?.attendances.reduce(
        (acc, item) => {
          acc[item.status] += 1
          return acc
        },
        { PRESENT: 0, LATE: 0, EARLY_LEAVE: 0, ABSENT: 0 },
      ) ?? { PRESENT: 0, LATE: 0, EARLY_LEAVE: 0, ABSENT: 0 }
    )
  }, [student])

  async function handleSaveStudent() {
    if (!student) {
      return
    }

    try {
      setIsSaving(true)

      await apiRequest(`/api/users/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          role: 'STUDENT',
          grade: editForm.grade || null,
          school: editForm.school || null,
          birthDate: editForm.birthDate || null,
          memo: editForm.memo || null,
          parentName: editForm.parentName || null,
          parentPhone: editForm.parentPhone || null,
        }),
      })

      await syncStudentClasses(student.id, editForm.classIds, currentClassIds)
      await mutate()
      setEditOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '학생 정보를 업데이트했습니다.',
        description: `${editForm.name} 학생의 기본 정보와 반 배정을 반영했습니다.`,
      })
    } catch (saveError) {
      setFeedback({
        tone: 'rose',
        title: '학생 정보 저장에 실패했습니다.',
        description:
          saveError instanceof Error
            ? saveError.message
            : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateConsultation() {
    if (!student || !meResponse?.data) {
      return
    }

    if (!consultationForm.content.trim()) {
      setFeedback({
        tone: 'amber',
        title: '상담 내용을 입력해 주세요.',
        description: '비어 있는 상담 기록은 저장할 수 없습니다.',
      })
      return
    }

    try {
      setIsSaving(true)

      await apiRequest('/api/consultations', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          ownerId: meResponse.data.id,
          type: consultationForm.type,
          content: consultationForm.content.trim(),
        }),
      })

      await mutate()
      setConsultOpen(false)
      setConsultationForm(emptyConsultationForm)
      setFeedback({
        tone: 'emerald',
        title: '상담 기록을 추가했습니다.',
        description: `${student.name} 학생의 상담 이력에 새 기록을 남겼습니다.`,
      })
    } catch (saveError) {
      setFeedback({
        tone: 'rose',
        title: '상담 기록 저장에 실패했습니다.',
        description:
          saveError instanceof Error
            ? saveError.message
            : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="학생 상세"
          title="학생 상세 정보를 불러오는 중입니다"
          description="학생 기본 정보와 운영 이력을 준비하고 있어요."
          backHref="/admin/students"
          backLabel="학생 목록"
        />
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          학생 데이터를 불러오는 중입니다.
        </SurfaceCard>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="학생 상세"
          title="학생 정보를 찾을 수 없습니다"
          description="잘못된 링크이거나 삭제된 학생일 수 있습니다."
          backHref="/admin/students"
          backLabel="학생 목록"
        />
        <SurfaceCard className="border border-rose-100 bg-rose-50/80">
          <p className="font-semibold text-rose-900">조회 가능한 학생이 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            학생 목록으로 돌아가서 다시 선택해 주세요.
          </p>
        </SurfaceCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 상세"
        title={`${student.name} 학생의 출결, 과제, 상담, 결제 흐름을 실제 데이터로 확인해요`}
        description="학생 기본 정보와 최근 운영 이력을 한 화면에 모아 운영자가 바로 판단할 수 있게 연결했습니다."
        backHref="/admin/students"
        backLabel="학생 목록"
        action={
          <div className="flex flex-wrap gap-3">
            <button className={secondaryButton} onClick={() => setEditOpen(true)} type="button">
              학생 정보 수정
            </button>
            <button
              className={cx(
                primaryButton,
                'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
              )}
              onClick={() => setConsultOpen(true)}
              type="button"
            >
              상담 기록 추가
            </button>
          </div>
        }
      />

      {feedback ? (
        <SurfaceCard
          className={cx(
            feedback.tone === 'emerald'
              ? 'border border-emerald-100 bg-emerald-50/80'
              : feedback.tone === 'rose'
                ? 'border border-rose-100 bg-rose-50/80'
                : 'border border-amber-100 bg-amber-50/80',
          )}
        >
          <p className="font-semibold text-slate-900">{feedback.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.description}</p>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          detail={`${student.enrollments.length}개 반 수강`}
          icon={Users}
          label="수강반"
          tone="indigo"
          value={`${student.enrollments.length}개`}
        />
        <MetricCard
          detail={attendanceRate === null ? '출결 기록 없음' : '최근 출결 기준'}
          icon={CheckCircle2}
          label="출석률"
          tone={getAttendanceTone(attendanceRate)}
          value={attendanceRate === null ? '-' : `${attendanceRate}%`}
        />
        <MetricCard
          detail={student.churnPredictions[0] ? '최근 이탈 예측 반영' : '예측 기록 없음'}
          icon={AlertTriangle}
          label="이탈 위험"
          tone={latestRisk?.tone ?? 'slate'}
          value={latestRisk?.label ?? '미계산'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <SurfaceCard className="h-fit">
          <SectionHeading title="기본 정보" subtitle="학생 요약" />
          <div className="mt-5 space-y-5">
            <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Student</p>
              <h2 className="mt-2 text-2xl font-semibold">{student.name}</h2>
              <p className="mt-2 text-sm text-slate-300">
                {student.studentProfile?.grade ?? '학년 미설정'}
                {student.studentProfile?.school ? ` · ${student.studentProfile.school}` : ''}
                {' · '}
                {student.active ? '재원' : '비활성'}
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                이메일: {student.email}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                연락처: {student.phone ?? '미등록'}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                학부모 연락처: {student.studentProfile?.parents[0]?.phone ?? '미등록'}
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">
                수강반:{' '}
                {student.enrollments.length > 0
                  ? student.enrollments.map((item) => item.class.name).join(', ')
                  : '미배정'}
              </div>
            </div>

            <div
              className={cx(
                'rounded-[28px] px-5 py-5',
                latestRisk?.tone === 'rose'
                  ? 'border border-rose-100 bg-rose-50'
                  : latestRisk?.tone === 'amber'
                    ? 'border border-amber-100 bg-amber-50'
                    : 'border border-emerald-100 bg-emerald-50',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-800">이탈 위험도</p>
                <StatusBadge
                  label={
                    student.churnPredictions[0]
                      ? `${student.churnPredictions[0].score}% ${latestRisk?.label}`
                      : '예측 없음'
                  }
                  tone={latestRisk?.tone ?? 'slate'}
                />
              </div>
              <div className="mt-4">
                <ProgressBar
                  value={student.churnPredictions[0]?.score ?? 0}
                  tone={latestRisk?.tone ?? 'slate'}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {student.studentProfile?.memo ?? '등록된 학생 메모가 없습니다.'}
              </p>
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <div className="flex flex-wrap gap-2">
              {[
                ['attendance', '출결'],
                ['assignment', '과제'],
                ['consultation', '상담'],
                ['payment', '결제'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={cx(
                    chipButton,
                    activeTab === key
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200',
                  )}
                  onClick={() =>
                    setActiveTab(
                      key as 'attendance' | 'assignment' | 'consultation' | 'payment',
                    )
                  }
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </SurfaceCard>

          {activeTab === 'attendance' ? (
            <SurfaceCard>
              <SectionHeading title="출결 요약" subtitle="최근 30건 기준" />
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  detail="정상 출석"
                  icon={CheckCircle2}
                  label="출석"
                  tone="emerald"
                  value={`${attendanceCounts.PRESENT}회`}
                />
                <MetricCard
                  detail="주의 필요"
                  icon={AlertTriangle}
                  label="지각"
                  tone="amber"
                  value={`${attendanceCounts.LATE}회`}
                />
                <MetricCard
                  detail="중간 퇴실"
                  icon={CalendarClock}
                  label="조퇴"
                  tone="sky"
                  value={`${attendanceCounts.EARLY_LEAVE}회`}
                />
                <MetricCard
                  detail="후속 확인"
                  icon={MessageSquareWarning}
                  label="결석"
                  tone="rose"
                  value={`${attendanceCounts.ABSENT}회`}
                />
              </div>

              <div className="mt-6 space-y-3">
                {student.attendances.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    출결 기록이 없습니다.
                  </div>
                ) : (
                  student.attendances.map((item) => {
                    const meta = getAttendanceStatusMeta(item.status)

                    return (
                      <div
                        key={item.id}
                        className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{item.class.name}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(item.date)}
                              {item.class.subject ? ` · ${item.class.subject}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <StatusBadge label={meta.label} tone={meta.tone} />
                            {item.homeworkStatus ? (
                              <StatusBadge
                                label={
                                  item.homeworkStatus === 'COMPLETE'
                                    ? '숙제 완료'
                                    : '숙제 미완료'
                                }
                                tone={
                                  item.homeworkStatus === 'COMPLETE' ? 'violet' : 'amber'
                                }
                              />
                            ) : null}
                          </div>
                        </div>
                        {item.absenceReason ? (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            사유: {item.absenceReason}
                          </p>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'assignment' ? (
            <SurfaceCard>
              <SectionHeading title="과제 현황" subtitle="최근 제출 기록" />
              <div className="mt-5 space-y-3">
                {student.submissions.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    제출된 과제가 없습니다.
                  </div>
                ) : (
                  student.submissions.map((submission) => {
                    const meta = getSubmissionStatusMeta(submission.status)

                    return (
                      <div
                        key={submission.id}
                        className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {submission.assignment.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {submission.assignment.class.name}
                              {submission.assignment.dueDate
                                ? ` · 마감 ${formatDate(submission.assignment.dueDate)}`
                                : ''}
                            </p>
                          </div>
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          {submission.submittedAt
                            ? `제출일 ${formatDate(submission.submittedAt)}`
                            : '아직 제출되지 않았습니다.'}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'consultation' ? (
            <SurfaceCard>
              <SectionHeading
                action={
                  <button
                    className={secondaryButton}
                    onClick={() => setConsultOpen(true)}
                    type="button"
                  >
                    상담 추가
                  </button>
                }
                title="상담 기록"
                subtitle="최근 상담 이력과 후속 조치"
              />
              <div className="mt-5 space-y-3">
                {student.studentConsultations.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    상담 기록이 없습니다.
                  </div>
                ) : (
                  student.studentConsultations.map((row) => (
                    <div
                      key={row.id}
                      className="rounded-[24px] bg-slate-50 px-4 py-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {getConsultationTypeLabel(row.type)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(row.createdAt)} · {row.owner.name}
                          </p>
                        </div>
                        <StatusBadge label="후속 체크" tone="amber" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{row.content}</p>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'payment' ? (
            <SurfaceCard>
              <SectionHeading title="결제 이력" subtitle="최근 수납 상태" />
              <div className="mt-5 space-y-3">
                {student.payments.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    결제 이력이 없습니다.
                  </div>
                ) : (
                  student.payments.map((payment) => {
                    const meta = getPaymentStatusMeta(payment.status)

                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatMonth(payment.month)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatCurrency(payment.amount)}
                            {payment.class ? ` · ${payment.class.name}` : ''}
                          </p>
                          {payment.note ? (
                            <p className="mt-2 text-sm text-slate-500">{payment.note}</p>
                          ) : null}
                        </div>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                    )
                  })
                )}
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </div>

      <OverlayPanel
        description="학생 기본 정보와 현재 반 배정을 수정합니다."
        onClose={() => setEditOpen(false)}
        open={editOpen}
        title="학생 정보 수정"
      >
        <StudentFormFields
          classes={classes}
          form={editForm}
          onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setEditOpen(false)} type="button">
            닫기
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving}
            onClick={handleSaveStudent}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            변경 내용 반영
          </button>
        </div>
      </OverlayPanel>

      <OverlayPanel
        description="전화, 문자, 방문 상담 기록을 바로 학생 상세에 남깁니다."
        onClose={() => setConsultOpen(false)}
        open={consultOpen}
        title="상담 기록 추가"
      >
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">상담 유형</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setConsultationForm((current) => ({
                  ...current,
                  type: event.target.value as ConsultationType,
                }))
              }
              value={consultationForm.type}
            >
              <option value="PHONE">전화 상담</option>
              <option value="TEXT">문자 상담</option>
              <option value="IN_PERSON">방문 상담</option>
            </select>
          </label>
          <Field
            label="상담 내용"
            onChange={(value) =>
              setConsultationForm((current) => ({ ...current, content: value }))
            }
            placeholder="최근 출석 저하와 과제 지연에 대해 보호자와 상담했습니다."
            textarea
            value={consultationForm.content}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setConsultOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving || !meResponse?.data}
            onClick={handleCreateConsultation}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            기록 저장
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
