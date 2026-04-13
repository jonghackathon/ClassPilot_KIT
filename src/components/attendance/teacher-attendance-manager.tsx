'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BookCheck,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  LoaderCircle,
  TrendingUp,
  X,
} from 'lucide-react'

import { useAttendance } from '@/hooks/useAttendance'
import { useClasses } from '@/hooks/useClasses'
import { apiRequest } from '@/lib/fetcher'
import {
  ActionButton,
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type AttendanceValue = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
type HomeworkValue = 'COMPLETE' | 'INCOMPLETE'
type ViewMode = '일별' | '주별'

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
  schedules: Array<{
    id: string
    startTime: string
    endTime: string
    room: string | null
  }>
  enrollments: Array<{
    student: {
      id: string
      name: string
      email: string | null
      studentProfile?: {
        grade: string | null
      } | null
    }
  }>
}

type AttendanceItem = {
  id: string
  classId: string
  studentId: string
  lessonId: string | null
  date: string
  status: AttendanceValue
  homeworkStatus: HomeworkValue | null
  homeworkNote: string | null
  absenceReason: string | null
}

type AttendanceDraft = {
  id?: string
  studentId: string
  date: string
  lessonId: string | null
  status: AttendanceValue | null
  homeworkStatus: HomeworkValue | null
  homeworkNote: string
  absenceReason: string
}

const filledButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const lineButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'
const pillButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const attendanceMeta: Record<
  AttendanceValue,
  { label: string; tone: Tone; activeClass: string }
> = {
  PRESENT: {
    label: '출석',
    tone: 'emerald',
    activeClass: 'bg-emerald-600 text-white',
  },
  LATE: {
    label: '지각',
    tone: 'amber',
    activeClass: 'bg-amber-500 text-white',
  },
  EARLY_LEAVE: {
    label: '조퇴',
    tone: 'sky',
    activeClass: 'bg-sky-600 text-white',
  },
  ABSENT: {
    label: '결석',
    tone: 'rose',
    activeClass: 'bg-rose-600 text-white',
  },
}

const homeworkMeta: Record<
  HomeworkValue,
  { label: string; tone: Tone; activeClass: string }
> = {
  COMPLETE: {
    label: '숙제 O',
    tone: 'violet',
    activeClass: 'bg-violet-600 text-white shadow-lg shadow-violet-500/20',
  },
  INCOMPLETE: {
    label: '숙제 X',
    tone: 'slate',
    activeClass: 'bg-slate-950 text-white',
  },
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
      <div className="mx-auto max-h-full w-full max-w-[560px] overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
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

function toDateKey(value: string) {
  return value.slice(0, 10)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${value}T00:00:00`))
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function TeacherAttendanceManager() {
  const [viewMode, setViewMode] = useState<ViewMode>('일별')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const { data: classesResponse, isLoading: classesLoading } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')
  const classes = classesResponse?.data?.items ?? []

  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id)
    }
  }, [classes, selectedClassId])

  useEffect(() => {
    setSelectedDate('')
    setFeedback(null)
  }, [selectedClassId])

  const attendanceQuery = selectedClassId ? `?classId=${selectedClassId}&limit=200` : null
  const {
    data: attendanceResponse,
    isLoading: attendanceLoading,
    mutate: mutateAttendance,
  } = useAttendance<ApiEnvelope<PaginatedData<AttendanceItem>>>(attendanceQuery)
  const attendanceItems = attendanceResponse?.data?.items ?? []

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  )

  const students = useMemo(
    () =>
      [...(selectedClass?.enrollments ?? [])]
        .map((item) => item.student)
        .sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [selectedClass],
  )

  const availableDates = useMemo(() => {
    return [...new Set(attendanceItems.map((item) => toDateKey(item.date)))].sort((a, b) =>
      a < b ? 1 : -1,
    )
  }, [attendanceItems])

  useEffect(() => {
    if (selectedDate) {
      return
    }

    setSelectedDate(availableDates[0] ?? getTodayKey())
  }, [availableDates, selectedDate])

  const selectedDateRecords = useMemo(
    () =>
      attendanceItems.filter((item) => {
        return toDateKey(item.date) === selectedDate
      }),
    [attendanceItems, selectedDate],
  )

  const selectedDateRecordMap = useMemo(
    () => new Map(selectedDateRecords.map((item) => [item.studentId, item])),
    [selectedDateRecords],
  )

  const effectiveRecordDate = selectedDateRecords[0]?.date
    ? selectedDateRecords[0].date
    : `${selectedDate || getTodayKey()}T00:00:00.000Z`
  const effectiveLessonId = selectedDateRecords[0]?.lessonId ?? null

  useEffect(() => {
    if (students.length === 0) {
      setDrafts({})
      return
    }

    const nextDrafts = Object.fromEntries(
      students.map((student) => {
        const record = selectedDateRecordMap.get(student.id)

        return [
          student.id,
          {
            id: record?.id,
            studentId: student.id,
            date: record?.date ?? effectiveRecordDate,
            lessonId: record?.lessonId ?? effectiveLessonId,
            status: record?.status ?? null,
            homeworkStatus: record?.homeworkStatus ?? null,
            homeworkNote: record?.homeworkNote ?? '',
            absenceReason: record?.absenceReason ?? '',
          } satisfies AttendanceDraft,
        ]
      }),
    ) as Record<string, AttendanceDraft>

    setDrafts(nextDrafts)
  }, [effectiveLessonId, effectiveRecordDate, selectedDateRecordMap, students])

  const weekDates = useMemo(() => {
    if (availableDates.length === 0) {
      return [selectedDate || getTodayKey()]
    }

    if (selectedDate && !availableDates.includes(selectedDate)) {
      return [selectedDate, ...availableDates].slice(0, 5)
    }

    return availableDates.slice(0, 5)
  }, [availableDates, selectedDate])

  const counts = useMemo(() => {
    const values = Object.values(drafts)

    return {
      PRESENT: values.filter((value) => value.status === 'PRESENT').length,
      LATE: values.filter((value) => value.status === 'LATE').length,
      EARLY_LEAVE: values.filter((value) => value.status === 'EARLY_LEAVE').length,
      ABSENT: values.filter((value) => value.status === 'ABSENT').length,
      pending: values.filter((value) => !value.status).length,
    }
  }, [drafts])

  const homeworkCounts = useMemo(() => {
    const values = Object.values(drafts)

    return {
      COMPLETE: values.filter((value) => value.homeworkStatus === 'COMPLETE').length,
      INCOMPLETE: values.filter((value) => value.homeworkStatus === 'INCOMPLETE').length,
      pending: values.filter((value) => !value.homeworkStatus).length,
    }
  }, [drafts])

  function updateDraft(studentId: string, patch: Partial<AttendanceDraft>) {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        ...patch,
      },
    }))
    setFeedback(null)
  }

  async function handleBulkSave() {
    if (!selectedClass) {
      return
    }

    const missing = students.filter((student) => !drafts[student.id]?.status)
    if (missing.length > 0) {
      setFeedback({
        tone: 'amber',
        title: '출결 상태를 먼저 채워 주세요.',
        description: `${missing.length}명의 출결 상태가 아직 비어 있습니다.`,
      })
      return
    }

    try {
      setIsSaving(true)

      const records = students.map((student) => {
        const draft = drafts[student.id]

        return {
          classId: selectedClass.id,
          studentId: student.id,
          lessonId: draft.lessonId ?? null,
          date: draft.date,
          status: draft.status as AttendanceValue,
          homeworkStatus: draft.homeworkStatus ?? null,
          homeworkNote: draft.homeworkNote.trim() || null,
          absenceReason: draft.absenceReason.trim() || null,
        }
      })

      await apiRequest('/api/attendance/bulk', {
        method: 'POST',
        body: JSON.stringify({ records }),
      })

      await mutateAttendance()
      setConfirmOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '출결 저장을 마쳤습니다.',
        description: `${selectedClass.name} · ${formatDateLabel(selectedDate)} 기록을 서버에 반영했습니다.`,
      })
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '출결 저장에 실패했습니다.',
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (classesLoading && classes.length === 0) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="출결 관리"
          title="출결 화면을 준비하고 있어요"
          description="담당 반과 기존 출결 기록을 불러오는 중입니다."
          backHref="/teacher/dashboard"
          backLabel="강사 홈"
        />
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          출결 데이터를 불러오는 중입니다.
        </SurfaceCard>
      </div>
    )
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <PageHero
          eyebrow="출결 관리"
          title="담당 반이 아직 연결되지 않았어요"
          description="강사에게 배정된 반이 있어야 출결을 입력할 수 있습니다."
          backHref="/teacher/dashboard"
          backLabel="강사 홈"
        />
        <SurfaceCard>
          <p className="text-sm leading-6 text-slate-600">
            현재 접근 가능한 반이 없습니다. 반 배정 데이터를 먼저 확인해 주세요.
          </p>
        </SurfaceCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="출결 관리"
        title="출결, 숙제, 사유 입력을 수업 흐름 안에서 한 번에 정리해요"
        description="담당 반 학생 목록과 기존 기록을 불러와서, 일별 입력과 주별 확인을 같은 화면에서 이어갈 수 있게 연결했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/copilot" label="코파일럿 시작" tone="violet" />}
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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">반 선택</span>
              <select
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedClassId(event.target.value)}
                value={selectedClassId}
              >
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-800">출결 날짜</span>
              <input
                className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={selectedDate}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['일별', '주별'] as const).map((mode) => (
              <button
                key={mode}
                className={cx(
                  pillButton,
                  viewMode === mode
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setViewMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
            <button
              className={cx(
                filledButton,
                'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
              )}
              onClick={() => setConfirmOpen(true)}
              type="button"
            >
              <ClipboardCheck className="h-4 w-4" />
              반 전체 확정
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge label={selectedClass.name} tone="violet" />
          <StatusBadge
            label={`${selectedClass.subject ?? '과목 미설정'} · ${selectedClass.level ?? '레벨 미설정'}`}
            tone="slate"
          />
          <StatusBadge label={`${students.length}명 수강 중`} tone="sky" />
          <StatusBadge
            label={
              selectedClass.schedules[0]
                ? `${selectedClass.schedules[0].startTime} - ${selectedClass.schedules[0].endTime}`
                : '시간표 미설정'
            }
            tone="slate"
          />
          <StatusBadge label={formatDateLabel(selectedDate || getTodayKey())} tone="slate" />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          detail={counts.pending ? `${counts.pending}명 미입력` : '정상 출석'}
          icon={CheckCircle2}
          label="출석"
          tone="emerald"
          value={`${counts.PRESENT}명`}
        />
        <MetricCard
          detail="주의 필요"
          icon={TrendingUp}
          label="지각"
          tone="amber"
          value={`${counts.LATE}명`}
        />
        <MetricCard
          detail="중간 퇴실"
          icon={CalendarClock}
          label="조퇴"
          tone="sky"
          value={`${counts.EARLY_LEAVE}명`}
        />
        <MetricCard
          detail="후속 확인"
          icon={CircleHelp}
          label="결석"
          tone="rose"
          value={`${counts.ABSENT}명`}
        />
        <MetricCard
          detail={
            homeworkCounts.pending
              ? `${homeworkCounts.pending}건 미입력`
              : `${homeworkCounts.INCOMPLETE}건 미완료`
          }
          icon={BookCheck}
          label="숙제 완료"
          tone="violet"
          value={`${homeworkCounts.COMPLETE}건`}
        />
      </div>

      {attendanceLoading ? (
        <SurfaceCard className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          {selectedClass.name}의 출결 기록을 불러오는 중입니다.
        </SurfaceCard>
      ) : null}

      {viewMode === '일별' ? (
        <SurfaceCard>
          <SectionHeading
            action={<ActionButton href="/teacher/copilot" label="AI 코파일럿" tone="violet" />}
            subtitle="학생별 출결 상태, 숙제 여부, 지각·결석 사유를 한 번에 입력합니다."
            title={`${selectedClass.name} · ${formatDateLabel(selectedDate || getTodayKey())}`}
          />
          <div className="mt-5 grid gap-3">
            {students.map((student) => {
              const draft = drafts[student.id]

              return (
                <div
                  key={student.id}
                  className="rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {student.studentProfile?.grade ?? '학년 미설정'}
                          {student.email ? ` · ${student.email}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(attendanceMeta) as Array<
                          [AttendanceValue, (typeof attendanceMeta)[AttendanceValue]]
                        >).map(([status, meta]) => (
                          <button
                            key={status}
                            className={cx(
                              'rounded-2xl px-4 py-3 text-sm font-medium transition',
                              draft?.status === status
                                ? meta.activeClass
                                : 'bg-slate-100 text-slate-600',
                            )}
                            onClick={() =>
                              updateDraft(student.id, {
                                status,
                                date: draft?.date ?? effectiveRecordDate,
                              })
                            }
                            type="button"
                          >
                            {meta.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(Object.entries(homeworkMeta) as Array<
                        [HomeworkValue, (typeof homeworkMeta)[HomeworkValue]]
                      >).map(([status, meta]) => (
                        <button
                          key={status}
                          className={cx(
                            pillButton,
                            draft?.homeworkStatus === status
                              ? meta.activeClass
                              : 'bg-slate-100 text-slate-600',
                          )}
                          onClick={() =>
                            updateDraft(student.id, {
                              homeworkStatus: status,
                              date: draft?.date ?? effectiveRecordDate,
                            })
                          }
                          type="button"
                        >
                          {meta.label}
                        </button>
                      ))}
                      <StatusBadge
                        label={
                          draft?.homeworkStatus === 'COMPLETE'
                            ? '숙제 완료'
                            : draft?.homeworkStatus === 'INCOMPLETE'
                              ? '숙제 미완료'
                              : '숙제 미입력'
                        }
                        tone={
                          draft?.homeworkStatus === 'COMPLETE'
                            ? 'violet'
                            : draft?.homeworkStatus === 'INCOMPLETE'
                              ? 'rose'
                              : 'slate'
                        }
                      />
                    </div>

                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-slate-800">
                        지각·결석·조퇴 사유
                      </span>
                      <input
                        className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                        onChange={(event) =>
                          updateDraft(student.id, {
                            absenceReason: event.target.value,
                          })
                        }
                        placeholder="학부모 연락, 교통, 건강 상태 등"
                        value={draft?.absenceReason ?? ''}
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </SurfaceCard>
      ) : (
        <SurfaceCard>
          <SectionHeading
            action={<StatusBadge label={`${weekDates.length}일 보기`} tone="slate" />}
            subtitle="최근 기록된 날짜 기준으로 학생별 출결 추이를 빠르게 확인합니다."
            title={`${selectedClass.name} 주별 출결 그리드`}
          />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">학생</th>
                  {weekDates.map((date) => (
                    <th key={date} className="pb-3 font-medium">
                      {formatDateLabel(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="py-4 font-semibold text-slate-900">{student.name}</td>
                    {weekDates.map((date) => {
                      const item = attendanceItems.find((record) => {
                        return (
                          record.studentId === student.id && toDateKey(record.date) === date
                        )
                      })

                      return (
                        <td key={`${student.id}-${date}`} className="py-4">
                          {item ? (
                            <StatusBadge
                              label={attendanceMeta[item.status].label}
                              tone={attendanceMeta[item.status].tone}
                            />
                          ) : (
                            <StatusBadge label="미기록" tone="slate" />
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>
      )}

      <OverlayPanel
        description="현재 변경된 출결과 숙제 입력을 확인한 뒤 반 전체 기록을 한 번에 저장합니다."
        onClose={() => setConfirmOpen(false)}
        open={confirmOpen}
        title="출결 전체 확정"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusBadge label={`출석 ${counts.PRESENT}명`} tone="emerald" />
          <StatusBadge label={`지각 ${counts.LATE}명`} tone="amber" />
          <StatusBadge label={`조퇴 ${counts.EARLY_LEAVE}명`} tone="sky" />
          <StatusBadge label={`결석 ${counts.ABSENT}명`} tone="rose" />
          <StatusBadge label={`숙제 완료 ${homeworkCounts.COMPLETE}건`} tone="violet" />
          {counts.pending ? (
            <StatusBadge label={`출결 미입력 ${counts.pending}명`} tone="amber" />
          ) : null}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setConfirmOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(
              filledButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            disabled={isSaving}
            onClick={handleBulkSave}
            type="button"
          >
            {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            출결 확정
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
