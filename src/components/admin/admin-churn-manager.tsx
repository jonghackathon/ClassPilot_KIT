'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  LoaderCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'

import { useChurn } from '@/hooks/useChurn'
import { useConsultations } from '@/hooks/useConsultations'
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

type ChurnItem = {
  id: string
  studentId: string
  score: number
  level: ChurnLevel
  attendanceFactor: number
  homeworkFactor: number
  accessFactor: number
  questionFactor: number
  calculatedAt: string
  createdAt: string
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
  studentId: string
  type: ConsultationType
  content: string
  createdAt: string
  owner: {
    id: string
    name: string
  }
}

type MeUser = {
  id: string
  name: string
}

type ContactFormState = {
  type: ConsultationType
  content: string
}

type ActionFormState = {
  type: ConsultationType
  action: string
  level: ChurnLevel
  score: string
  note: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const emptyContactForm: ContactFormState = {
  type: 'PHONE',
  content: '',
}

const emptyActionForm: ActionFormState = {
  type: 'PHONE',
  action: '추가 모니터링',
  level: 'WARNING',
  score: '50',
  note: '',
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <select
        className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function getLevelMeta(level: ChurnLevel) {
  if (level === 'DANGER') {
    return { label: '고위험', tone: 'rose' as Tone }
  }

  if (level === 'WARNING') {
    return { label: '주의', tone: 'amber' as Tone }
  }

  return { label: '안정', tone: 'emerald' as Tone }
}

function getConsultationLabel(type: ConsultationType) {
  if (type === 'PHONE') {
    return '전화'
  }

  if (type === 'TEXT') {
    return '문자'
  }

  return '대면'
}

function buildFactorSummary(item: ChurnItem) {
  const factors: Array<[string, number]> = [
    ['출결', item.attendanceFactor],
    ['과제', item.homeworkFactor],
    ['접속', item.accessFactor],
    ['질문', item.questionFactor],
  ]

  factors.sort((left, right) => right[1] - left[1])

  return factors
    .filter(([, score]) => score > 0)
    .slice(0, 2)
    .map(([label, score]) => `${label} ${score}`)
    .join(' · ')
}

function buildActionForm(item: ChurnItem): ActionFormState {
  return {
    type: 'PHONE',
    action: item.level === 'DANGER' ? '학부모 상담' : '추가 모니터링',
    level: item.level,
    score: String(item.score),
    note: '',
  }
}

export function AdminChurnManagerPage() {
  const [levelFilter, setLevelFilter] = useState<'전체' | ChurnLevel>('전체')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm)
  const [actionForm, setActionForm] = useState<ActionFormState>(emptyActionForm)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [isSavingAction, setIsSavingAction] = useState(false)
  const [isRefreshingBatch, setIsRefreshingBatch] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })

    if (search.trim()) {
      params.set('q', search.trim())
    }

    if (levelFilter !== '전체') {
      params.set('level', levelFilter)
    }

    return `?${params.toString()}`
  }, [levelFilter, search])

  const {
    data: churnResponse,
    error: churnError,
    isLoading: churnLoading,
    mutate: mutateChurn,
  } = useChurn<ApiEnvelope<PaginatedData<ChurnItem>>>(query)
  const { data: consultationResponse, mutate: mutateConsultations } =
    useConsultations<ApiEnvelope<PaginatedData<ConsultationItem>>>('?limit=100')
  const { data: meResponse } = useSWR<ApiEnvelope<MeUser>>('/api/auth/me')

  const predictions = useMemo(
    () => churnResponse?.data.items ?? [],
    [churnResponse],
  )
  const consultations = useMemo(
    () => consultationResponse?.data.items ?? [],
    [consultationResponse],
  )

  useEffect(() => {
    if (predictions.length === 0) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !predictions.some((item) => item.id === selectedId)) {
      setSelectedId(predictions[0].id)
    }
  }, [predictions, selectedId])

  const selectedPrediction =
    predictions.find((item) => item.id === selectedId) ?? predictions[0] ?? null

  const summary = useMemo(() => {
    return predictions.reduce(
      (accumulator, item) => {
        if (item.level === 'DANGER') {
          accumulator.danger += 1
        } else if (item.level === 'WARNING') {
          accumulator.warning += 1
        } else {
          accumulator.safe += 1
        }

        return accumulator
      },
      { danger: 0, warning: 0, safe: 0 },
    )
  }, [predictions])

  const consultationsByStudent = useMemo(() => {
    return consultations.reduce<Map<string, ConsultationItem[]>>((accumulator, item) => {
      const existing = accumulator.get(item.studentId) ?? []
      existing.push(item)
      accumulator.set(item.studentId, existing)
      return accumulator
    }, new Map())
  }, [consultations])

  const priorityStudents = useMemo(() => {
    return [...predictions]
      .sort((left, right) => right.score - left.score)
      .slice(0, 4)
  }, [predictions])

  const selectedConsultations = selectedPrediction
    ? consultationsByStudent.get(selectedPrediction.student.id) ?? []
    : []

  async function handleContactSubmit() {
    if (!selectedPrediction) {
      return
    }

    if (!meResponse?.data.id) {
      setFeedback({
        tone: 'rose',
        title: '사용자 정보를 확인하지 못했습니다.',
        description: '로그인 세션을 다시 확인한 뒤 다시 시도해주세요.',
      })
      return
    }

    if (!contactForm.content.trim()) {
      setFeedback({
        tone: 'rose',
        title: '연락 내용을 입력해주세요.',
        description: '상담 또는 연락 결과를 한 줄 이상 남겨야 저장할 수 있습니다.',
      })
      return
    }

    setIsSavingContact(true)
    setFeedback(null)

    try {
      await apiRequest('/api/consultations', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedPrediction.student.id,
          ownerId: meResponse.data.id,
          type: contactForm.type,
          content: contactForm.content.trim(),
        }),
      })

      await mutateConsultations()
      setContactOpen(false)
      setContactForm(emptyContactForm)
      setFeedback({
        tone: 'emerald',
        title: '연락 기록을 저장했습니다.',
        description: `${selectedPrediction.student.name} 학생의 후속 조치가 상담 기록에 반영되었습니다.`,
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '연락 기록 저장에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '준비 중입니다.',
      })
    } finally {
      setIsSavingContact(false)
    }
  }

  async function handleActionSubmit() {
    if (!selectedPrediction) {
      return
    }

    if (!meResponse?.data.id) {
      setFeedback({
        tone: 'rose',
        title: '사용자 정보를 확인하지 못했습니다.',
        description: '로그인 세션을 다시 확인한 뒤 다시 시도해주세요.',
      })
      return
    }

    const score = Number(actionForm.score)

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      setFeedback({
        tone: 'rose',
        title: '위험 점수는 0부터 100 사이여야 합니다.',
        description: '현재 조치 후의 예상 위험 점수를 숫자로 입력해주세요.',
      })
      return
    }

    if (!actionForm.note.trim()) {
      setFeedback({
        tone: 'rose',
        title: '후속 메모를 입력해주세요.',
        description: '어떤 조치를 했는지 남겨야 이후 운영자가 같은 맥락으로 이어받을 수 있습니다.',
      })
      return
    }

    setIsSavingAction(true)
    setFeedback(null)

    try {
      await apiRequest(`/api/churn/${selectedPrediction.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          level: actionForm.level,
          score,
        }),
      })

      await apiRequest('/api/consultations', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedPrediction.student.id,
          ownerId: meResponse.data.id,
          type: actionForm.type,
          content: `[이탈 처리] ${actionForm.action}\n${actionForm.note.trim()}`,
        }),
      })

      await Promise.all([mutateChurn(), mutateConsultations()])
      setActionOpen(false)
      setActionForm(emptyActionForm)
      setFeedback({
        tone: 'emerald',
        title: '이탈 대응 조치를 저장했습니다.',
        description: '위험도 조정과 운영 메모가 함께 반영되었습니다.',
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '이탈 대응 저장에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '준비 중입니다.',
      })
    } finally {
      setIsSavingAction(false)
    }
  }

  async function handleRefreshPredictions() {
    setIsRefreshingBatch(true)
    setFeedback(null)

    try {
      const response = await apiRequest<
        ApiEnvelope<{
          calculatedAt: string
          count: number
          dangerStudents: Array<{
            id: string
            name: string
            score: number
          }>
        }>
      >('/api/churn/batch', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      await mutateChurn()
      const names = response.data.dangerStudents.slice(0, 3).map((item) => item.name).join(', ')
      setFeedback({
        tone: 'emerald',
        title: '이탈 예측을 다시 계산했습니다.',
        description: response.data.dangerStudents.length
          ? `고위험 학생 ${response.data.dangerStudents.length}명을 다시 계산했습니다. ${names}${response.data.dangerStudents.length > 3 ? ' 외' : ''}`
          : '현재 기준으로 새 고위험 학생은 없습니다.',
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '이탈 예측 갱신에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '준비 중입니다.',
      })
    } finally {
      setIsRefreshingBatch(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="이탈 예측"
        title="위험 학생을 파악하고 바로 연락과 후속 조치를 남겨요"
        description="이탈 예측 점수만 보는 화면이 아니라, 실제 상담 기록과 위험도 조정을 한 화면에서 이어서 처리할 수 있게 연결했습니다."
        action={
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            disabled={isRefreshingBatch}
            onClick={() => void handleRefreshPredictions()}
            type="button"
          >
            {isRefreshingBatch ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isRefreshingBatch ? '계산 중...' : '이탈 예측 갱신'}
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

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="고위험"
          value={`${summary.danger}명`}
          detail="즉시 연락 권장"
          icon={AlertTriangle}
          tone="rose"
        />
        <MetricCard
          label="주의"
          value={`${summary.warning}명`}
          detail="이번 주 후속 상담 필요"
          icon={Phone}
          tone="amber"
        />
        <MetricCard
          label="안정"
          value={`${summary.safe}명`}
          detail="최근 예측 기준"
          icon={Sparkles}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading
            title="위험 학생 목록"
            subtitle="검색과 위험도 필터로 바로 연락 대상을 좁힐 수 있습니다."
          />

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex h-[52px] w-full items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 lg:max-w-md">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-slate-700 outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="학생명 또는 이메일 검색"
                value={search}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '전체', value: '전체' },
                { label: '고위험', value: 'DANGER' },
                { label: '주의', value: 'WARNING' },
                { label: '안정', value: 'SAFE' },
              ].map((option) => {
                const active = levelFilter === option.value
                return (
                  <button
                    key={option.value}
                    className={cx(
                      chipButton,
                      active
                        ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                    onClick={() =>
                      setLevelFilter(option.value as '전체' | ChurnLevel)
                    }
                    type="button"
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {churnLoading ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-[28px] bg-slate-50 text-slate-500">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                이탈 예측 데이터를 불러오는 중입니다.
              </div>
            ) : null}

            {!churnLoading && churnError ? (
              <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
                이탈 예측 준비 중입니다.
              </div>
            ) : null}

            {!churnLoading && !churnError && predictions.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
                조건에 맞는 위험 학생이 없습니다.
              </div>
            ) : null}

            {predictions.map((item) => {
              const meta = getLevelMeta(item.level)
              const consultationCount =
                consultationsByStudent.get(item.student.id)?.length ?? 0
              const active = item.id === selectedPrediction?.id

              return (
                <div
                  key={item.id}
                  className={cx(
                    'rounded-[28px] border px-5 py-5 transition',
                    active
                      ? 'border-slate-900 bg-slate-950 text-white shadow-xl shadow-slate-900/10'
                      : 'border-slate-200 bg-white hover:border-indigo-200',
                  )}
                  onClick={() => setSelectedId(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelectedId(item.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-2xl font-semibold">{item.student.name}</p>
                        <StatusBadge
                          label={`${meta.label} ${item.score}%`}
                          tone={active ? 'slate' : meta.tone}
                        />
                        {item.student.studentProfile?.grade ? (
                          <StatusBadge
                            label={item.student.studentProfile.grade}
                            tone={active ? 'slate' : 'sky'}
                          />
                        ) : null}
                      </div>
                      <p
                        className={cx(
                          'mt-2 text-sm',
                          active ? 'text-slate-300' : 'text-slate-500',
                        )}
                      >
                        {item.student.email}
                      </p>
                      <p
                        className={cx(
                          'mt-3 text-sm leading-6',
                          active ? 'text-slate-200' : 'text-slate-600',
                        )}
                      >
                        주요 요인: {buildFactorSummary(item) || '가중치 데이터 없음'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={cx(
                          secondaryButton,
                          active
                            ? 'border-slate-700 bg-slate-900 text-white hover:border-slate-600'
                            : '',
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedId(item.id)
                          setContactForm(emptyContactForm)
                          setContactOpen(true)
                        }}
                        type="button"
                      >
                        <Phone className="h-4 w-4" />
                        연락 기록
                      </button>
                      <button
                        className={cx(
                          secondaryButton,
                          active
                            ? 'border-rose-400/40 bg-rose-500/10 text-rose-100 hover:border-rose-300'
                            : 'border-rose-200 text-rose-600 hover:border-rose-300',
                        )}
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedId(item.id)
                          setActionForm(buildActionForm(item))
                          setActionOpen(true)
                        }}
                        type="button"
                      >
                        이탈 처리
                      </button>
                    </div>
                  </div>

                  <div className="mt-5">
                    <ProgressBar
                      className={active ? 'bg-slate-800' : undefined}
                      tone={meta.tone}
                      value={item.score}
                    />
                  </div>

                  <div
                    className={cx(
                      'mt-4 flex flex-wrap items-center gap-2 text-sm',
                      active ? 'text-slate-300' : 'text-slate-500',
                    )}
                  >
                    <span>예측 일시 {formatDate(item.calculatedAt)}</span>
                    <span>·</span>
                    <span>상담 기록 {consultationCount}건</span>
                    {item.student.enrollments.length > 0 ? (
                      <>
                        <span>·</span>
                        <span>
                          {item.student.enrollments
                            .slice(0, 2)
                            .map((enrollment) => enrollment.class.name)
                            .join(', ')}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading
              title="운영 우선순위"
              subtitle="가장 먼저 대응할 학생을 기준으로 후속 조치를 이어갑니다."
              action={
                predictions[0]?.calculatedAt ? (
                  <span className="text-sm text-slate-500">
                    마지막 계산 {formatDate(predictions[0].calculatedAt)}
                  </span>
                ) : null
              }
            />

            {selectedPrediction ? (
              <>
                <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
                  <p className="text-sm font-medium text-slate-300">
                    지금 가장 먼저 볼 학생
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {selectedPrediction.student.name}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {buildFactorSummary(selectedPrediction) || '주요 위험 요인 없음'}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge
                      label={`${getLevelMeta(selectedPrediction.level).label} ${selectedPrediction.score}%`}
                      tone="slate"
                    />
                    {selectedPrediction.student.enrollments.map((enrollment) => (
                      <StatusBadge
                        key={enrollment.class.id}
                        label={enrollment.class.name}
                        tone="slate"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <button
                    className={cx(
                      primaryButton,
                      'w-full bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
                    )}
                    onClick={() => {
                      setContactForm(emptyContactForm)
                      setContactOpen(true)
                    }}
                    type="button"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedPrediction.student.name} 연락 기록 남기기
                  </button>
                  <button
                    className={cx(
                      secondaryButton,
                      'w-full border-rose-200 text-rose-600 hover:border-rose-300',
                    )}
                    onClick={() => {
                      setActionForm(buildActionForm(selectedPrediction))
                      setActionOpen(true)
                    }}
                    type="button"
                  >
                    이탈 처리 열기
                  </button>
                  <button
                    className={cx(
                      secondaryButton,
                      'w-full border-violet-200 text-violet-700 hover:border-violet-300',
                    )}
                    disabled={isRefreshingBatch}
                    onClick={() => void handleRefreshPredictions()}
                    type="button"
                  >
                    {isRefreshingBatch ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isRefreshingBatch ? '계산 중...' : 'AI 예측 다시 계산'}
                  </button>
                  <Link
                    className={cx(secondaryButton, 'w-full justify-between')}
                    href={`/admin/students/${selectedPrediction.student.id}`}
                  >
                    학생 상세 보러가기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading
              title="최근 상담 기록"
              subtitle="선택한 학생 기준으로 최근 후속 조치를 확인할 수 있습니다."
            />

            <div className="mt-5 space-y-3">
              {selectedConsultations.length === 0 ? (
                <div className="rounded-[24px] bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  아직 저장된 연락 기록이 없습니다.
                </div>
              ) : (
                selectedConsultations.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={getConsultationLabel(item.type)} tone="indigo" />
                      <p className="text-sm text-slate-500">
                        {item.owner.name} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading
              title="이번 주 우선 검토"
              subtitle="점수가 높은 순서대로 운영자가 빠르게 확인할 수 있습니다."
            />

            <div className="mt-5 space-y-3">
              {priorityStudents.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{item.student.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {buildFactorSummary(item) || '주요 위험 요인 없음'}
                    </p>
                  </div>
                  <StatusBadge
                    label={`${getLevelMeta(item.level).label} ${item.score}%`}
                    tone={getLevelMeta(item.level).tone}
                  />
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={`${selectedPrediction?.student.name ?? '학생'} 연락 기록`}
        description="연락 방식과 후속 내용을 실제 상담 기록으로 저장합니다."
      >
        <SelectField
          label="연락 방식"
          onChange={(value) =>
            setContactForm((current) => ({
              ...current,
              type: value as ConsultationType,
            }))
          }
          options={[
            { value: 'PHONE', label: '전화' },
            { value: 'TEXT', label: '문자' },
            { value: 'IN_PERSON', label: '대면' },
          ]}
          value={contactForm.type}
        />
        <Field
          label="후속 메모"
          onChange={(value) =>
            setContactForm((current) => ({ ...current, content: value }))
          }
          placeholder="예: 학부모와 통화했고 이번 주 출결 회복 여부를 다시 보기로 했습니다."
          textarea
          value={contactForm.content}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            className={secondaryButton}
            onClick={() => setContactOpen(false)}
            type="button"
          >
            닫기
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
            )}
            disabled={isSavingContact}
            onClick={handleContactSubmit}
            type="button"
          >
            {isSavingContact ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            조치 기록 저장
          </button>
        </div>
      </OverlayPanel>

      <OverlayPanel
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        title={`${selectedPrediction?.student.name ?? '학생'} 이탈 처리`}
        description="위험도와 점수를 조정하고, 운영 메모를 상담 기록에 함께 남깁니다."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="처리 구분"
            onChange={(value) =>
              setActionForm((current) => ({ ...current, action: value }))
            }
            options={[
              { value: '추가 모니터링', label: '추가 모니터링' },
              { value: '학부모 상담', label: '학부모 상담' },
              { value: '휴원 검토', label: '휴원 검토' },
              { value: '퇴원 처리', label: '퇴원 처리' },
            ]}
            value={actionForm.action}
          />
          <SelectField
            label="기록 방식"
            onChange={(value) =>
              setActionForm((current) => ({
                ...current,
                type: value as ConsultationType,
              }))
            }
            options={[
              { value: 'PHONE', label: '전화' },
              { value: 'TEXT', label: '문자' },
              { value: 'IN_PERSON', label: '대면' },
            ]}
            value={actionForm.type}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="현재 위험도"
            onChange={(value) =>
              setActionForm((current) => ({
                ...current,
                level: value as ChurnLevel,
              }))
            }
            options={[
              { value: 'DANGER', label: '고위험' },
              { value: 'WARNING', label: '주의' },
              { value: 'SAFE', label: '안정' },
            ]}
            value={actionForm.level}
          />
          <Field
            label="조정 점수"
            onChange={(value) =>
              setActionForm((current) => ({ ...current, score: value }))
            }
            placeholder="0~100"
            type="number"
            value={actionForm.score}
          />
        </div>

        <Field
          label="운영 메모"
          onChange={(value) =>
            setActionForm((current) => ({ ...current, note: value }))
          }
          placeholder="예: 이번 주 학부모 상담 후 2주간 출결과 과제 제출을 집중 모니터링합니다."
          textarea
          value={actionForm.note}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            className={secondaryButton}
            onClick={() => setActionOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className={cx(
              primaryButton,
              'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20',
            )}
            disabled={isSavingAction}
            onClick={handleActionSubmit}
            type="button"
          >
            {isSavingAction ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            이탈 처리 저장
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}
