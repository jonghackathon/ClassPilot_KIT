'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserSquare2,
  X,
} from 'lucide-react'

import { useUsers } from '@/hooks/useUsers'
import { apiRequest } from '@/lib/fetcher'
import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

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

type TeacherItem = {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'TEACHER'
  active: boolean
  taughtClasses: Array<{
    class: {
      id: string
      name: string
      subject: string | null
      level: string | null
    }
  }>
}

type TeacherFormState = {
  name: string
  email: string
  password: string
  phone: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyForm: TeacherFormState = {
  name: '',
  email: '',
  password: '1234',
  phone: '',
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
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}

function getTeacherSubjects(item: TeacherItem) {
  const subjects = item.taughtClasses
    .map((entry) => entry.class.subject)
    .filter((value): value is string => Boolean(value))

  return [...new Set(subjects)]
}

function getTeacherSubjectLabel(item: TeacherItem) {
  const subjects = getTeacherSubjects(item)

  if (subjects.length === 0) {
    return '미배정'
  }

  return subjects.join(' · ')
}

function getTeacherClassLabel(item: TeacherItem) {
  if (item.taughtClasses.length === 0) {
    return '배정된 반 없음'
  }

  return item.taughtClasses
    .map((entry) => entry.class.name)
    .join(', ')
}

export function AdminTeachersManagerPage() {
  const [subjectFilter, setSubjectFilter] = useState('전체')
  const [statusFilter, setStatusFilter] = useState<'전체' | '활성' | '비활성'>('전체')
  const [search, setSearch] = useState('')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState<TeacherFormState>(emptyForm)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100', role: 'TEACHER' })

    if (search.trim()) {
      params.set('q', search.trim())
    }

    if (statusFilter === '활성') {
      params.set('active', 'true')
    } else if (statusFilter === '비활성') {
      params.set('active', 'false')
    }

    return `?${params.toString()}`
  }, [search, statusFilter])

  const {
    data: teachersResponse,
    error,
    isLoading,
    mutate,
  } = useUsers<ApiEnvelope<PaginatedData<TeacherItem>>>(query)

  const teachers = useMemo(() => teachersResponse?.data.items ?? [], [teachersResponse])

  const subjectOptions = useMemo(() => {
    const subjects = teachers.flatMap((item) => getTeacherSubjects(item))
    return ['전체', ...new Set(subjects)]
  }, [teachers])

  const filteredTeachers = useMemo(() => {
    if (subjectFilter === '전체') {
      return teachers
    }

    return teachers.filter((item) => getTeacherSubjects(item).includes(subjectFilter))
  }, [subjectFilter, teachers])

  const summary = useMemo(() => {
    return filteredTeachers.reduce(
      (accumulator, item) => {
        accumulator.total += 1
        if (item.active) {
          accumulator.active += 1
        } else {
          accumulator.inactive += 1
        }

        accumulator.classCount += item.taughtClasses.length
        return accumulator
      },
      { total: 0, active: 0, inactive: 0, classCount: 0 },
    )
  }, [filteredTeachers])

  async function handleCreateTeacher() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFeedback({
        tone: 'rose',
        title: '필수 항목을 입력해주세요.',
        description: '이름, 이메일, 비밀번호는 강사 계정 생성에 꼭 필요합니다.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || null,
          role: 'TEACHER',
        }),
      })

      await mutate()
      setRegisterOpen(false)
      setForm(emptyForm)
      setFeedback({
        tone: 'emerald',
        title: '강사 계정을 생성했습니다.',
        description: '반 배정은 반 관리 화면에서 이어서 연결할 수 있습니다.',
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '강사 등록에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '잠시 후 다시 시도해주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeactivateTeacher(item: TeacherItem) {
    setIsDeletingId(item.id)
    setFeedback(null)

    try {
      await apiRequest(`/api/users/${item.id}`, {
        method: 'DELETE',
      })

      await mutate()
      setFeedback({
        tone: 'emerald',
        title: '강사를 비활성 처리했습니다.',
        description: `${item.name} 강사 계정이 비활성 상태로 전환되었습니다.`,
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '비활성 처리에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '잠시 후 다시 시도해주세요.',
      })
    } finally {
      setIsDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 관리"
        title="강사 배정과 반 연결 상태를 빠르게 확인해요"
        description="실제 강사 계정과 배정 반 데이터를 기준으로 과목 필터, 등록, 비활성 처리를 한 흐름에서 관리할 수 있게 연결했습니다."
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
            강사 등록
          </button>
        }
      />

      {feedback ? (
        <SurfaceCard
          className={cx(
            feedback.tone === 'rose'
              ? 'border border-rose-100 bg-rose-50/80'
              : 'border border-emerald-100 bg-emerald-50/80',
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cx(
                'mt-1 rounded-2xl p-2 text-white',
                feedback.tone === 'rose' ? 'bg-rose-500' : 'bg-emerald-500',
              )}
            >
              {feedback.tone === 'rose' ? (
                <TriangleAlert className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{feedback.title}</p>
              <p className="mt-1 text-sm text-slate-600">{feedback.description}</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="flex flex-col gap-4">
          <label className="flex h-[52px] w-full items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="강사명 또는 이메일 검색"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {subjectOptions.map((subject) => (
              <button
                key={subject}
                className={cx(
                  chipButton,
                  subjectFilter === subject
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setSubjectFilter(subject)}
                type="button"
              >
                {subject === '전체' ? '과목 전체' : subject}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['전체', '활성', '비활성'] as const).map((label) => (
              <button
                key={label}
                className={cx(
                  chipButton,
                  statusFilter === label
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
                onClick={() => setStatusFilter(label)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-[32px] border border-slate-200 bg-white text-slate-500">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              강사 데이터를 불러오는 중입니다.
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[32px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
              강사 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          {!isLoading && !error && filteredTeachers.length === 0 ? (
            <div className="rounded-[32px] border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
              조건에 맞는 강사가 없습니다.
            </div>
          ) : null}

          {filteredTeachers.map((teacher) => (
            <SurfaceCard key={teacher.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-indigo-600">
                      {getTeacherSubjectLabel(teacher)}
                    </p>
                    <StatusBadge
                      label={teacher.active ? '활성' : '비활성'}
                      tone={teacher.active ? 'emerald' : 'slate'}
                    />
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                    {teacher.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">{teacher.email}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    담당 반: {getTeacherClassLabel(teacher)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    연락처: {teacher.phone || '미등록'}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-800">배정 현황</p>
                    <p className="mt-2">
                      반 {teacher.taughtClasses.length}개
                    </p>
                  </div>
                  {teacher.active ? (
                    <button
                      className={cx(
                        secondaryButton,
                        'w-full border-rose-200 text-rose-600 hover:border-rose-300',
                      )}
                      disabled={isDeletingId === teacher.id}
                      onClick={() => handleDeactivateTeacher(teacher)}
                      type="button"
                    >
                      {isDeletingId === teacher.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                      비활성 처리
                    </button>
                  ) : null}
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>

        <div className="space-y-4">
          <MetricCard
            label="등록 강사"
            value={`${summary.total}명`}
            detail={`활성 강사 ${summary.active}명`}
            icon={UserSquare2}
            tone="indigo"
          />
          <MetricCard
            label="배정 반"
            value={`${summary.classCount}개`}
            detail="현재 필터 기준"
            icon={CalendarDays}
            tone="sky"
          />
          <MetricCard
            label="비활성"
            value={`${summary.inactive}명`}
            detail="재배정 검토 필요"
            icon={ShieldCheck}
            tone="amber"
          />
          <SurfaceCard>
            <SectionHeading title="운영 메모" subtitle="강사 등록 후 이어서 할 일" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatusBadge label="반 관리에서 담당 반 배정" tone="sky" />
              <StatusBadge label="시간표에서 실제 수업 반영" tone="indigo" />
              <StatusBadge label="연락처 확인" tone="amber" />
              <StatusBadge label="비활성 강사 재배정 점검" tone="violet" />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="강사 등록"
        description="현재 스키마에서 지원하는 기본 계정 필드만 먼저 연결했습니다."
      >
        <Field
          label="강사 이름"
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="신규 강사"
          value={form.name}
        />
        <Field
          label="이메일"
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
          placeholder="teacher@academind.kr"
          value={form.email}
        />
        <Field
          label="비밀번호"
          onChange={(value) =>
            setForm((current) => ({ ...current, password: value }))
          }
          placeholder="최소 4자"
          type="password"
          value={form.password}
        />
        <Field
          label="연락처"
          onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
          placeholder="010-1234-5678"
          value={form.phone}
        />
        <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          과목과 배정 반은 생성 후 `반 관리` 화면에서 연결됩니다.
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className={secondaryButton}
            onClick={() => setRegisterOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving}
            onClick={handleCreateTeacher}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            강사 등록
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
