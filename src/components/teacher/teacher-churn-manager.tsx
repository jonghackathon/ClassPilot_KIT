'use client'

import { useMemo, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { LoaderCircle, MessageSquareText, Search, ShieldAlert, X } from 'lucide-react'

import { PageHero, ProgressBar, SectionHeading, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { useChurn } from '@/hooks/useChurn'
import { useClasses } from '@/hooks/useClasses'
import { apiRequest } from '@/lib/fetcher'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'
type ChurnLevel = 'SAFE' | 'WARNING' | 'DANGER'
type ConsultationType = 'PHONE' | 'TEXT' | 'IN_PERSON'

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
    email: string
    studentProfile: {
      grade: string | null
    } | null
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
  type: ConsultationType
  content: string
  createdAt: string
  owner: {
    id: string
    name: string
  }
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
      <div className="mx-auto w-full max-w-[640px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Churn</p>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function consultationTypeLabel(type: ConsultationType) {
  switch (type) {
    case 'PHONE':
      return '전화'
    case 'TEXT':
      return '메시지'
    default:
      return '대면'
  }
}

export function TeacherChurnManager() {
  const [query, setQuery] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('전체')
  const [selectedLevel, setSelectedLevel] = useState<'전체' | ChurnLevel>('전체')
  const [selectedPredictionId, setSelectedPredictionId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [consultationType, setConsultationType] = useState<ConsultationType>('PHONE')
  const [consultationContent, setConsultationContent] = useState('')
  const [saving, setSaving] = useState(false)

  const churnQuery = useMemo(() => {
    const params = new URLSearchParams()

    if (query.trim()) {
      params.set('q', query.trim())
    }

    if (selectedLevel !== '전체') {
      params.set('level', selectedLevel)
    }

    params.set('limit', '100')
    return `?${params.toString()}`
  }, [query, selectedLevel])

  const classesResponse = useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')
  const churnResponse = useChurn<ApiEnvelope<PaginatedData<ChurnItem>>>(churnQuery)

  const classes = classesResponse.data?.data.items ?? []
  const rawItems = useMemo(() => churnResponse.data?.data.items ?? [], [churnResponse.data])
  const items = useMemo(
    () =>
      rawItems.filter((item) => {
        if (selectedClassId === '전체') {
          return true
        }

        return item.student.enrollments.some((enrollment) => enrollment.class.id === selectedClassId)
      }),
    [rawItems, selectedClassId],
  )

  const selectedPrediction =
    items.find((item) => item.id === selectedPredictionId) ??
    items[0] ??
    null

  const consultationsKey = selectedPrediction
    ? `/api/consultations?studentId=${selectedPrediction.student.id}&limit=10`
    : null

  const consultationsResponse = useSWR<ApiEnvelope<PaginatedData<ConsultationItem>>>(
    consultationsKey,
  )
  const consultations = consultationsResponse.data?.data.items ?? []

  const isLoading = churnResponse.isLoading || classesResponse.isLoading
  const isError = churnResponse.error || classesResponse.error
  const dangerCount = items.filter((item) => item.level === 'DANGER').length
  const warningCount = items.filter((item) => item.level === 'WARNING').length

  const openDialog = () => {
    if (!selectedPrediction) {
      return
    }

    setConsultationContent(
      `${selectedPrediction.student.name} 학생 후속 확인\n- 주요 위험 요인: ${buildRiskReason(selectedPrediction) || '추가 확인 필요'}`,
    )
    setConsultationType('PHONE')
    setDialogOpen(true)
  }

  const saveConsultation = async () => {
    if (!selectedPrediction || !consultationContent.trim()) {
      return
    }

    setSaving(true)

    try {
      await apiRequest('/api/consultations', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedPrediction.student.id,
          type: consultationType,
          content: consultationContent.trim(),
        }),
      })

      await consultationsResponse.mutate()
      setDialogOpen(false)
      setConsultationContent('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="이탈 현황"
        title="담당 반에서 먼저 챙겨야 할 학생을 실데이터로 확인해요"
        description="위험도, 위험 요인, 최근 상담 메모를 한 화면에 모아서 다음 후속 조치를 바로 남길 수 있게 정리했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px] disabled:opacity-50"
            disabled={!selectedPrediction}
            onClick={openDialog}
            type="button"
          >
            <MessageSquareText className="h-4 w-4" />
            상담 메모 작성
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SurfaceCard>
          <p className="text-sm text-slate-500">필터 결과</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{items.length}명</p>
          <p className="mt-2 text-sm text-slate-500">담당 반 기준으로 좁힌 학생 수</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-slate-500">고위험</p>
          <p className="mt-2 text-3xl font-semibold text-rose-700">{dangerCount}명</p>
          <p className="mt-2 text-sm text-slate-500">즉시 후속 조치가 필요한 학생</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-sm text-slate-500">주의</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{warningCount}명</p>
          <p className="mt-2 text-sm text-slate-500">추적 관찰이 필요한 학생</p>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학생 이름 또는 이메일 검색"
              value={query}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['전체', 'DANGER', 'WARNING', 'SAFE'] as const).map((level) => (
              <button
                key={level}
                className={cx(
                  'rounded-full px-3 py-2 text-sm font-medium transition',
                  selectedLevel === level
                    ? 'bg-slate-950 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setSelectedLevel(level)}
                type="button"
              >
                {level === '전체'
                  ? '전체'
                  : level === 'DANGER'
                    ? '고위험'
                    : level === 'WARNING'
                      ? '주의'
                      : '안정'}
              </button>
            ))}
          </div>

          <select
            className="h-[52px] rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setSelectedClassId(event.target.value)}
            value={selectedClassId}
          >
            <option value="전체">전체 반</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-[32px] border border-slate-200 bg-white text-slate-500">
          <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
          이탈 현황을 불러오는 중입니다.
        </div>
      ) : null}

      {!isLoading && isError ? (
        <div className="rounded-[32px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          이탈 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {items.length === 0 ? (
              <SurfaceCard>
                <p className="text-sm text-slate-500">현재 조건에 맞는 학생이 없습니다.</p>
              </SurfaceCard>
            ) : (
              items.map((item) => {
                const riskMeta = getRiskMeta(item.level)
                const className = item.student.enrollments[0]?.class.name ?? '반 미배정'

                return (
                  <button
                    key={item.id}
                    className={cx(
                      'w-full rounded-[32px] border bg-white p-5 text-left transition',
                      selectedPrediction?.id === item.id
                        ? 'border-violet-200 shadow-lg shadow-violet-100/50'
                        : 'border-slate-200',
                    )}
                    onClick={() => setSelectedPredictionId(item.id)}
                    type="button"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-2xl font-semibold text-slate-950">{item.student.name}</h2>
                          <StatusBadge label={className} tone="sky" />
                          <StatusBadge label={riskMeta.label} tone={riskMeta.tone} />
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {buildRiskReason(item) || '위험 요인 데이터 없음'}
                        </p>
                      </div>
                      <div className="min-w-[120px] rounded-2xl bg-slate-50 px-4 py-3 text-right">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Risk Score</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{item.score}%</p>
                      </div>
                    </div>
                    <div className="mt-5">
                      <ProgressBar value={item.score} tone={riskMeta.tone} />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="space-y-6">
            <SurfaceCard>
              <SectionHeading
                title="후속 조치 제안"
                subtitle={selectedPrediction ? '선택한 학생 기준으로 위험 요인을 풀어봤습니다.' : '학생을 선택해 주세요.'}
              />

              {selectedPrediction ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
                    <p className="text-sm font-medium text-slate-300">우선 학생</p>
                    <p className="mt-2 text-2xl font-semibold">{selectedPrediction.student.name}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {selectedPrediction.student.studentProfile?.grade ?? '학년 미등록'}
                      {' · '}
                      {selectedPrediction.student.enrollments[0]?.class.name ?? '반 미배정'}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {buildRiskReason(selectedPrediction) || '위험 요인 데이터 없음'}
                    </p>
                  </div>

                  {[
                    ['출결', selectedPrediction.attendanceFactor, 'amber'],
                    ['과제', selectedPrediction.homeworkFactor, 'violet'],
                    ['접속', selectedPrediction.accessFactor, 'sky'],
                    ['질문', selectedPrediction.questionFactor, 'emerald'],
                  ].map(([label, value, tone]) => (
                    <div key={String(label)}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{label}</span>
                        <span>{value}%</span>
                      </div>
                      <ProgressBar
                        value={Number(value)}
                        tone={tone as Tone}
                        className="h-2.5"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  왼쪽 목록에서 학생을 선택하면 위험 요인과 후속 조치 제안을 볼 수 있습니다.
                </div>
              )}
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeading
                title="최근 상담 메모"
                subtitle={selectedPrediction ? `${selectedPrediction.student.name} 학생 상담 이력` : '학생을 선택해 주세요.'}
              />

              <div className="mt-5 space-y-3">
                {!selectedPrediction ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    학생을 선택하면 상담 이력을 불러옵니다.
                  </div>
                ) : consultationsResponse.isLoading ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    상담 이력을 불러오는 중입니다.
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    아직 남겨진 상담 기록이 없습니다.
                  </div>
                ) : (
                  consultations.map((item) => (
                    <div key={item.id} className="rounded-[24px] border border-slate-200 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={consultationTypeLabel(item.type)} tone="slate" />
                        <StatusBadge label={item.owner.name} tone="violet" />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.content}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={selectedPrediction ? `${selectedPrediction.student.name} 상담 메모` : '상담 메모'}
        description="전화, 메시지, 대면 중 후속 방식을 선택하고 메모를 저장할 수 있습니다."
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">후속 방식</span>
          <select
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setConsultationType(event.target.value as ConsultationType)}
            value={consultationType}
          >
            <option value="PHONE">전화</option>
            <option value="TEXT">메시지</option>
            <option value="IN_PERSON">대면</option>
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">메모 내용</span>
          <textarea
            className="min-h-[180px] w-full rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
            onChange={(event) => setConsultationContent(event.target.value)}
            value={consultationContent}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            onClick={() => setDialogOpen(false)}
            type="button"
          >
            닫기
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 disabled:opacity-50"
            disabled={!consultationContent.trim() || saving}
            onClick={saveConsultation}
            type="button"
          >
            <ShieldAlert className="h-4 w-4" />
            메모 저장
          </button>
        </div>
      </Dialog>
    </div>
  )
}
