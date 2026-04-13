'use client'

import { useMemo, useState } from 'react'
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  RefreshCcw,
  XCircle,
} from 'lucide-react'

import { useAttendance } from '@/hooks/useAttendance'
import {
  formatKoreanDate,
  type ApiEnvelope,
  type PaginatedData,
  unwrapItems,
} from '@/components/student/student-data'
import { type AttendanceStatus } from '@/types'
import {
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type AttendanceRecord = {
  id: string
  classId: string
  studentId: string
  lessonId: string | null
  date: string
  status: AttendanceStatus
  homeworkStatus: 'COMPLETE' | 'INCOMPLETE' | null
  homeworkNote: string | null
  absenceReason: string | null
  class: {
    id: string
    name: string
  }
  lesson: {
    id: string
    date: string
    topic: string | null
  } | null
}

const statusMeta: Record<
  AttendanceStatus,
  { label: string; tone: 'emerald' | 'amber' | 'sky' | 'rose' }
> = {
  PRESENT: { label: '출석', tone: 'emerald' },
  LATE: { label: '지각', tone: 'amber' },
  EARLY_LEAVE: { label: '조퇴', tone: 'sky' },
  ABSENT: { label: '결석', tone: 'rose' },
}

const statusOptions: Array<'ALL' | AttendanceStatus> = [
  'ALL',
  'PRESENT',
  'LATE',
  'EARLY_LEAVE',
  'ABSENT',
]

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getMonthWindow(offset: number) {
  const anchor = new Date()
  anchor.setHours(0, 0, 0, 0)
  anchor.setDate(1)
  anchor.setMonth(anchor.getMonth() + offset)

  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)

  return { anchor, start, end }
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
  }).format(date)
}

function isAttended(status: AttendanceStatus) {
  return status === 'PRESENT' || status === 'EARLY_LEAVE'
}

export function StudentAttendanceManager() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<'ALL' | AttendanceStatus>('ALL')
  const [classFilter, setClassFilter] = useState('all')

  const monthWindow = useMemo(() => getMonthWindow(monthOffset), [monthOffset])
  const monthLabel = useMemo(() => formatMonthLabel(monthWindow.anchor), [monthWindow.anchor])
  const query = useMemo(
    () =>
      `?limit=100&dateFrom=${toDateKey(monthWindow.start)}&dateTo=${toDateKey(monthWindow.end)}`,
    [monthWindow.end, monthWindow.start],
  )

  const { data, error, isLoading, mutate } =
    useAttendance<ApiEnvelope<PaginatedData<AttendanceRecord>>>(query)

  const records = unwrapItems(data)

  const classOptions = useMemo(() => {
    const classes = new Map<string, string>()

    records.forEach((record) => {
      classes.set(record.class.id, record.class.name)
    })

    return Array.from(classes.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, 'ko'))
  }, [records])

  const effectiveClassFilter =
    classFilter !== 'all' && !classOptions.some((item) => item.id === classFilter)
      ? 'all'
      : classFilter

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        if (statusFilter !== 'ALL' && record.status !== statusFilter) {
          return false
        }

        if (effectiveClassFilter !== 'all' && record.class.id !== effectiveClassFilter) {
          return false
        }

        return true
      }),
    [effectiveClassFilter, records, statusFilter],
  )

  const total = filteredRecords.length
  const attended = filteredRecords.filter((record) => isAttended(record.status)).length
  const late = filteredRecords.filter((record) => record.status === 'LATE').length
  const absent = filteredRecords.filter((record) => record.status === 'ABSENT').length
  const rate = total ? Math.round((attended / total) * 100) : 0
  const latestRecord = filteredRecords[0]
  const activeClassLabel =
    effectiveClassFilter === 'all'
      ? classOptions.length > 1
        ? '전체 반'
        : classOptions[0]?.name ?? '반 전체'
      : classOptions.find((item) => item.id === effectiveClassFilter)?.name ?? '선택한 반'
  const activeStatusLabel =
    statusFilter === 'ALL' ? '전체 상태' : statusMeta[statusFilter].label

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 출결"
        title="월별 출결과 최근 기록을 실데이터로 확인해요"
        description="이번 달과 다른 달의 흐름을 바로 넘겨보면서, 현재 선택한 상태와 반에 맞는 기록만 볼 수 있게 했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <SectionHeading
              title={monthLabel}
              subtitle={`${activeClassLabel} · ${activeStatusLabel} 기준으로 ${total}건을 보고 있어요.`}
            />
            <p className="mt-3 text-sm text-slate-500">
              {monthWindow.start.toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
              })}
              {' '}
              -
              {' '}
              {monthWindow.end.toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900"
              onClick={() => setMonthOffset((current) => current - 1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              이전 달
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900"
              onClick={() => setMonthOffset((current) => current + 1)}
              type="button"
            >
              다음 달
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <button
                key={option}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  statusFilter === option
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setStatusFilter(option)}
                type="button"
              >
                {option === 'ALL' ? '전체 상태' : statusMeta[option].label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={cx(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                classFilter === 'all'
                  ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setClassFilter('all')}
              type="button"
            >
              전체 반
            </button>
            {classOptions.map((item) => (
              <button
                key={item.id}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  effectiveClassFilter === item.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setClassFilter(item.id)}
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="출석률"
          value={`${rate}%`}
          detail={`현재 필터 기준 ${total}건`}
          icon={CalendarClock}
          tone={rate >= 80 ? 'emerald' : 'amber'}
        />
        <MetricCard
          label="출석"
          value={`${attended}건`}
          detail="출석과 조퇴를 포함해 계산"
          icon={CheckCircle2}
          tone="emerald"
        />
        <MetricCard
          label="지각"
          value={`${late}건`}
          detail="최근 흐름을 빠르게 확인"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="결석"
          value={`${absent}건`}
          detail="결석 사유도 함께 표시"
          icon={XCircle}
          tone="rose"
        />
      </div>

      <SurfaceCard>
        <SectionHeading
          title="출결 요약"
          subtitle="선택한 필터에서 가장 최근 기록을 먼저 보여줘요."
        />
        <div className="mt-5">
          <ProgressBar value={rate} tone={rate >= 80 ? 'emerald' : 'amber'} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge label={`출석 ${attended}`} tone="emerald" />
          <StatusBadge label={`지각 ${late}`} tone="amber" />
          <StatusBadge label={`결석 ${absent}`} tone="rose" />
        </div>

        <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5">
          {latestRecord ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-sky-600">{latestRecord.class.name}</p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {formatKoreanDate(latestRecord.date)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {latestRecord.lesson?.topic ?? '수업 주제가 아직 없어요.'}
                  </p>
                </div>
                <StatusBadge
                  label={statusMeta[latestRecord.status].label}
                  tone={statusMeta[latestRecord.status].tone}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {latestRecord.homeworkStatus ? (
                  <StatusBadge
                    label={`숙제 ${latestRecord.homeworkStatus === 'COMPLETE' ? '완료' : '미완료'}`}
                    tone={latestRecord.homeworkStatus === 'COMPLETE' ? 'violet' : 'slate'}
                  />
                ) : null}
                {latestRecord.absenceReason ? (
                  <StatusBadge label="결석 사유 있음" tone="rose" />
                ) : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {latestRecord.absenceReason ?? latestRecord.homeworkNote ?? '추가 메모가 없어요.'}
              </p>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              현재 필터에 맞는 최근 기록이 없어요. 상태나 반 필터를 바꿔보세요.
            </p>
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center justify-between gap-3">
          <SectionHeading
            title="출결 기록"
            subtitle={isLoading ? '기록을 불러오는 중이에요.' : `${filteredRecords.length}건을 확인할 수 있어요.`}
          />
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900"
            onClick={() => mutate()}
            type="button"
          >
            <RefreshCcw className={cx('h-4 w-4', isLoading && 'animate-spin')} />
            새로고침
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {error ? (
            <div className="rounded-[24px] bg-rose-50 px-5 py-6 text-sm leading-6 text-rose-700">
              출결 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
            </div>
          ) : null}

          {isLoading ? (
            <div className="rounded-[24px] bg-slate-50 px-5 py-8 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                출결 기록을 불러오는 중이에요.
              </span>
            </div>
          ) : null}

          {!isLoading && !error && !filteredRecords.length ? (
            <div className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm leading-6 text-slate-500">
              조건에 맞는 출결 기록이 없어요. 월을 바꾸거나 필터를 초기화해 보세요.
            </div>
          ) : null}

          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className="rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-sky-600">{record.class.name}</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">
                    {formatKoreanDate(record.date)}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {record.lesson?.topic ?? '수업 주제 없음'}
                  </p>
                </div>
                <StatusBadge
                  label={statusMeta[record.status].label}
                  tone={statusMeta[record.status].tone}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {record.homeworkStatus ? (
                  <StatusBadge
                    label={`숙제 ${record.homeworkStatus === 'COMPLETE' ? '완료' : '미완료'}`}
                    tone={record.homeworkStatus === 'COMPLETE' ? 'violet' : 'slate'}
                  />
                ) : null}
                {record.absenceReason ? <StatusBadge label="결석 사유" tone="rose" /> : null}
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {record.absenceReason ?? record.homeworkNote ?? '기록된 추가 메모가 없어요.'}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
