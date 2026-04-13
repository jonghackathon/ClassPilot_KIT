'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { BookOpenText, CalendarClock, Layers3, LoaderCircle, Plus, Save, Sparkles, Target, X } from 'lucide-react'

import { apiRequest } from '@/lib/fetcher'
import { useClasses } from '@/hooks/useClasses'
import { useCurriculum } from '@/hooks/useCurriculum'
import { useProgress } from '@/hooks/useProgress'
import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type CurriculumStage = {
  id?: string
  title?: string
  objective?: string
  lessons?: unknown[]
}

type CurriculumItem = {
  id: string
  name: string
  subject?: string | null
  level?: string | null
  sortOrder?: number
  stages?: CurriculumStage[] | unknown
  classes?: Array<{ id: string; name: string }>
}

type ClassItem = {
  id: string
  name: string
  enrollments?: Array<{
    student: {
      id: string
      name: string
    }
  }>
}

type WeekNoteItem = {
  id: string
  classId: string
  date: string
  content: string
  studentReaction?: string | null
  curriculumStage?: string | null
  curriculumLesson?: string | null
  autoAssign?: boolean
  class: { id: string; name: string }
  schedule?: { id: string; dayOfWeek: number; startTime: string; endTime: string } | null
  lesson?: { id: string; date: string; topic: string } | null
}

type CurriculumDraft = {
  name: string
  subject: string
  level: string
  sortOrder: string
  stagesText: string
}

type WeekNoteDraft = {
  classId: string
  date: string
  content: string
  studentReaction: string
  curriculumStage: string
  curriculumLesson: string
  autoAssign: boolean
}

function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[720px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Progress</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
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

function formatDateTime(value?: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 16)

  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function parseStagesText(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `stage-${index + 1}`,
        title: line,
        lessons: [],
      }))
  }
}

const emptyCurriculumDraft: CurriculumDraft = {
  name: '',
  subject: '',
  level: '',
  sortOrder: '0',
  stagesText: JSON.stringify(
    [
      {
        id: 'stage-1',
        title: '1단계 · 기초',
        objective: '기초 개념을 익힙니다.',
        lessons: [],
      },
    ],
    null,
    2,
  ),
}

const emptyWeekNoteDraft: WeekNoteDraft = {
  classId: '',
  date: formatDateTimeLocal(),
  content: '',
  studentReaction: '',
  curriculumStage: '',
  curriculumLesson: '',
  autoAssign: true,
}

export function TeacherProgressManager() {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'notes'>('curriculum')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [reviewTargetLessonId, setReviewTargetLessonId] = useState<string | null>(null)
  const [editingCurriculum, setEditingCurriculum] = useState<CurriculumItem | null>(null)
  const [editingNote, setEditingNote] = useState<WeekNoteItem | null>(null)
  const [curriculumDraft, setCurriculumDraft] = useState<CurriculumDraft>(emptyCurriculumDraft)
  const [noteDraft, setNoteDraft] = useState<WeekNoteDraft>(emptyWeekNoteDraft)
  const [message, setMessage] = useState<{
    tone: 'emerald' | 'amber' | 'rose'
    title: string
    description: string
  } | null>(null)

  const classesResponse = useClasses<{ data?: { items?: ClassItem[] } }>()
  const curriculumResponse = useCurriculum<{ data?: { items?: CurriculumItem[] } }>()
  const classes = useMemo(() => classesResponse.data?.data?.items ?? [], [classesResponse.data?.data?.items])
  const effectiveClassId = selectedClassId || classes[0]?.id || ''
  const notesResponse = useProgress<{ data?: { items?: WeekNoteItem[] } }>(
    effectiveClassId ? `?classId=${effectiveClassId}` : '',
  )
  const curriculumItems = curriculumResponse.data?.data?.items ?? []
  const weekNotes = notesResponse.data?.data?.items ?? []

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === effectiveClassId) ?? classes[0] ?? null,
    [classes, effectiveClassId],
  )

  const curriculumCount = curriculumItems.length
  const noteCount = weekNotes.length
  const autoAssignCount = weekNotes.filter((item) => item.autoAssign).length
  const activeNoteCount = weekNotes.filter((item) => item.content.trim().length > 0).length

  const openCurriculumModal = (item?: CurriculumItem) => {
    setEditingCurriculum(item ?? null)
    setCurriculumDraft(
      item
        ? {
            name: item.name ?? '',
            subject: item.subject ?? '',
            level: item.level ?? '',
            sortOrder: String(item.sortOrder ?? 0),
            stagesText: JSON.stringify(item.stages ?? [], null, 2),
          }
        : emptyCurriculumDraft,
    )
    setCurriculumModalOpen(true)
  }

  const openNoteModal = (item?: WeekNoteItem) => {
    setEditingNote(item ?? null)
    setNoteDraft(
      item
        ? {
            classId: item.classId ?? effectiveClassId,
            date: formatDateTimeLocal(item.date),
            content: item.content ?? '',
            studentReaction: item.studentReaction ?? '',
            curriculumStage: item.curriculumStage ?? '',
            curriculumLesson: item.curriculumLesson ?? '',
            autoAssign: item.autoAssign ?? false,
          }
        : {
            ...emptyWeekNoteDraft,
            classId: effectiveClassId,
          },
    )
    setNoteModalOpen(true)
  }

  const saveCurriculum = async () => {
    if (!curriculumDraft.name.trim()) {
      return
    }

    const payload = {
      name: curriculumDraft.name.trim(),
      subject: curriculumDraft.subject.trim() || null,
      level: curriculumDraft.level.trim() || null,
      stages: parseStagesText(curriculumDraft.stagesText),
      sortOrder: Number(curriculumDraft.sortOrder || 0),
    }

    if (editingCurriculum) {
      await apiRequest(`/api/curriculum/${editingCurriculum.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/curriculum', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await curriculumResponse.mutate()
    setCurriculumModalOpen(false)
    setEditingCurriculum(null)
  }

  const saveNote = async () => {
    if (!noteDraft.classId || !noteDraft.content.trim()) {
      return
    }

    const payload = {
      classId: noteDraft.classId,
      date: new Date(noteDraft.date).toISOString(),
      content: noteDraft.content.trim(),
      studentReaction: noteDraft.studentReaction.trim() || null,
      curriculumStage: noteDraft.curriculumStage.trim() || null,
      curriculumLesson: noteDraft.curriculumLesson.trim() || null,
      autoAssign: noteDraft.autoAssign,
    }

    if (editingNote) {
      await apiRequest(`/api/week-notes/${editingNote.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/week-notes', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await notesResponse.mutate()
    setNoteModalOpen(false)
    setEditingNote(null)
  }

  const deleteCurriculum = async (id: string) => {
    await apiRequest(`/api/curriculum/${id}`, { method: 'DELETE' })
    await curriculumResponse.mutate()
  }

  const deleteNote = async (id: string) => {
    await apiRequest(`/api/week-notes/${id}`, { method: 'DELETE' })
    await notesResponse.mutate()
  }

  const generateReviews = async (note: WeekNoteItem) => {
    if (!note.lesson?.id) {
      setMessage({
        tone: 'amber',
        title: '수업 연결 필요',
        description: 'lesson이 연결된 주간 기록에서만 복습을 자동 생성할 수 있습니다.',
      })
      return
    }

    const classItem = classes.find((item) => item.id === note.classId)
    const students = classItem?.enrollments?.map((item) => item.student) ?? []

    if (!students.length) {
      setMessage({
        tone: 'amber',
        title: '생성 대상 없음',
        description: '현재 반에 활성 수강생이 없어 복습을 생성할 수 없습니다.',
      })
      return
    }

    setReviewTargetLessonId(note.lesson.id)
    setMessage(null)

    const results = await Promise.allSettled(
      students.map((student) =>
        apiRequest('/api/reviews/generate', {
          method: 'POST',
          body: JSON.stringify({
            studentId: student.id,
            lessonId: note.lesson?.id,
          }),
        }),
      ),
    )

    const successCount = results.filter((item) => item.status === 'fulfilled').length
    const failCount = results.length - successCount

    setMessage(
      failCount === 0
        ? {
            tone: 'emerald',
            title: '복습 생성 완료',
            description: `${note.class.name} 반 ${successCount}명 복습 요약을 생성했습니다.`,
          }
        : {
            tone: 'amber',
            title: '일부 생성 완료',
            description: `${successCount}명 생성, ${failCount}명 실패했습니다. 다시 시도해 주세요.`,
          },
    )
    setReviewTargetLessonId(null)
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="진도 관리"
        title="커리큘럼, 주간 기록, 수업 메모를 실데이터로 관리해요"
        description="기존 목업 카드 대신 커리큘럼과 주간 수업 기록을 API에 직접 연결했고, 반별 필터와 저장/수정 흐름을 붙였습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
              onClick={() => openNoteModal()}
              type="button"
            >
              <CalendarClock className="h-4 w-4" />
              기록 추가
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
              onClick={() => openCurriculumModal()}
              type="button"
            >
              <Plus className="h-4 w-4" />
              커리큘럼 추가
            </button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="커리큘럼 수"
          value={`${curriculumCount}개`}
          detail="반별 구조와 차시"
          icon={BookOpenText}
          tone="violet"
        />
        <MetricCard
          label="주간 기록"
          value={`${noteCount}건`}
          detail="수업별 기록 누적"
          icon={CalendarClock}
          tone="sky"
        />
        <MetricCard
          label="과제 자동 생성"
          value={`${autoAssignCount}건`}
          detail="기록에서 초안 생성"
          icon={Target}
          tone="emerald"
        />
        <MetricCard
          label="활성 메모"
          value={`${activeNoteCount}건`}
          detail="내용이 채워진 기록"
          icon={Layers3}
          tone="amber"
        />
      </div>

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

      <SurfaceCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['curriculum', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  activeTab === tab
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab === 'curriculum' ? '커리큘럼' : '주간 기록'}
              </button>
            ))}
          </div>

          <label className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Class</span>
            <select
              className="w-full bg-transparent text-sm text-slate-800 outline-none"
              onChange={(event) => {
                setSelectedClassId(event.target.value)
                setNoteDraft((current) => ({ ...current, classId: event.target.value }))
              }}
              value={effectiveClassId}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </SurfaceCard>

      {activeTab === 'curriculum' ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {curriculumItems.map((item) => {
              const stages = Array.isArray(item.stages) ? item.stages : []
              return (
                <SurfaceCard key={item.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-semibold text-slate-950">{item.name}</h2>
                        <StatusBadge label={item.level ?? '전체'} tone="violet" />
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {item.subject ?? '주제 없음'} · 단계 {stages.length}개 · 연결 반 {item.classes?.length ?? 0}개
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                        onClick={() => openCurriculumModal(item)}
                        type="button"
                      >
                        수정
                      </button>
                      <button
                        className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                        onClick={() => deleteCurriculum(item.id)}
                        type="button"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {stages.map((stage: CurriculumStage, index: number) => (
                      <div key={`${item.id}-stage-${index}`} className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="font-semibold text-slate-900">{stage.title ?? `단계 ${index + 1}`}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{stage.objective ?? '설명 없음'}</p>
                      </div>
                    ))}
                  </div>
                </SurfaceCard>
              )
            })}
          </div>

          <SurfaceCard className="h-fit">
            <SectionHeading
              title={selectedClass?.name ?? '반 선택'}
              subtitle="선택한 반의 주간 기록이 아래에 표시됩니다."
            />
            <div className="mt-5 space-y-3">
              {weekNotes.map((note) => (
                <div key={note.id} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{formatDateTime(note.date)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {note.class.name}
                        {note.lesson ? ` · ${note.lesson.topic}` : ''}
                      </p>
                    </div>
                    <StatusBadge label={note.autoAssign ? '자동' : '수동'} tone={note.autoAssign ? 'emerald' : 'slate'} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{note.content}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {note.lesson ? (
                      <button
                        className="rounded-2xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
                        disabled={reviewTargetLessonId === note.lesson.id}
                        onClick={() => generateReviews(note)}
                        type="button"
                      >
                        {reviewTargetLessonId === note.lesson.id ? (
                          <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 inline h-4 w-4" />
                        )}
                        AI 복습 생성
                      </button>
                    ) : null}
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                      onClick={() => openNoteModal(note)}
                      type="button"
                    >
                      수정
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                      onClick={() => deleteNote(note.id)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {weekNotes.map((note) => (
              <SurfaceCard key={note.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{note.class.name}</h2>
                      <StatusBadge label={note.autoAssign ? '자동 생성' : '수동 기록'} tone={note.autoAssign ? 'emerald' : 'slate'} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{formatDateTime(note.date)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{note.content}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.lesson ? (
                      <button
                        className="rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300"
                        disabled={reviewTargetLessonId === note.lesson.id}
                        onClick={() => generateReviews(note)}
                        type="button"
                      >
                        {reviewTargetLessonId === note.lesson.id ? (
                          <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 inline h-4 w-4" />
                        )}
                        AI 복습 생성
                      </button>
                    ) : null}
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                      onClick={() => openNoteModal(note)}
                      type="button"
                    >
                      수정
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                      onClick={() => deleteNote(note.id)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">학생 반응</p>
                    <p className="mt-2 leading-6">{note.studentReaction ?? '기록 없음'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">커리큘럼 연결</p>
                    <p className="mt-2 leading-6">
                      {note.curriculumStage ?? '미지정'}
                      {note.curriculumLesson ? ` · ${note.curriculumLesson}` : ''}
                    </p>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="h-fit">
            <SectionHeading
              title="주간 기록 요약"
              subtitle="반별 기록, 학생 반응, 자동 생성 여부를 한 번에 확인합니다."
            />
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">선택 반</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{selectedClass?.name ?? '반 없음'}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">자동 생성 기록</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{autoAssignCount}건</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">최근 기록 수</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{weekNotes.length}건</p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}

      <Dialog
        open={curriculumModalOpen}
        onClose={() => setCurriculumModalOpen(false)}
        title={editingCurriculum ? '커리큘럼 수정' : '커리큘럼 추가'}
        description="반 구조, 단계, 차시를 JSON 또는 줄바꿈 입력으로 바로 저장할 수 있습니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">이름</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setCurriculumDraft((current) => ({ ...current, name: event.target.value }))}
              value={curriculumDraft.name}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">정렬 순서</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setCurriculumDraft((current) => ({ ...current, sortOrder: event.target.value }))}
              type="number"
              value={curriculumDraft.sortOrder}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">과목</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setCurriculumDraft((current) => ({ ...current, subject: event.target.value }))}
              value={curriculumDraft.subject}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">레벨</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setCurriculumDraft((current) => ({ ...current, level: event.target.value }))}
              value={curriculumDraft.level}
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">단계 JSON 또는 줄바꿈 목록</span>
          <textarea
            className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setCurriculumDraft((current) => ({ ...current, stagesText: event.target.value }))}
            value={curriculumDraft.stagesText}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
            onClick={() => setCurriculumModalOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={saveCurriculum}
            type="button"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
        </div>
      </Dialog>

      <Dialog
        open={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title={editingNote ? '주간 기록 수정' : '주간 기록 추가'}
        description="반별 진도, 학생 반응, 자동 생성 여부를 함께 기록합니다."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">반</span>
            <select
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => {
                const nextClassId = event.target.value
                setNoteDraft((current) => ({ ...current, classId: nextClassId }))
                setSelectedClassId(nextClassId)
              }}
              value={noteDraft.classId || effectiveClassId}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">기록 시각</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setNoteDraft((current) => ({ ...current, date: event.target.value }))}
              type="datetime-local"
              value={noteDraft.date}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">커리큘럼 단계</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setNoteDraft((current) => ({ ...current, curriculumStage: event.target.value }))}
              value={noteDraft.curriculumStage}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-800">커리큘럼 차시</span>
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setNoteDraft((current) => ({ ...current, curriculumLesson: event.target.value }))}
              value={noteDraft.curriculumLesson}
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">수업 내용</span>
          <textarea
            className="min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setNoteDraft((current) => ({ ...current, content: event.target.value }))}
            value={noteDraft.content}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">학생 반응</span>
          <textarea
            className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setNoteDraft((current) => ({ ...current, studentReaction: event.target.value }))}
            value={noteDraft.studentReaction}
          />
        </label>
        <button
          className={cx(
            'flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left text-sm font-medium transition',
            noteDraft.autoAssign ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' : 'bg-slate-100 text-slate-600',
          )}
          onClick={() => setNoteDraft((current) => ({ ...current, autoAssign: !current.autoAssign }))}
          type="button"
        >
          <span>과제 자동 생성 초안 만들기</span>
          <span>{noteDraft.autoAssign ? 'ON' : 'OFF'}</span>
        </button>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
            onClick={() => setNoteModalOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={saveNote}
            type="button"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
        </div>
      </Dialog>
    </div>
  )
}
