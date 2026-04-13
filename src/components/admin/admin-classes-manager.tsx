'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  CalendarDays,
  GraduationCap,
  LoaderCircle,
  Plus,
  Search,
  UserSquare2,
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

type TeacherUser = {
  id: string
  name: string
  email: string
  phone: string | null
}

type StudentUser = {
  id: string
  name: string
  email: string
  phone: string | null
  studentProfile: {
    grade: string | null
    school: string | null
  } | null
  enrollments: Array<{
    class: {
      id: string
      name: string
    }
  }>
}

type CurriculumItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
}

type ScheduleItem = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
}

type ClassListItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
  description: string | null
  capacity: number
  curriculum: CurriculumItem | null
  teachers: Array<{
    teacher: TeacherUser
  }>
  enrollments: Array<{
    student: {
      id: string
      name: string
      email: string
      studentProfile: {
        grade: string | null
      } | null
    }
  }>
  schedules: ScheduleItem[]
}

type ClassDetailItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
  description: string | null
  capacity: number
  curriculum: CurriculumItem | null
  teachers: Array<{
    teacher: TeacherUser
  }>
  enrollments: Array<{
    student: {
      id: string
      name: string
      email: string
      phone: string | null
      studentProfile: {
        grade: string | null
        school: string | null
      } | null
    }
  }>
  schedules: ScheduleItem[]
  assignments: Array<{
    id: string
    title: string
    dueDate: string | null
  }>
  lessons: Array<{
    id: string
    date: string
    topic: string | null
    status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'
  }>
}

type ClassFormState = {
  name: string
  subject: string
  level: string
  description: string
  capacity: string
  curriculumId: string
  teacherIds: string[]
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyClassForm: ClassFormState = {
  name: '',
  subject: '',
  level: '',
  description: '',
  capacity: '12',
  curriculumId: '',
  teacherIds: [],
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
  textarea = false,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  textarea?: boolean
  type?: string
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

function formatDayOfWeek(dayOfWeek: number) {
  return ['월', '화', '수', '목', '금', '토', '일'][dayOfWeek - 1] ?? `${dayOfWeek}`
}

function formatSchedules(schedules: ScheduleItem[]) {
  if (schedules.length === 0) {
    return '시간표 미설정'
  }

  return schedules
    .map((item) => `${formatDayOfWeek(item.dayOfWeek)} ${item.startTime}-${item.endTime}`)
    .join(', ')
}

function getCapacityRate(enrolled: number, capacity: number) {
  if (capacity <= 0) {
    return 0
  }

  return Math.min(100, Math.round((enrolled / capacity) * 100))
}

function getCapacityTone(rate: number): Tone {
  if (rate >= 90) {
    return 'rose'
  }

  if (rate >= 70) {
    return 'amber'
  }

  return 'emerald'
}

function getLessonStatusMeta(status: ClassDetailItem['lessons'][number]['status']) {
  if (status === 'COMPLETED') {
    return { label: '완료', tone: 'emerald' as Tone }
  }

  if (status === 'CANCELLED') {
    return { label: '취소', tone: 'rose' as Tone }
  }

  return { label: '예정', tone: 'sky' as Tone }
}

function ClassFormFields({
  form,
  onChange,
  curricula,
  teachers,
}: {
  form: ClassFormState
  onChange: (patch: Partial<ClassFormState>) => void
  curricula: CurriculumItem[]
  teachers: TeacherUser[]
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="반 이름"
          onChange={(value) => onChange({ name: value })}
          placeholder="수학 C반"
          value={form.name}
        />
        <Field
          label="정원"
          onChange={(value) => onChange({ capacity: value })}
          placeholder="12"
          type="number"
          value={form.capacity}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="과목"
          onChange={(value) => onChange({ subject: value })}
          placeholder="수학"
          value={form.subject}
        />
        <Field
          label="레벨"
          onChange={(value) => onChange({ level: value })}
          placeholder="중급"
          value={form.level}
        />
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-semibold text-slate-800">커리큘럼 연결</span>
        <select
          className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          onChange={(event) => onChange({ curriculumId: event.target.value })}
          value={form.curriculumId}
        >
          <option value="">선택 안 함</option>
          {curricula.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.subject ? ` · ${item.subject}` : ''}
              {item.level ? ` · ${item.level}` : ''}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="반 설명"
        onChange={(value) => onChange({ description: value })}
        placeholder="운영 메모나 반 특성을 입력해 주세요."
        textarea
        value={form.description}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">담당 강사</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {teachers.map((teacher) => {
            const checked = form.teacherIds.includes(teacher.id)

            return (
              <label
                key={teacher.id}
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
                      teacherIds: checked
                        ? form.teacherIds.filter((teacherId) => teacherId !== teacher.id)
                        : [...form.teacherIds, teacher.id],
                    })
                  }
                  type="checkbox"
                />
                <div>
                  <p className="font-semibold text-slate-900">{teacher.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{teacher.email}</p>
                </div>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function AdminClassesManagerPage() {
  const [subjectFilter, setSubjectFilter] = useState('전체')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<ClassFormState>(emptyClassForm)
  const [isSaving, setIsSaving] = useState(false)
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

  const classesQuery = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })

    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    }

    if (subjectFilter !== '전체') {
      params.set('subject', subjectFilter)
    }

    return `?${params.toString()}`
  }, [debouncedSearch, subjectFilter])

  const { data, isLoading, mutate } =
    useClasses<ApiEnvelope<PaginatedData<ClassListItem>>>(classesQuery)
  const { data: teachersResponse } =
    useUsers<ApiEnvelope<PaginatedData<TeacherUser>>>('?role=TEACHER&limit=100')
  const { data: curriculumResponse } =
    useSWR<ApiEnvelope<PaginatedData<CurriculumItem>>>('/api/curriculum?limit=100')

  const classes = data?.data.items ?? []
  const teachers = teachersResponse?.data.items ?? []
  const curricula = curriculumResponse?.data.items ?? []

  const subjects = useMemo(() => {
    return ['전체', ...new Set(classes.map((item) => item.subject).filter(Boolean) as string[])]
  }, [classes])

  async function handleCreateClass() {
    if (!createForm.name.trim()) {
      setFeedback({
        tone: 'amber',
        title: '반 이름을 입력해 주세요.',
        description: '최소한 반 이름은 필요합니다.',
      })
      return
    }

    try {
      setIsSaving(true)

      const created = await apiRequest<ApiEnvelope<{ id: string }>>('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          subject: createForm.subject.trim() || null,
          level: createForm.level.trim() || null,
          description: createForm.description.trim() || null,
          curriculumId: createForm.curriculumId || null,
          capacity: Number(createForm.capacity || 12),
        }),
      })

      await apiRequest(`/api/classes/${created.data.id}/teachers`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacherIds: createForm.teacherIds,
        }),
      })

      await mutate()
      setCreateForm(emptyClassForm)
      setCreateOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '반 생성을 완료했습니다.',
        description: `${createForm.name} 반과 담당 강사 배정을 저장했습니다.`,
      })
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '반 생성에 실패했습니다.',
        description:
          error instanceof Error ? error.message : '준비 중입니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 관리"
        title="반 목록과 운영 상태를 실제 데이터 기준으로 관리해요"
        description="반 생성, 담당 강사 배정, 상세 진입까지 운영자가 쓰는 반 관리 흐름을 실제 API와 연결했습니다."
        action={
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            onClick={() => setCreateOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            반 생성
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
                placeholder="반 이름, 과목, 레벨로 찾기"
                value={search}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
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
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-sky-300" />
              <p className="text-sm font-semibold">반 운영 요약</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">반 수</p>
                <p className="mt-2 text-2xl font-semibold">{classes.length}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">강사 배정</p>
                <p className="mt-2 text-2xl font-semibold">
                  {classes.filter((item) => item.teachers.length > 0).length}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-4">
                <p className="text-xs text-slate-300">정원 초과 주의</p>
                <p className="mt-2 text-2xl font-semibold">
                  {
                    classes.filter(
                      (item) => getCapacityRate(item.enrollments.length, item.capacity) >= 90,
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </SurfaceCard>

      {isLoading ? (
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          반 데이터를 불러오는 중입니다.
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {classes.map((item) => {
            const rate = getCapacityRate(item.enrollments.length, item.capacity)
            const tone = getCapacityTone(rate)

            return (
              <Link key={item.id} href={`/admin/classes/${item.id}`}>
                <SurfaceCard className="h-full transition hover:translate-y-[-2px] hover:border-indigo-100">
                  <div className="flex items-start justify-between gap-3">
                    <StatusBadge
                      label={`${item.subject ?? '과목 미설정'}${item.level ? ` · ${item.level}` : ''}`}
                      tone="indigo"
                    />
                    <StatusBadge label={`${item.enrollments.length}명`} tone={tone} />
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-slate-950">{item.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    담당 강사{' '}
                    {item.teachers.length > 0
                      ? item.teachers.map((teacher) => teacher.teacher.name).join(', ')
                      : '미배정'}
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      {formatSchedules(item.schedules)}
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      정원 {item.capacity}명 중 {item.enrollments.length}명
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar tone={tone} value={rate} />
                  </div>
                  <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                    상세 보기
                    <ArrowRight className="h-4 w-4" />
                  </p>
                </SurfaceCard>
              </Link>
            )
          })}
        </div>
      )}

      <OverlayPanel
        description="반 기본 정보와 담당 강사를 함께 저장합니다."
        onClose={() => setCreateOpen(false)}
        open={createOpen}
        title="반 생성"
      >
        <ClassFormFields
          curricula={curricula}
          form={createForm}
          onChange={(patch) => setCreateForm((current) => ({ ...current, ...patch }))}
          teachers={teachers}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setCreateOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving}
            onClick={handleCreateClass}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            반 생성
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminClassDetailManagerPage({ classId }: { classId: string }) {
  const [editOpen, setEditOpen] = useState(false)
  const [rosterOpen, setRosterOpen] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [editForm, setEditForm] = useState<ClassFormState>(emptyClassForm)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data, error, isLoading, mutate } =
    useSWR<ApiEnvelope<ClassDetailItem>>(`/api/classes/${classId}`)
  const { data: teachersResponse } =
    useUsers<ApiEnvelope<PaginatedData<TeacherUser>>>('?role=TEACHER&limit=100')
  const { data: studentsResponse } =
    useUsers<ApiEnvelope<PaginatedData<StudentUser>>>('?role=STUDENT&limit=100')
  const { data: curriculumResponse } =
    useSWR<ApiEnvelope<PaginatedData<CurriculumItem>>>('/api/curriculum?limit=100')

  const item = data?.data ?? null
  const teachers = teachersResponse?.data.items ?? []
  const students = studentsResponse?.data.items ?? []
  const curricula = curriculumResponse?.data.items ?? []

  useEffect(() => {
    if (!item) {
      return
    }

    setEditForm({
      name: item.name,
      subject: item.subject ?? '',
      level: item.level ?? '',
      description: item.description ?? '',
      capacity: String(item.capacity),
      curriculumId: item.curriculum?.id ?? '',
      teacherIds: item.teachers.map((teacher) => teacher.teacher.id),
    })
    setSelectedStudentIds(item.enrollments.map((enrollment) => enrollment.student.id))
  }, [item])

  const candidateStudents = useMemo(() => {
    const keyword = studentQuery.trim().toLowerCase()

    return students.filter((student) => {
      const haystack = [
        student.name,
        student.studentProfile?.grade ?? '',
        student.studentProfile?.school ?? '',
        ...student.enrollments.map((enrollment) => enrollment.class.name),
      ]
        .join(' ')
        .toLowerCase()

      return keyword ? haystack.includes(keyword) : true
    })
  }, [studentQuery, students])

  async function handleSaveClass() {
    if (!item) {
      return
    }

    try {
      setIsSaving(true)

      await apiRequest(`/api/classes/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          subject: editForm.subject.trim() || null,
          level: editForm.level.trim() || null,
          description: editForm.description.trim() || null,
          curriculumId: editForm.curriculumId || null,
          capacity: Number(editForm.capacity || item.capacity),
        }),
      })

      await apiRequest(`/api/classes/${item.id}/teachers`, {
        method: 'PATCH',
        body: JSON.stringify({
          teacherIds: editForm.teacherIds,
        }),
      })

      await mutate()
      setEditOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '반 정보를 업데이트했습니다.',
        description: `${editForm.name} 반의 기본 정보와 담당 강사를 반영했습니다.`,
      })
    } catch (saveError) {
      setFeedback({
        tone: 'rose',
        title: '반 정보 저장에 실패했습니다.',
        description:
          saveError instanceof Error
            ? saveError.message
            : '준비 중입니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveRoster() {
    if (!item) {
      return
    }

    try {
      setIsSaving(true)

      const currentIds = item.enrollments.map((enrollment) => enrollment.student.id)

      await apiRequest(`/api/classes/${item.id}/members`, {
        method: 'POST',
        body: JSON.stringify({
          addStudentIds: selectedStudentIds.filter((id) => !currentIds.includes(id)),
          removeStudentIds: currentIds.filter((id) => !selectedStudentIds.includes(id)),
        }),
      })

      await mutate()
      setRosterOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '학생 편성을 반영했습니다.',
        description: `${item.name} 반의 수강 학생 목록을 업데이트했습니다.`,
      })
    } catch (saveError) {
      setFeedback({
        tone: 'rose',
        title: '학생 편성 저장에 실패했습니다.',
        description:
          saveError instanceof Error
            ? saveError.message
            : '준비 중입니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="반 상세"
          title="반 상세 정보를 불러오는 중입니다"
          description="반 운영 상태와 학생 편성 정보를 준비하고 있어요."
          backHref="/admin/classes"
          backLabel="반 목록"
        />
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          반 데이터를 불러오는 중입니다.
        </SurfaceCard>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="반 상세"
          title="반 정보를 찾을 수 없습니다"
          description="잘못된 링크이거나 삭제된 반일 수 있습니다."
          backHref="/admin/classes"
          backLabel="반 목록"
        />
        <SurfaceCard className="border border-rose-100 bg-rose-50/80">
          <p className="font-semibold text-rose-900">조회 가능한 반이 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            반 목록으로 돌아가서 다시 선택해 주세요.
          </p>
        </SurfaceCard>
      </div>
    )
  }

  const rate = getCapacityRate(item.enrollments.length, item.capacity)
  const tone = getCapacityTone(rate)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 상세"
        title={`${item.name} 운영 상태와 학생 편성 흐름을 실제 데이터로 확인해요`}
        description="반 정보, 담당 강사, 학생 편성, 최근 수업과 과제 흐름까지 운영자가 바로 확인할 수 있게 연결했습니다."
        backHref="/admin/classes"
        backLabel="반 목록"
        action={
          <div className="flex flex-wrap gap-3">
            <button className={secondaryButton} onClick={() => setEditOpen(true)} type="button">
              반 정보 수정
            </button>
            <button
              className={cx(
                primaryButton,
                'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
              )}
              onClick={() => setRosterOpen(true)}
              type="button"
            >
              학생 편성 관리
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
          detail={`정원 ${item.capacity}명`}
          icon={Users}
          label="현재 인원"
          tone={tone}
          value={`${item.enrollments.length}명`}
        />
        <MetricCard
          detail={item.teachers.length > 0 ? '강사 배정 완료' : '강사 배정 필요'}
          icon={UserSquare2}
          label="담당 강사"
          tone="sky"
          value={
            item.teachers.length > 0
              ? item.teachers.map((teacher) => teacher.teacher.name).join(', ')
              : '미배정'
          }
        />
        <MetricCard
          detail={item.schedules.length > 0 ? formatSchedules(item.schedules) : '시간표 미설정'}
          icon={CalendarDays}
          label="시간표"
          tone="violet"
          value={item.schedules.length > 0 ? `${item.schedules.length}개` : '없음'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading title="현재 학생" subtitle="실제 편성된 학생 목록" />
          <div className="mt-5 space-y-3">
            {item.enrollments.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                아직 편성된 학생이 없습니다.
              </div>
            ) : (
              item.enrollments.map((enrollment) => (
                <div
                  key={enrollment.student.id}
                  className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{enrollment.student.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {enrollment.student.studentProfile?.grade ?? '학년 미설정'}
                      {enrollment.student.studentProfile?.school
                        ? ` · ${enrollment.student.studentProfile.school}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge label="편성 중" tone="indigo" />
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading title="최근 수업" subtitle="반 수업 흐름" />
            <div className="mt-5 space-y-3">
              {item.lessons.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  수업 기록이 없습니다.
                </div>
              ) : (
                item.lessons.map((lesson) => {
                  const meta = getLessonStatusMeta(lesson.status)

                  return (
                    <div key={lesson.id} className="rounded-[24px] bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {lesson.topic ?? '주제 미정'}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDate(lesson.date)}
                          </p>
                        </div>
                        <StatusBadge label={meta.label} tone={meta.tone} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="최근 과제" subtitle="반 과제 흐름" />
            <div className="mt-5 space-y-3">
              {item.assignments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  등록된 과제가 없습니다.
                </div>
              ) : (
                item.assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                  >
                    <p className="font-semibold text-slate-900">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignment.dueDate
                        ? `마감 ${formatDate(assignment.dueDate)}`
                        : '마감일 미설정'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        description="반 기본 정보와 담당 강사를 수정합니다."
        onClose={() => setEditOpen(false)}
        open={editOpen}
        title="반 정보 수정"
      >
        <ClassFormFields
          curricula={curricula}
          form={editForm}
          onChange={(patch) => setEditForm((current) => ({ ...current, ...patch }))}
          teachers={teachers}
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
            onClick={handleSaveClass}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            변경 내용 반영
          </button>
        </div>
      </OverlayPanel>

      <OverlayPanel
        description="학생을 검색해 반 편성 여부를 바로 조정합니다."
        onClose={() => setRosterOpen(false)}
        open={rosterOpen}
        title="학생 편성 관리"
      >
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            onChange={(event) => setStudentQuery(event.target.value)}
            placeholder="학생명, 학년, 학교로 검색해 보세요"
            value={studentQuery}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          {candidateStudents.map((student) => {
            const selected = selectedStudentIds.includes(student.id)

            return (
              <button
                key={student.id}
                className={cx(
                  'rounded-[24px] border px-4 py-4 text-left transition',
                  selected ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white',
                )}
                onClick={() =>
                  setSelectedStudentIds((current) =>
                    current.includes(student.id)
                      ? current.filter((id) => id !== student.id)
                      : [...current, student.id],
                  )
                }
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  <StatusBadge
                    label={selected ? '선택됨' : student.studentProfile?.grade ?? '학년 미설정'}
                    tone={selected ? 'indigo' : 'slate'}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {student.studentProfile?.school ?? '학교 미등록'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  현재 수강반:{' '}
                  {student.enrollments.length > 0
                    ? student.enrollments.map((enrollment) => enrollment.class.name).join(', ')
                    : '없음'}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRosterOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving}
            onClick={handleSaveRoster}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            편성 반영
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
