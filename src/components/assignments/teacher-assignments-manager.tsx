'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  BookCheck,
  ClipboardCheck,
  LoaderCircle,
  NotebookPen,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import { useAssignments } from '@/hooks/useAssignments'
import { useClasses } from '@/hooks/useClasses'
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
import { EssayFeedback } from '@/components/ai/EssayFeedback'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type AssignmentType = 'WORKBOOK' | 'ESSAY' | 'IMAGE'
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
  enrollments: Array<{
    student: {
      id: string
      name: string
      email: string
    }
  }>
}

type AssignmentSummary = {
  id: string
  classId: string
  teacherId: string
  title: string
  content: string | null
  type: AssignmentType
  dueDate: string | null
  teacherNote: string | null
  imageUrls: string[]
  feedback: string | null
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    subject: string | null
  }
  teacher: {
    id: string
    name: string
    email: string
  }
  submissions: Array<{
    id: string
    status: SubmissionStatus
    teacherFeedback: string | null
  }>
}

type AssignmentDetail = {
  id: string
  classId: string
  teacherId: string
  title: string
  content: string | null
  type: AssignmentType
  dueDate: string | null
  teacherNote: string | null
  imageUrls: string[]
  feedback: string | null
  createdAt: string
  updatedAt: string
  class: {
    id: string
    name: string
    subject: string | null
    level: string | null
  }
  teacher: {
    id: string
    name: string
    email: string
  }
}

type SubmissionHistory = {
  id: string
  content: string
  attachments: string[]
  charCount: number
  createdAt: string
}

type SubmissionItem = {
  id: string
  assignmentId: string
  studentId: string
  content: string | null
  attachments: string[]
  aiUsed: boolean
  aiUsageDetail: string | null
  submittedAt: string | null
  status: SubmissionStatus
  teacherFeedback: string | null
  updatedAt: string
  student: {
    id: string
    name: string
    email: string
  }
  history: SubmissionHistory[]
}

type AssignmentFormState = {
  id?: string
  classId: string
  title: string
  type: AssignmentType
  dueDate: string
  content: string
  teacherNote: string
  imageUrls: string
}

type AssignmentRow = {
  studentId: string
  studentName: string
  studentEmail: string
  status: '제출' | '미제출'
  submittedAt: string | null
  aiUsesLabel: string
  historyCount: number
  teacherFeedback: string | null
  submission: SubmissionItem | null
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyAssignmentForm: AssignmentFormState = {
  classId: '',
  title: '',
  type: 'WORKBOOK',
  dueDate: '',
  content: '',
  teacherNote: '',
  imageUrls: '',
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
      <div className="mx-auto max-h-full w-full max-w-[760px] overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Flow</p>
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
    return '미설정'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatAssignmentType(type: AssignmentType) {
  if (type === 'WORKBOOK') return '문제풀이'
  if (type === 'IMAGE') return '이미지'
  return '에세이'
}

function getAssignmentTone(type: AssignmentType): Tone {
  if (type === 'WORKBOOK') return 'indigo'
  if (type === 'IMAGE') return 'sky'
  return 'violet'
}

function getProgressTone(value: number): Tone {
  if (value >= 90) return 'emerald'
  if (value >= 50) return 'indigo'
  return 'amber'
}

function getDueLabel(value?: string | null) {
  if (!value) {
    return '마감일 미설정'
  }

  const dueDate = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  const diff = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000)
  if (diff < 0) {
    return `마감 ${Math.abs(diff)}일 지남`
  }
  if (diff === 0) {
    return '오늘 마감'
  }

  return `마감 D-${diff}`
}

function toDateInput(value?: string | null) {
  if (!value) {
    return ''
  }

  return value.slice(0, 10)
}

function toDateTimeValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(`${value}T23:59:59`).toISOString()
}

function buildForm(item: AssignmentDetail): AssignmentFormState {
  return {
    id: item.id,
    classId: item.classId,
    title: item.title,
    type: item.type,
    dueDate: toDateInput(item.dueDate),
    content: item.content ?? '',
    teacherNote: item.teacherNote ?? '',
    imageUrls: item.imageUrls.join('\n'),
  }
}

function parseImageUrls(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getLatestSubmissionText(submission: SubmissionItem | null) {
  if (!submission) {
    return ''
  }

  const latestHistory = [...submission.history].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )[0]

  return latestHistory?.content?.trim() || submission.content?.trim() || ''
}

export function TeacherAssignmentsManagerPage() {
  const [statusFilter, setStatusFilter] = useState<'전체' | '진행중' | '피드백 대기'>('전체')
  const [typeFilter, setTypeFilter] = useState<'전체' | AssignmentType>('전체')
  const [classFilter, setClassFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState<AssignmentFormState>(emptyAssignmentForm)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data: assignmentsResponse, error: assignmentsError, mutate: mutateAssignments } =
    useAssignments<ApiEnvelope<PaginatedData<AssignmentSummary>>>('?limit=100')
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')

  const assignments = useMemo(
    () => assignmentsResponse?.data.items ?? [],
    [assignmentsResponse],
  )
  const classes = useMemo(() => classesResponse?.data.items ?? [], [classesResponse])

  const classMap = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item]))
  }, [classes])

  const enrichedAssignments = useMemo(() => {
    return assignments
      .map((item) => {
        const rosterCount = classMap.get(item.classId)?.enrollments.length ?? 0
        const submittedCount = item.submissions.filter(
          (submission) => submission.status !== 'DRAFT',
        ).length
        const feedbackPending = item.submissions.filter(
          (submission) =>
            submission.status !== 'DRAFT' && !submission.teacherFeedback?.trim(),
        ).length
        const progress =
          rosterCount > 0 ? Math.round((submittedCount / rosterCount) * 100) : 0

        return {
          ...item,
          rosterCount,
          submittedCount,
          feedbackPending,
          progress,
        }
      })
      .filter((item) => {
        if (typeFilter !== '전체' && item.type !== typeFilter) {
          return false
        }
        if (classFilter !== '전체' && item.classId !== classFilter) {
          return false
        }
        if (statusFilter === '진행중' && item.progress >= 100) {
          return false
        }
        if (statusFilter === '피드백 대기' && item.feedbackPending === 0) {
          return false
        }

        if (!search.trim()) {
          return true
        }

        const keyword = search.trim().toLowerCase()
        return [
          item.title,
          item.content ?? '',
          item.class.name,
          item.class.subject ?? '',
          item.teacherNote ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      })
  }, [assignments, classFilter, classMap, search, statusFilter, typeFilter])

  const summary = useMemo(() => {
    const totalFeedbackPending = enrichedAssignments.reduce(
      (total, item) => total + item.feedbackPending,
      0,
    )
    const totalSubmitted = enrichedAssignments.reduce(
      (total, item) => total + item.submittedCount,
      0,
    )
    const totalRoster = enrichedAssignments.reduce(
      (total, item) => total + item.rosterCount,
      0,
    )
    const overallProgress =
      totalRoster > 0 ? Math.round((totalSubmitted / totalRoster) * 100) : 0

    return {
      totalAssignments: enrichedAssignments.length,
      totalFeedbackPending,
      overallProgress,
    }
  }, [enrichedAssignments])

  async function handleCreateAssignment() {
    if (!form.classId || !form.title.trim()) {
      setFeedback({
        tone: 'amber',
        title: '입력 확인',
        description: '반과 과제 제목은 필수입니다.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await apiRequest<ApiEnvelope<AssignmentSummary>>('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          classId: form.classId,
          title: form.title.trim(),
          type: form.type,
          dueDate: toDateTimeValue(form.dueDate),
          content: form.content.trim() || null,
          teacherNote: form.teacherNote.trim() || null,
          imageUrls: parseImageUrls(form.imageUrls),
        }),
      })

      await mutateAssignments()
      setCreateOpen(false)
      setForm(emptyAssignmentForm)
      setFeedback({
        tone: 'emerald',
        title: '과제 생성 완료',
        description: '새 과제가 저장되고 목록이 갱신되었습니다.',
      })
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '저장 실패',
        description:
          error instanceof Error ? error.message : '과제 생성 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 관리"
        title="반별 과제 진행률과 피드백 대기 상태를 한 화면에서 관리합니다"
        description="실제 과제, 반, 제출 데이터를 연결해 생성부터 상세 확인까지 이어지는 강사용 흐름으로 전환했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            <NotebookPen className="h-4 w-4" />
            과제 만들기
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="운영 중 과제"
          value={`${summary.totalAssignments}건`}
          detail="현재 필터 기준"
          icon={BookCheck}
          tone="indigo"
        />
        <MetricCard
          label="전체 제출률"
          value={`${summary.overallProgress}%`}
          detail="반 정원 기준 집계"
          icon={ClipboardCheck}
          tone={getProgressTone(summary.overallProgress)}
        />
        <MetricCard
          label="피드백 대기"
          value={`${summary.totalFeedbackPending}건`}
          detail="학생 제출물 검토 필요"
          icon={Sparkles}
          tone={summary.totalFeedbackPending > 0 ? 'amber' : 'emerald'}
        />
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-700 outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="과제명, 반 이름, 설명으로 검색"
                value={search}
              />
            </label>
            <select
              className="h-[52px] rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
              onChange={(event) => setClassFilter(event.target.value)}
              value={classFilter}
            >
              <option value="전체">전체 반</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['전체', '진행중', '피드백 대기'] as const).map((status) => (
              <button
                key={status}
                className={cx(
                  chipButton,
                  statusFilter === status
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setStatusFilter(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {(['전체', 'WORKBOOK', 'ESSAY', 'IMAGE'] as const).map((type) => (
              <button
                key={type}
                className={cx(
                  chipButton,
                  typeFilter === type
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setTypeFilter(type)}
                type="button"
              >
                {type === '전체' ? type : formatAssignmentType(type)}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {assignmentsError ? (
        <SurfaceCard className="border border-rose-100 bg-rose-50/70">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">준비 중입니다.</p>
              <p className="mt-1 text-sm">{assignmentsError.message}</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {!assignmentsResponse && !assignmentsError ? (
        <SurfaceCard className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          과제 데이터를 불러오는 중입니다.
        </SurfaceCard>
      ) : null}

      {assignmentsResponse ? (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {enrichedAssignments.map((assignment) => (
              <SurfaceCard key={assignment.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-amber-600">
                        {getDueLabel(assignment.dueDate)}
                      </p>
                      <StatusBadge
                        label={formatAssignmentType(assignment.type)}
                        tone={getAssignmentTone(assignment.type)}
                      />
                      {assignment.feedbackPending > 0 ? (
                        <StatusBadge
                          label={`피드백 대기 ${assignment.feedbackPending}건`}
                          tone="amber"
                        />
                      ) : null}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {assignment.title}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {assignment.class.name}
                      {assignment.class.subject ? ` · ${assignment.class.subject}` : ''}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {assignment.content ?? '과제 설명이 아직 없습니다.'}
                    </p>
                  </div>
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="text-sm font-semibold text-indigo-600"
                  >
                    상세 보기
                  </Link>
                </div>
                <div className="mt-5">
                  <ProgressBar
                    value={assignment.progress}
                    tone={getProgressTone(assignment.progress)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <span>
                    제출 현황 {assignment.submittedCount} / {assignment.rosterCount || '-'}
                  </span>
                  <span>{formatDate(assignment.dueDate)}</span>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {assignment.teacherNote?.trim()
                    ? assignment.teacherNote
                    : '강사 메모가 아직 없습니다.'}
                </div>
              </SurfaceCard>
            ))}

            {enrichedAssignments.length === 0 && assignmentsResponse ? (
              <SurfaceCard className="py-16 text-center text-slate-500">
                현재 조건에 맞는 과제가 없습니다.
              </SurfaceCard>
            ) : null}
          </div>

          <SurfaceCard className="h-fit">
            <SectionHeading
              title="운영 메모"
              subtitle="현재 과제 운용 중 바로 확인할 항목"
            />
            <div className="mt-5 space-y-3">
              {[
                '문제풀이 과제는 채점 기준과 제출 형식을 같이 적어 둡니다.',
                '이미지 과제는 예시 이미지 URL 또는 업로드 링크를 함께 넣습니다.',
                '제출률이 낮은 반은 마감일보다 설명 보강이 먼저 필요합니다.',
                '피드백 대기 건수는 학생별 세부 피드백과 과제 공통 피드백으로 나눠서 관리합니다.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {feedback ? (
        <SurfaceCard
          className={cx(
            'border',
            feedback.tone === 'emerald'
              ? 'border-emerald-100 bg-emerald-50/70'
              : feedback.tone === 'rose'
                ? 'border-rose-100 bg-rose-50/70'
                : 'border-amber-100 bg-amber-50/70',
          )}
        >
          <p className="font-semibold text-slate-900">{feedback.title}</p>
          <p className="mt-1 text-sm text-slate-600">{feedback.description}</p>
        </SurfaceCard>
      ) : null}

      <OverlayPanel
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setForm(emptyAssignmentForm)
        }}
        title="새 과제 만들기"
        description="반, 유형, 마감일, 예시 이미지까지 한 번에 저장합니다."
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">반 선택</span>
          <select
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
            onChange={(event) =>
              setForm((current) => ({ ...current, classId: event.target.value }))
            }
            value={form.classId}
          >
            <option value="">반을 선택하세요</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="과제 제목"
            onChange={(value) => setForm((current) => ({ ...current, title: value }))}
            placeholder="예: Python 반복문 실습"
            value={form.title}
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">과제 유형</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as AssignmentType,
                }))
              }
              value={form.type}
            >
              <option value="WORKBOOK">문제풀이</option>
              <option value="ESSAY">에세이</option>
              <option value="IMAGE">이미지</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="마감일"
            onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
            placeholder="YYYY-MM-DD"
            type="date"
            value={form.dueDate}
          />
          <Field
            label="이미지 URL 목록"
            onChange={(value) =>
              setForm((current) => ({ ...current, imageUrls: value }))
            }
            placeholder="한 줄에 하나씩 입력"
            textarea
            value={form.imageUrls}
          />
        </div>

        <Field
          label="과제 설명"
          onChange={(value) => setForm((current) => ({ ...current, content: value }))}
          placeholder="학생에게 보여줄 과제 설명을 입력하세요."
          textarea
          value={form.content}
        />

        <Field
          label="강사 메모"
          onChange={(value) =>
            setForm((current) => ({ ...current, teacherNote: value }))
          }
          placeholder="채점 기준이나 안내 메모를 남기세요."
          textarea
          value={form.teacherNote}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            className={secondaryButton}
            onClick={() => setCreateOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            disabled={isSaving}
            onClick={handleCreateAssignment}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            과제 저장
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherAssignmentDetailManagerPage({
  assignmentId,
}: {
  assignmentId: string
}) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const [essayFeedbackOpen, setEssayFeedbackOpen] = useState(false)
  const [assignmentFeedbackOpen, setAssignmentFeedbackOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<AssignmentRow | null>(null)
  const [assignmentFeedback, setAssignmentFeedback] = useState('')
  const [studentFeedback, setStudentFeedback] = useState('')
  const [editForm, setEditForm] = useState<AssignmentFormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data: assignmentResponse, error: assignmentError, mutate: mutateAssignment } =
    useSWR<ApiEnvelope<AssignmentDetail>>(`/api/assignments/${assignmentId}`)
  const { data: submissionsResponse, error: submissionsError, mutate: mutateSubmissions } =
    useSWR<ApiEnvelope<PaginatedData<SubmissionItem>>>(
      `/api/assignments/${assignmentId}/submissions?limit=100`,
    )
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')

  const assignment = assignmentResponse?.data
  const submissions = useMemo(
    () => submissionsResponse?.data.items ?? [],
    [submissionsResponse],
  )
  const classes = useMemo(() => classesResponse?.data.items ?? [], [classesResponse])
  const currentClass = useMemo(
    () => classes.find((item) => item.id === assignment?.classId) ?? null,
    [assignment?.classId, classes],
  )
  const selectedSubmissionText = useMemo(
    () => getLatestSubmissionText(selectedRow?.submission ?? null),
    [selectedRow],
  )

  const rows = useMemo<AssignmentRow[]>(() => {
    if (!currentClass) {
      return submissions.map((submission) => ({
        studentId: submission.student.id,
        studentName: submission.student.name,
        studentEmail: submission.student.email,
        status: submission.status === 'DRAFT' ? '미제출' : '제출',
        submittedAt: submission.submittedAt,
        aiUsesLabel: submission.aiUsed ? '사용' : '미사용',
        historyCount: submission.history.length,
        teacherFeedback: submission.teacherFeedback,
        submission,
      }))
    }

    const submissionMap = new Map(
      submissions.map((submission) => [submission.studentId, submission]),
    )

    return currentClass.enrollments.map(({ student }) => {
      const submission = submissionMap.get(student.id) ?? null

      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        status:
          submission && submission.status !== 'DRAFT' ? '제출' : '미제출',
        submittedAt: submission?.submittedAt ?? null,
        aiUsesLabel: submission ? (submission.aiUsed ? '사용' : '미사용') : '-',
        historyCount: submission?.history.length ?? 0,
        teacherFeedback: submission?.teacherFeedback ?? null,
        submission,
      }
    })
  }, [currentClass, submissions])

  const metrics = useMemo(() => {
    const submitted = rows.filter((row) => row.status === '제출').length
    const feedbackPending = rows.filter(
      (row) => row.status === '제출' && !row.teacherFeedback?.trim(),
    ).length
    const aiUsed = rows.filter((row) => row.submission?.aiUsed).length

    return {
      submitted,
      total: rows.length,
      feedbackPending,
      aiUsed,
    }
  }, [rows])

  async function handleSaveAssignmentFeedback() {
    if (!assignment) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await apiRequest<ApiEnvelope<AssignmentDetail>>(
        `/api/assignments/${assignment.id}/feedback`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            teacherFeedback: assignmentFeedback.trim(),
          }),
        },
      )
      await mutateAssignment()
      setAssignmentFeedbackOpen(false)
      setMessage({
        tone: 'emerald',
        title: '공통 피드백 저장 완료',
        description: '과제 공통 피드백 메모가 저장되었습니다.',
      })
    } catch (error) {
      setMessage({
        tone: 'rose',
        title: '저장 실패',
        description:
          error instanceof Error ? error.message : '피드백 저장 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveStudentFeedback() {
    if (!selectedRow?.submission) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await apiRequest<ApiEnvelope<SubmissionItem>>(
        `/api/assignments/${assignmentId}/submissions/${selectedRow.submission.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            teacherFeedback: studentFeedback.trim(),
          }),
        },
      )
      await mutateSubmissions()
      setHistoryOpen(false)
      setMessage({
        tone: 'emerald',
        title: '학생 피드백 저장 완료',
        description: `${selectedRow.studentName} 학생 피드백이 저장되었습니다.`,
      })
    } catch (error) {
      setMessage({
        tone: 'rose',
        title: '저장 실패',
        description:
          error instanceof Error ? error.message : '학생 피드백 저장 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateAssignment() {
    if (!assignment || !editForm || !editForm.classId || !editForm.title.trim()) {
      setMessage({
        tone: 'amber',
        title: '입력 확인',
        description: '반과 과제 제목은 필수입니다.',
      })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await apiRequest<ApiEnvelope<AssignmentDetail>>(`/api/assignments/${assignment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          classId: editForm.classId,
          title: editForm.title.trim(),
          type: editForm.type,
          dueDate: toDateTimeValue(editForm.dueDate),
          content: editForm.content.trim() || null,
          teacherNote: editForm.teacherNote.trim() || null,
          imageUrls: parseImageUrls(editForm.imageUrls),
        }),
      })
      await mutateAssignment()
      setEditOpen(false)
      setMessage({
        tone: 'emerald',
        title: '과제 수정 완료',
        description: '과제 정보가 갱신되었습니다.',
      })
    } catch (error) {
      setMessage({
        tone: 'rose',
        title: '수정 실패',
        description:
          error instanceof Error ? error.message : '과제 수정 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAssignment() {
    if (!assignment) {
      return
    }

    const confirmed = window.confirm('이 과제를 삭제할까요? 제출물도 함께 제거될 수 있습니다.')
    if (!confirmed) {
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      await apiRequest<ApiEnvelope<{ id: string }>>(`/api/assignments/${assignment.id}`, {
        method: 'DELETE',
      })
      window.location.href = '/teacher/assignments'
    } catch (error) {
      setMessage({
        tone: 'rose',
        title: '삭제 실패',
        description:
          error instanceof Error ? error.message : '과제 삭제 중 오류가 발생했습니다.',
      })
      setIsSaving(false)
    }
  }

  if (!assignmentResponse && !assignmentError) {
    return (
      <SurfaceCard className="flex items-center justify-center gap-3 py-16 text-slate-500">
        <LoaderCircle className="h-5 w-5 animate-spin" />
        과제 상세를 불러오는 중입니다.
      </SurfaceCard>
    )
  }

  if (!assignment || assignmentError) {
    return (
      <SurfaceCard className="border border-rose-100 bg-rose-50/70">
        <div className="flex items-start gap-3 text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">준비 중입니다.</p>
            <p className="mt-1 text-sm">
              {assignmentError?.message ?? '과제 정보를 다시 확인해 주세요.'}
            </p>
          </div>
        </div>
      </SurfaceCard>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 상세"
        title={assignment.title}
        description="학생별 제출 현황, 작성 이력, 공통 피드백과 학생별 피드백을 한 흐름에서 관리합니다."
        backHref="/teacher/assignments"
        backLabel="과제 목록"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className={secondaryButton}
              onClick={() => {
                setEditForm(buildForm(assignment))
                setEditOpen(true)
              }}
              type="button"
            >
              수정
            </button>
            <button
              className={secondaryButton}
              onClick={() => {
                setAssignmentFeedback(assignment.feedback ?? '')
                setAssignmentFeedbackOpen(true)
              }}
              type="button"
            >
              공통 피드백
            </button>
            <button
              className={cx(
                primaryButton,
                'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20',
              )}
              disabled={isSaving}
              onClick={handleDeleteAssignment}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </button>
          </div>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={formatAssignmentType(assignment.type)}
            tone={getAssignmentTone(assignment.type)}
          />
          <StatusBadge
            label={`${assignment.class.name}${assignment.class.subject ? ` · ${assignment.class.subject}` : ''}`}
            tone="slate"
          />
          <StatusBadge label={formatDate(assignment.dueDate)} tone="amber" />
        </div>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {assignment.content ?? '과제 설명이 아직 없습니다.'}
        </p>
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">강사 메모</p>
          <p className="mt-2">{assignment.teacherNote?.trim() || '강사 메모가 아직 없습니다.'}</p>
        </div>
        {assignment.feedback?.trim() ? (
          <div className="mt-4 rounded-2xl bg-violet-50 px-4 py-4 text-sm text-violet-800">
            <p className="font-semibold">과제 공통 피드백</p>
            <p className="mt-2 whitespace-pre-line">{assignment.feedback}</p>
          </div>
        ) : null}
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="제출 완료"
          value={`${metrics.submitted} / ${metrics.total}`}
          detail="현재 반 기준"
          icon={NotebookPen}
          tone="indigo"
        />
        <MetricCard
          label="AI 사용"
          value={`${metrics.aiUsed}명`}
          detail="제출 학생 중 AI 사용"
          icon={Sparkles}
          tone="violet"
        />
        <MetricCard
          label="피드백 대기"
          value={`${metrics.feedbackPending}명`}
          detail="학생별 검토 필요"
          icon={ClipboardCheck}
          tone={metrics.feedbackPending > 0 ? 'amber' : 'emerald'}
        />
      </div>

      <SurfaceCard>
        <SectionHeading
          title="학생별 제출 현황"
          subtitle="작성 이력과 학생별 피드백을 바로 확인합니다."
        />
        {submissionsError ? (
          <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-4 text-sm text-rose-700">
            준비 중입니다.
          </div>
        ) : null}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">이름</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium">AI 사용</th>
                <th className="pb-3 font-medium">제출일</th>
                <th className="pb-3 font-medium">이력</th>
                <th className="pb-3 font-medium text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.studentId}>
                  <td className="py-4">
                    <p className="font-semibold text-slate-900">{row.studentName}</p>
                    <p className="mt-1 text-xs text-slate-500">{row.studentEmail}</p>
                  </td>
                  <td className="py-4">
                    <StatusBadge
                      label={row.status}
                      tone={row.status === '제출' ? 'emerald' : 'rose'}
                    />
                  </td>
                  <td className="py-4 text-slate-600">{row.aiUsesLabel}</td>
                  <td className="py-4 text-slate-600">{formatDateTime(row.submittedAt)}</td>
                  <td className="py-4 text-slate-600">{row.historyCount}회</td>
                  <td className="py-4 text-right">
                    <button
                      className="text-sm font-semibold text-indigo-600 disabled:text-slate-300"
                      disabled={!row.submission}
                      onClick={() => {
                        setSelectedRow(row)
                        setStudentFeedback(row.teacherFeedback ?? '')
                        setHistoryOpen(true)
                      }}
                      type="button"
                    >
                      이력 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      {message ? (
        <SurfaceCard
          className={cx(
            'border',
            message.tone === 'emerald'
              ? 'border-emerald-100 bg-emerald-50/70'
              : message.tone === 'rose'
                ? 'border-rose-100 bg-rose-50/70'
                : 'border-amber-100 bg-amber-50/70',
          )}
        >
          <p className="font-semibold text-slate-900">{message.title}</p>
          <p className="mt-1 text-sm text-slate-600">{message.description}</p>
        </SurfaceCard>
      ) : null}

      <OverlayPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={selectedRow ? `${selectedRow.studentName} 작성 이력` : '작성 이력'}
        description="학생이 저장하고 제출한 이력과 학생별 피드백을 함께 확인합니다."
      >
        {selectedRow?.submission ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusBadge
                label={`상태 ${selectedRow.status}`}
                tone={selectedRow.status === '제출' ? 'emerald' : 'rose'}
              />
              <StatusBadge label={`AI 사용 ${selectedRow.aiUsesLabel}`} tone="violet" />
            </div>
            {assignment.type === 'ESSAY' ? (
              <div className="rounded-2xl bg-violet-50 px-4 py-4 text-sm text-violet-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">AI 첨삭 초안</p>
                    <p className="mt-1 text-sm text-violet-800/80">
                      학생 최신 제출 텍스트를 바탕으로 강사 코멘트 초안을 생성할 수 있습니다.
                    </p>
                  </div>
                  <button
                    className={cx(
                      secondaryButton,
                      'border-violet-200 bg-white text-violet-700 hover:border-violet-300',
                    )}
                    disabled={!selectedSubmissionText}
                    onClick={() => setEssayFeedbackOpen(true)}
                    type="button"
                  >
                    <Sparkles className="h-4 w-4" />
                    AI 첨삭 초안
                  </button>
                </div>
              </div>
            ) : null}
            <div className="space-y-3 rounded-[28px] bg-slate-50 p-4">
              {selectedRow.submission.history.length > 0 ? (
                selectedRow.submission.history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDateTime(item.createdAt)}
                      </p>
                      <span className="text-xs text-slate-500">{item.charCount}자</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {item.content || '(빈 내용)'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-500 ring-1 ring-slate-200">
                  저장 이력이 아직 없습니다.
                </div>
              )}
            </div>

            <Field
              label="학생별 피드백"
              onChange={setStudentFeedback}
              placeholder="학생 제출물에 대한 개별 피드백을 남기세요."
              textarea
              value={studentFeedback}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className={secondaryButton}
                onClick={() => setHistoryOpen(false)}
                type="button"
              >
                닫기
              </button>
              <button
                className={cx(
                  primaryButton,
                  'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
                )}
                disabled={isSaving}
                onClick={handleSaveStudentFeedback}
                type="button"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                피드백 저장
              </button>
            </div>
          </>
        ) : null}
      </OverlayPanel>

      <OverlayPanel
        open={assignmentFeedbackOpen}
        onClose={() => setAssignmentFeedbackOpen(false)}
        title="과제 공통 피드백"
        description="반 전체에 공통으로 보여 줄 피드백 메모를 저장합니다."
      >
        <Field
          label="공통 피드백"
          onChange={setAssignmentFeedback}
          placeholder="예: 코드 가독성은 좋지만 예외 처리 예시를 한 번 더 보강해 주세요."
          textarea
          value={assignmentFeedback}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            className={secondaryButton}
            onClick={() => setAssignmentFeedbackOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            disabled={isSaving}
            onClick={handleSaveAssignmentFeedback}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            저장
          </button>
        </div>
      </OverlayPanel>

      {selectedRow?.submission && assignment.type === 'ESSAY' ? (
        <EssayFeedback
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          studentName={selectedRow.studentName}
          extractedText={selectedSubmissionText}
          open={essayFeedbackOpen}
          onApplyTeacherComment={(teacherComment) => {
            setStudentFeedback((current) =>
              current.trim() ? `${current}\n\n${teacherComment}` : teacherComment,
            )
            setEssayFeedbackOpen(false)
          }}
          onClose={() => setEssayFeedbackOpen(false)}
        />
      ) : null}

      <OverlayPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="과제 수정"
        description="제목, 반, 유형, 마감일과 설명을 수정할 수 있습니다."
      >
        {editForm ? (
          <>
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">반 선택</span>
              <select
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                onChange={(event) =>
                  setEditForm((current) =>
                    current ? { ...current, classId: event.target.value } : current,
                  )
                }
                value={editForm.classId}
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="과제 제목"
                onChange={(value) =>
                  setEditForm((current) =>
                    current ? { ...current, title: value } : current,
                  )
                }
                placeholder="과제 제목"
                value={editForm.title}
              />
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">과제 유형</span>
                <select
                  className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none"
                  onChange={(event) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            type: event.target.value as AssignmentType,
                          }
                        : current,
                    )
                  }
                  value={editForm.type}
                >
                  <option value="WORKBOOK">문제풀이</option>
                  <option value="ESSAY">에세이</option>
                  <option value="IMAGE">이미지</option>
                </select>
              </label>
            </div>

            <Field
              label="마감일"
              onChange={(value) =>
                setEditForm((current) =>
                  current ? { ...current, dueDate: value } : current,
                )
              }
              placeholder="YYYY-MM-DD"
              type="date"
              value={editForm.dueDate}
            />

            <Field
              label="과제 설명"
              onChange={(value) =>
                setEditForm((current) =>
                  current ? { ...current, content: value } : current,
                )
              }
              placeholder="과제 설명"
              textarea
              value={editForm.content}
            />

            <Field
              label="강사 메모"
              onChange={(value) =>
                setEditForm((current) =>
                  current ? { ...current, teacherNote: value } : current,
                )
              }
              placeholder="강사 메모"
              textarea
              value={editForm.teacherNote}
            />

            <Field
              label="이미지 URL 목록"
              onChange={(value) =>
                setEditForm((current) =>
                  current ? { ...current, imageUrls: value } : current,
                )
              }
              placeholder="한 줄에 하나씩 입력"
              textarea
              value={editForm.imageUrls}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                className={secondaryButton}
                onClick={() => setEditOpen(false)}
                type="button"
              >
                취소
              </button>
              <button
                className={cx(
                  primaryButton,
                  'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
                )}
                disabled={isSaving}
                onClick={handleUpdateAssignment}
                type="button"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                수정 저장
              </button>
            </div>
          </>
        ) : null}
      </OverlayPanel>
    </div>
  )
}
