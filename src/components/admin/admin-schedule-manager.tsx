'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'

import { useClasses } from '@/hooks/useClasses'
import { useSchedule } from '@/hooks/useSchedule'
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

type TeacherUser = {
  id: string
  name: string
  email: string
}

type ClassItem = {
  id: string
  name: string
  subject: string | null
  level: string | null
  teachers: Array<{
    teacher: TeacherUser
  }>
  enrollments: Array<{
    student: {
      id: string
      name: string
    }
  }>
}

type ScheduleItem = {
  id: string
  classId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  color: string | null
  note: string | null
  class: {
    id: string
    name: string
    subject: string | null
    level: string | null
  }
}

type ScheduleFormState = {
  id?: string
  classId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  color: string
  note: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyScheduleForm: ScheduleFormState = {
  classId: '',
  dayOfWeek: '1',
  startTime: '16:00',
  endTime: '18:00',
  room: '',
  color: 'indigo',
  note: '',
}

const days = [
  { key: 1, label: '월' },
  { key: 2, label: '화' },
  { key: 3, label: '수' },
  { key: 4, label: '목' },
  { key: 5, label: '금' },
  { key: 6, label: '토' },
  { key: 7, label: '일' },
]

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

function getWeekLabel(offset: number) {
  const today = new Date()
  const currentDay = today.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + offset * 7)

  return `${monday.getMonth() + 1}월 ${Math.floor((monday.getDate() - 1) / 7) + 1}주차`
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function getScheduleTone(color?: string | null): Tone {
  if (color === 'sky' || color === 'violet' || color === 'emerald' || color === 'amber' || color === 'rose' || color === 'slate') {
    return color
  }

  return 'indigo'
}

function hasConflict(target: ScheduleItem, allSchedules: ScheduleItem[]) {
  return allSchedules.some((item) => {
    if (item.id === target.id) {
      return false
    }

    if (item.dayOfWeek !== target.dayOfWeek) {
      return false
    }

    if (!item.room || !target.room || item.room !== target.room) {
      return false
    }

    return (
      timeToMinutes(item.startTime) < timeToMinutes(target.endTime) &&
      timeToMinutes(target.startTime) < timeToMinutes(item.endTime)
    )
  })
}

export function AdminScheduleManagerPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dayFilter, setDayFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorForm, setEditorForm] = useState<ScheduleFormState>(emptyScheduleForm)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data: scheduleResponse, isLoading, mutate } =
    useSchedule<ApiEnvelope<PaginatedData<ScheduleItem>>>('?limit=100')
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')
  const { data: teachersResponse } =
    useUsers<ApiEnvelope<PaginatedData<TeacherUser>>>('?role=TEACHER&limit=100')

  const schedules = scheduleResponse?.data.items ?? []
  const classes = classesResponse?.data.items ?? []
  const teachers = teachersResponse?.data.items ?? []

  const enrichedSchedules = useMemo(() => {
    return schedules.map((item) => {
      const fullClass = classes.find((classItem) => classItem.id === item.classId)
      return {
        ...item,
        enrolledCount: fullClass?.enrollments.length ?? 0,
        teacherNames:
          fullClass?.teachers.map((teacher) => teacher.teacher.name).join(', ') || '미배정',
      }
    })
  }, [classes, schedules])

  const filteredSchedules = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return enrichedSchedules.filter((item) => {
      const matchesDay = dayFilter === null || item.dayOfWeek === dayFilter
      const haystack = [
        item.class.name,
        item.class.subject ?? '',
        item.class.level ?? '',
        item.room ?? '',
        item.teacherNames,
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch = keyword ? haystack.includes(keyword) : true
      return matchesDay && matchesSearch
    })
  }, [dayFilter, enrichedSchedules, search])

  const schedulesByDay = useMemo(() => {
    return days.map((day) => ({
      ...day,
      schedules: filteredSchedules
        .filter((item) => item.dayOfWeek === day.key)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)),
    }))
  }, [filteredSchedules])

  const conflictSchedules = useMemo(() => {
    return enrichedSchedules.filter((item) => hasConflict(item, enrichedSchedules))
  }, [enrichedSchedules])

  const totalAssigned = enrichedSchedules.reduce((sum, item) => {
    const fullClass = classes.find((classItem) => classItem.id === item.classId)
    return sum + (fullClass?.enrollments.length ?? 0)
  }, 0)

  function openCreateModal(dayOfWeek?: number) {
    setEditorForm({
      ...emptyScheduleForm,
      classId: classes[0]?.id ?? '',
      dayOfWeek: String(dayOfWeek ?? 1),
    })
    setEditorOpen(true)
  }

  function openEditModal(item: ScheduleItem) {
    setEditorForm({
      id: item.id,
      classId: item.classId,
      dayOfWeek: String(item.dayOfWeek),
      startTime: item.startTime,
      endTime: item.endTime,
      room: item.room ?? '',
      color: item.color ?? 'indigo',
      note: item.note ?? '',
    })
    setEditorOpen(true)
  }

  async function handleSaveSchedule() {
    if (!editorForm.classId) {
      setFeedback({
        tone: 'amber',
        title: '반을 먼저 선택해 주세요.',
        description: '수업을 만들려면 연결할 반이 필요합니다.',
      })
      return
    }

    try {
      setIsSaving(true)

      const body = {
        classId: editorForm.classId,
        dayOfWeek: Number(editorForm.dayOfWeek),
        startTime: editorForm.startTime,
        endTime: editorForm.endTime,
        room: editorForm.room || null,
        color: editorForm.color || null,
        note: editorForm.note || null,
      }

      if (editorForm.id) {
        await apiRequest(`/api/schedule/${editorForm.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiRequest('/api/schedule', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }

      await mutate()
      setEditorOpen(false)
      setFeedback({
        tone: 'emerald',
        title: editorForm.id ? '수업 편성을 수정했습니다.' : '수업을 추가했습니다.',
        description: '시간표 보드에 최신 편성안을 반영했습니다.',
      })
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '시간표 저장에 실패했습니다.',
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
        eyebrow="시간표"
        title="주간 시간표와 반 편성 흐름을 실제 데이터로 같이 확인해요"
        description="주차 이동, 요일별 보기, 충돌 경고, 새 수업 추가와 편성 수정까지 운영 동선을 한 화면으로 연결했습니다."
        action={
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            onClick={() => openCreateModal()}
            type="button"
          >
            <Plus className="h-4 w-4" />
            수업 추가
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className={secondaryButton}
              onClick={() => setWeekOffset((current) => current - 1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              이전 주
            </button>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {getWeekLabel(weekOffset)}
            </div>
            <button
              className={secondaryButton}
              onClick={() => setWeekOffset((current) => current + 1)}
              type="button"
            >
              다음 주
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={`강사 ${teachers.length}명`} tone="slate" />
            <StatusBadge label={`편성 학생 ${totalAssigned}명`} tone="indigo" />
          </div>
        </div>
      </SurfaceCard>

      {conflictSchedules.length > 0 ? (
        <SurfaceCard className="border border-amber-100 bg-amber-50/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-amber-900">
                강의실 충돌 가능성이 있는 수업이 {conflictSchedules.length}건 있어요.
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-700">
                같은 요일과 시간대에 같은 강의실을 쓰는 편성이 잡혀 있습니다.
              </p>
            </div>
            <StatusBadge label="충돌 확인 필요" tone="amber" />
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail="전체 시간표 카드 수"
          icon={CalendarDays}
          label="주간 수업"
          tone="indigo"
          value={`${enrichedSchedules.length}개`}
        />
        <MetricCard
          detail="반 편성 인원 합계"
          icon={Users}
          label="배정 학생"
          tone="sky"
          value={`${totalAssigned}명`}
        />
        <MetricCard
          detail={conflictSchedules.length > 0 ? '조정 필요' : '충돌 없음'}
          icon={AlertTriangle}
          label="강의실 충돌"
          tone={conflictSchedules.length > 0 ? 'amber' : 'emerald'}
          value={`${conflictSchedules.length}건`}
        />
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 lg:w-[360px]">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="반 이름, 강사, 강의실로 찾기"
              value={search}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className={cx(
                chipButton,
                dayFilter === null
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setDayFilter(null)}
              type="button"
            >
              전체
            </button>
            {days.map((day) => (
              <button
                key={day.key}
                className={cx(
                  chipButton,
                  dayFilter === day.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setDayFilter(day.key)}
                type="button"
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      {isLoading ? (
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          시간표 데이터를 불러오는 중입니다.
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {schedulesByDay
            .filter((day) => (dayFilter === null ? true : day.key === dayFilter))
            .map((day) => (
              <SurfaceCard key={day.key}>
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge label={day.label} tone="slate" />
                  <button
                    className={secondaryButton}
                    onClick={() => openCreateModal(day.key)}
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    추가
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {day.schedules.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                      배정된 수업이 없습니다.
                    </div>
                  ) : (
                    day.schedules.map((row) => {
                      const tone = getScheduleTone(row.color)
                      const conflict = hasConflict(row, enrichedSchedules)

                      return (
                        <div
                          key={row.id}
                          className={cx(
                            'rounded-[24px] border bg-white px-4 py-4',
                            conflict ? 'border-amber-200 bg-amber-50/40' : 'border-slate-200',
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <StatusBadge label={row.class.name} tone={tone} />
                            <StatusBadge label={`${row.enrolledCount}명`} tone="slate" />
                          </div>
                          <p className="mt-3 font-semibold text-slate-900">
                            {row.startTime} - {row.endTime}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {row.room ?? '강의실 미설정'} · {row.teacherNames}
                          </p>
                          <p className="mt-2 text-sm text-slate-600">
                            {row.class.subject ?? '과목 미설정'}
                            {row.class.level ? ` · ${row.class.level}` : ''}
                          </p>
                          {row.note ? (
                            <p className="mt-2 text-xs leading-5 text-slate-500">{row.note}</p>
                          ) : null}
                          {conflict ? (
                            <p className="mt-3 text-xs font-medium text-amber-700">
                              같은 강의실 시간 충돌 가능
                            </p>
                          ) : null}
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              className={secondaryButton}
                              onClick={() => openEditModal(row)}
                              type="button"
                            >
                              편성 수정
                            </button>
                            <Link
                              className={secondaryButton}
                              href={`/admin/classes/${row.class.id}`}
                            >
                              반 상세
                            </Link>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </SurfaceCard>
            ))}
        </div>
      )}

      <OverlayPanel
        description="요일, 시간, 강의실, 연결할 반을 한 번에 정의합니다."
        onClose={() => setEditorOpen(false)}
        open={editorOpen}
        title={editorForm.id ? '수업 편성 수정' : '수업 추가'}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">반 선택</span>
          <select
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            onChange={(event) =>
              setEditorForm((current) => ({ ...current, classId: event.target.value }))
            }
            value={editorForm.classId}
          >
            <option value="">반을 선택해 주세요</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.subject ? ` · ${item.subject}` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">요일</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setEditorForm((current) => ({ ...current, dayOfWeek: event.target.value }))
              }
              value={editorForm.dayOfWeek}
            >
              {days.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="시작 시간"
            onChange={(value) =>
              setEditorForm((current) => ({ ...current, startTime: value }))
            }
            placeholder="16:00"
            type="time"
            value={editorForm.startTime}
          />
          <Field
            label="종료 시간"
            onChange={(value) => setEditorForm((current) => ({ ...current, endTime: value }))}
            placeholder="18:00"
            type="time"
            value={editorForm.endTime}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="강의실"
            onChange={(value) => setEditorForm((current) => ({ ...current, room: value }))}
            placeholder="3강의실"
            value={editorForm.room}
          />
          <Field
            label="표시 색상"
            onChange={(value) => setEditorForm((current) => ({ ...current, color: value }))}
            placeholder="indigo"
            value={editorForm.color}
          />
        </div>

        <Field
          label="운영 메모"
          onChange={(value) => setEditorForm((current) => ({ ...current, note: value }))}
          placeholder="코파일럿 대표 수업"
          value={editorForm.note}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setEditorOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSaving}
            onClick={handleSaveSchedule}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            시간표 저장
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
