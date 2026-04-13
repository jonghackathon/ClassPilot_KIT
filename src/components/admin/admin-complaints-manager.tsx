'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'

import { useComplaints } from '@/hooks/useComplaints'
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
type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

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

type ComplaintItem = {
  id: string
  studentId: string
  content: string
  response: string | null
  aiDraft: string | null
  status: ComplaintStatus
  createdAt: string
  updatedAt: string
  student: {
    id: string
    name: string
    email: string
  }
}

type ComplaintFormState = {
  status: ComplaintStatus
  aiDraft: string
  response: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

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
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  textarea?: boolean
  disabled?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <input
          className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
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

function getStatusMeta(status: ComplaintStatus) {
  if (status === 'RESOLVED') {
    return { label: '완료', tone: 'emerald' as Tone }
  }

  if (status === 'IN_PROGRESS') {
    return { label: '처리중', tone: 'amber' as Tone }
  }

  return { label: '미처리', tone: 'rose' as Tone }
}

function getComplaintTitle(item: ComplaintItem) {
  const firstLine = item.content.split('\n')[0]?.trim() ?? ''
  return firstLine.length > 28 ? `${firstLine.slice(0, 28)}...` : firstLine || '민원 접수'
}

function buildForm(item: ComplaintItem): ComplaintFormState {
  return {
    status: item.status,
    aiDraft: item.aiDraft ?? '',
    response: item.response ?? '',
  }
}

export function AdminComplaintsManagerPage() {
  const [statusFilter, setStatusFilter] = useState<'전체' | ComplaintStatus>('전체')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDraftGenerating, setIsDraftGenerating] = useState(false)
  const [form, setForm] = useState<ComplaintFormState | null>(null)
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

    if (statusFilter !== '전체') {
      params.set('status', statusFilter)
    }

    return `?${params.toString()}`
  }, [search, statusFilter])

  const {
    data: complaintsResponse,
    error: complaintsError,
    isLoading: complaintsLoading,
    mutate,
  } = useComplaints<ApiEnvelope<PaginatedData<ComplaintItem>>>(query)

  const complaints = useMemo(
    () => complaintsResponse?.data.items ?? [],
    [complaintsResponse],
  )

  useEffect(() => {
    if (complaints.length === 0) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !complaints.some((item) => item.id === selectedId)) {
      setSelectedId(complaints[0].id)
    }
  }, [complaints, selectedId])

  const selectedComplaint =
    complaints.find((item) => item.id === selectedId) ?? complaints[0] ?? null

  const summary = useMemo(() => {
    return complaints.reduce(
      (accumulator, item) => {
        if (item.status === 'RESOLVED') {
          accumulator.resolved += 1
        } else if (item.status === 'IN_PROGRESS') {
          accumulator.inProgress += 1
        } else {
          accumulator.pending += 1
        }

        return accumulator
      },
      { pending: 0, inProgress: 0, resolved: 0 },
    )
  }, [complaints])

  async function handleSubmit() {
    if (!selectedComplaint || !form) {
      return
    }

    if (!form.response.trim()) {
      setFeedback({
        tone: 'rose',
        title: '응답 내용을 입력해주세요.',
        description: '민원 응답은 한 줄 이상 작성해야 저장할 수 있습니다.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      await apiRequest(`/api/complaints/${selectedComplaint.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          response: form.response.trim(),
          aiDraft: form.aiDraft.trim() || null,
          status: form.status,
        }),
      })

      await mutate()
      setResponseOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '민원 응답을 저장했습니다.',
        description: `${selectedComplaint.student.name} 학생 민원에 대한 상태와 응답이 반영되었습니다.`,
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: '민원 응답 저장에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '준비 중입니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerateDraft() {
    if (!selectedComplaint) {
      return
    }

    setIsDraftGenerating(true)
    setFeedback(null)

    try {
      const response = await apiRequest<ApiEnvelope<ComplaintItem>>(
        `/api/complaints/${selectedComplaint.id}/ai-draft`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        },
      )

      await mutate()
      setForm((current) => {
        const base = current ?? buildForm(selectedComplaint)
        return {
          ...base,
          aiDraft: response.data.aiDraft ?? '',
        }
      })
      setFeedback({
        tone: 'emerald',
        title: 'AI 초안을 생성했습니다.',
        description: '초안을 검토한 뒤 필요한 문장만 다듬어 최종 응답으로 저장해 주세요.',
      })
    } catch (caught) {
      setFeedback({
        tone: 'rose',
        title: 'AI 초안 생성에 실패했습니다.',
        description:
          caught instanceof Error ? caught.message : '준비 중입니다.',
      })
    } finally {
      setIsDraftGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="민원 관리"
        title="민원 접수부터 응답 작성까지 한 흐름에서 처리해요"
        description="실제 접수 데이터 기준으로 상태를 정리하고, 응답 초안과 최종 답변을 한 패널에서 저장할 수 있게 연결했습니다."
        action={
          selectedComplaint ? (
            <button
              className={cx(
                primaryButton,
                'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
              )}
              disabled={isDraftGenerating}
              onClick={() => {
                setSelectedId(selectedComplaint.id)
                setForm(buildForm(selectedComplaint))
                setResponseOpen(true)
                void handleGenerateDraft()
              }}
              type="button"
            >
              {isDraftGenerating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI 초안 생성
            </button>
          ) : null
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
          label="미처리"
          value={`${summary.pending}건`}
          detail="당일 응답 필요"
          icon={MessageSquareWarning}
          tone="rose"
        />
        <MetricCard
          label="처리중"
          value={`${summary.inProgress}건`}
          detail="추가 확인 대기"
          icon={ClipboardList}
          tone="amber"
        />
        <MetricCard
          label="완료"
          value={`${summary.resolved}건`}
          detail="응답 저장 완료"
          icon={CheckCircle2}
          tone="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading
            title="민원 목록"
            subtitle="검색과 상태 필터로 대응이 필요한 민원을 빠르게 찾을 수 있습니다."
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
                { label: '미처리', value: 'PENDING' },
                { label: '처리중', value: 'IN_PROGRESS' },
                { label: '완료', value: 'RESOLVED' },
              ].map((option) => {
                const active = statusFilter === option.value
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
                      setStatusFilter(option.value as '전체' | ComplaintStatus)
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
            {complaintsLoading ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-[28px] bg-slate-50 text-slate-500">
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                민원 데이터를 불러오는 중입니다.
              </div>
            ) : null}

            {!complaintsLoading && complaintsError ? (
              <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-5 py-6 text-sm text-rose-700">
                민원 준비 중입니다.
              </div>
            ) : null}

            {!complaintsLoading && !complaintsError && complaints.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-12 text-center text-sm text-slate-500">
                조건에 맞는 민원이 없습니다.
              </div>
            ) : null}

            {complaints.map((item) => {
              const meta = getStatusMeta(item.status)
              const active = item.id === selectedComplaint?.id

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
                        <h2 className="text-2xl font-semibold">
                          {getComplaintTitle(item)}
                        </h2>
                        <StatusBadge
                          label={meta.label}
                          tone={active ? 'slate' : meta.tone}
                        />
                      </div>
                      <p
                        className={cx(
                          'mt-2 text-sm',
                          active ? 'text-slate-300' : 'text-slate-500',
                        )}
                      >
                        {item.student.name} · {item.student.email}
                      </p>
                      <p
                        className={cx(
                          'mt-3 line-clamp-3 text-sm leading-6',
                          active ? 'text-slate-200' : 'text-slate-600',
                        )}
                      >
                        {item.content}
                      </p>
                    </div>
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
                        setForm(buildForm(item))
                        setResponseOpen(true)
                      }}
                      type="button"
                    >
                      {item.response ? '응답 수정' : '응답 작성'}
                    </button>
                  </div>

                  <div
                    className={cx(
                      'mt-4 flex flex-wrap items-center gap-2 text-sm',
                      active ? 'text-slate-300' : 'text-slate-500',
                    )}
                  >
                    <span>접수일 {formatDate(item.createdAt)}</span>
                    <span>·</span>
                    <span>마지막 갱신 {formatDate(item.updatedAt)}</span>
                    {item.response ? (
                      <>
                        <span>·</span>
                        <span>응답 저장됨</span>
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
              title="현재 선택 민원"
              subtitle="요청 내용과 현재 응답 상태를 한눈에 확인합니다."
            />

            {selectedComplaint ? (
              <>
                <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-2xl font-semibold">
                      {selectedComplaint.student.name}
                    </p>
                    <StatusBadge
                      label={getStatusMeta(selectedComplaint.status).label}
                      tone="slate"
                    />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300 whitespace-pre-line">
                    {selectedComplaint.content}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                    {selectedComplaint.response
                      ? selectedComplaint.response
                      : '아직 저장된 응답이 없습니다. 먼저 응답 초안을 작성한 뒤 상태를 업데이트하세요.'}
                  </div>
                  <button
                    className={cx(
                      primaryButton,
                      'w-full bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
                    )}
                    onClick={() => {
                      setForm(buildForm(selectedComplaint))
                      setResponseOpen(true)
                    }}
                    type="button"
                  >
                    응답 패널 열기
                  </button>
                  <Link
                    className={cx(secondaryButton, 'w-full justify-between')}
                    href={`/admin/students/${selectedComplaint.student.id}`}
                  >
                    학생 상세 보러가기
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </>
            ) : null}
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="응답 원칙" subtitle="같은 톤으로 답변하기" />
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>1. 요청 요지를 먼저 요약해 공감 표현을 남깁니다.</p>
              <p>2. 변경 가능한 항목과 어려운 항목을 분리해서 설명합니다.</p>
              <p>3. 후속 일정이나 재답변 시점을 꼭 적습니다.</p>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="응답 준비 메모" subtitle="AI 초안이 있다면 함께 저장할 수 있습니다." />
            <div className="mt-5 rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              {selectedComplaint?.aiDraft
                ? selectedComplaint.aiDraft
                : '현재 저장된 AI 초안이 없습니다. 응답 패널에서 초안을 함께 보관할 수 있습니다.'}
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={responseOpen}
        onClose={() => setResponseOpen(false)}
        title={`${selectedComplaint ? getComplaintTitle(selectedComplaint) : '민원'} 응답 작성`}
        description="처리 상태와 응답 내용을 함께 저장합니다."
      >
        {form ? (
          <>
            <SelectField
              label="처리 상태"
              onChange={(value) =>
                setForm((current) =>
                  current
                    ? { ...current, status: value as ComplaintStatus }
                    : current,
                )
              }
              options={[
                { value: 'PENDING', label: '미처리' },
                { value: 'IN_PROGRESS', label: '처리중' },
                { value: 'RESOLVED', label: '완료' },
              ]}
              value={form.status}
            />
            <Field
              label="AI 초안"
              onChange={(value) =>
                setForm((current) =>
                  current ? { ...current, aiDraft: value } : current,
                )
              }
              placeholder={
                isDraftGenerating
                  ? 'AI가 초안을 작성 중이에요...'
                  : '내부 확인 후 오늘 오후 6시까지 다시 안내드리겠습니다.'
              }
              textarea
              disabled={isDraftGenerating}
              value={form.aiDraft}
            />
            <div className="flex justify-end">
              <button
                className={cx(
                  secondaryButton,
                  'border-violet-200 text-violet-700 hover:border-violet-300',
                )}
                disabled={isDraftGenerating}
                onClick={() => void handleGenerateDraft()}
                type="button"
              >
                {isDraftGenerating ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {isDraftGenerating ? '초안 생성 중...' : 'AI 초안 생성'}
              </button>
            </div>
            <Field
              label="최종 응답"
              onChange={(value) =>
                setForm((current) =>
                  current ? { ...current, response: value } : current,
                )
              }
              placeholder="학부모님 요청 내용을 확인했고, 가능한 대안과 재안내 시점을 함께 적어주세요."
              textarea
              value={form.response}
            />
            <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              민원 대상: {selectedComplaint?.student.name} · {selectedComplaint?.student.email}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                className={secondaryButton}
                onClick={() => setResponseOpen(false)}
                type="button"
              >
                취소
              </button>
              <button
                className={cx(
                  primaryButton,
                  'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
                )}
                disabled={isSaving || isDraftGenerating}
                onClick={handleSubmit}
                type="button"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                응답 저장
              </button>
            </div>
          </>
        ) : null}
      </OverlayPanel>
    </div>
  )
}
