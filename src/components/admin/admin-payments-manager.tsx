'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

import { useClasses } from '@/hooks/useClasses'
import { usePayments } from '@/hooks/usePayments'
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
type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'

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

type PaymentItem = {
  id: string
  studentId: string
  classId: string
  amount: number
  status: PaymentStatus
  month: string
  paidAt: string | null
  note: string | null
  student: {
    id: string
    name: string
    email: string
  }
  class: {
    id: string
    name: string
    subject: string | null
  } | null
}

type StudentUser = {
  id: string
  name: string
  email: string
}

type ClassItem = {
  id: string
  name: string
  subject: string | null
}

type PaymentFormState = {
  id?: string
  studentId: string
  classId: string
  amount: string
  status: PaymentStatus
  month: string
  paidAt: string
  note: string
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

function formatMonth(value: string) {
  const [year, month] = value.split('-')

  if (!year || !month) {
    return value
  }

  return `${year}년 ${month}월`
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
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

function getPaymentMeta(status: PaymentStatus) {
  if (status === 'PAID') {
    return { label: '완납', tone: 'emerald' as Tone }
  }

  if (status === 'PARTIAL') {
    return { label: '부분 납부', tone: 'amber' as Tone }
  }

  return { label: '미납', tone: 'rose' as Tone }
}

function toDateTimeValue(value: string) {
  if (!value) {
    return null
  }

  return new Date(`${value}T00:00:00`).toISOString()
}

function buildForm(payment: PaymentItem): PaymentFormState {
  return {
    id: payment.id,
    studentId: payment.studentId,
    classId: payment.classId,
    amount: String(payment.amount),
    status: payment.status,
    month: payment.month,
    paidAt: payment.paidAt ? payment.paidAt.slice(0, 10) : '',
    note: payment.note ?? '',
  }
}

export function AdminPaymentsManagerPage() {
  const [statusFilter, setStatusFilter] = useState<'전체' | PaymentStatus>('전체')
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    tone: Tone
    title: string
    description: string
  } | null>(null)
  const [form, setForm] = useState<PaymentFormState | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })

    if (search.trim()) {
      params.set('q', search.trim())
    }

    if (statusFilter !== '전체') {
      params.set('status', statusFilter)
    }

    if (monthFilter) {
      params.set('month', monthFilter)
    }

    return `?${params.toString()}`
  }, [monthFilter, search, statusFilter])

  const { data, isLoading, mutate } =
    usePayments<ApiEnvelope<PaginatedData<PaymentItem>>>(query)
  const { data: studentsResponse } =
    useUsers<ApiEnvelope<PaginatedData<StudentUser>>>('?role=STUDENT&limit=100')
  const { data: classesResponse } =
    useClasses<ApiEnvelope<PaginatedData<ClassItem>>>('?limit=100')

  const payments = data?.data.items ?? []
  const students = studentsResponse?.data.items ?? []
  const classes = classesResponse?.data.items ?? []

  const summary = useMemo(() => {
    return payments.reduce(
      (acc, item) => {
        acc[item.status] += 1
        return acc
      },
      { PAID: 0, PARTIAL: 0, UNPAID: 0 },
    )
  }, [payments])

  const recentNotes = useMemo(() => {
    return payments.filter((item) => item.note).slice(0, 5)
  }, [payments])

  async function handleSavePayment() {
    if (!form) {
      return
    }

    try {
      setIsSaving(true)

      const payload = {
        studentId: form.studentId,
        classId: form.classId,
        amount: Number(form.amount || 0),
        status: form.status,
        month: form.month,
        paidAt: toDateTimeValue(form.paidAt),
        note: form.note.trim() || null,
      }

      if (form.id) {
        await apiRequest(`/api/payments/${form.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await apiRequest('/api/payments', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await mutate()
      setRecordOpen(false)
      setFeedback({
        tone: 'emerald',
        title: '수납 정보를 저장했습니다.',
        description: '선택한 학생의 수납 상태를 최신 내용으로 반영했습니다.',
      })
    } catch (error) {
      setFeedback({
        tone: 'rose',
        title: '수납 저장에 실패했습니다.',
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="수강료"
        title="미납, 부분 납부, 완납 상태를 실제 데이터 기준으로 보고 바로 처리해요"
        description="학생별 수납 상태를 실제 API 데이터로 읽고, 각 행에서 바로 수납 처리 모달을 열 수 있게 연결했습니다."
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

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="미납" value={`${summary.UNPAID}건`} detail="후속 연락 필요" icon={CircleDollarSign} tone="rose" />
        <MetricCard label="부분 납부" value={`${summary.PARTIAL}건`} detail="잔액 확인 필요" icon={CreditCard} tone="amber" />
        <MetricCard label="완납" value={`${summary.PAID}건`} detail="이번 필터 기준" icon={CheckCircle2} tone="emerald" />
      </div>

      <SurfaceCard>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="학생명, 이메일로 찾기"
              value={search}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="h-[52px] rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) =>
                setStatusFilter(event.target.value as '전체' | PaymentStatus)
              }
              value={statusFilter}
            >
              <option value="전체">상태 전체</option>
              <option value="UNPAID">미납</option>
              <option value="PARTIAL">부분 납부</option>
              <option value="PAID">완납</option>
            </select>
            <input
              className="h-[52px] rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
              onChange={(event) => setMonthFilter(event.target.value)}
              type="month"
              value={monthFilter}
            />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading title="학생별 수납 현황" subtitle="행별로 바로 수납 처리할 수 있습니다." />
          {isLoading ? (
            <div className="mt-6 flex items-center gap-3 text-slate-600">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              수납 데이터를 불러오는 중입니다.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="pb-3 font-medium">이름</th>
                    <th className="pb-3 font-medium">금액</th>
                    <th className="pb-3 font-medium">청구월</th>
                    <th className="pb-3 font-medium">상태</th>
                    <th className="pb-3 font-medium text-right">처리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((row) => {
                    const meta = getPaymentMeta(row.status)

                    return (
                      <tr key={row.id}>
                        <td className="py-4 font-semibold text-slate-900">
                          {row.student.name}
                          <p className="mt-1 text-xs font-normal text-slate-500">
                            {row.class?.name ?? '반 미지정'}
                          </p>
                        </td>
                        <td className="py-4 text-slate-600">{formatCurrency(row.amount)}</td>
                        <td className="py-4 text-slate-600">{formatMonth(row.month)}</td>
                        <td className="py-4">
                          <StatusBadge label={meta.label} tone={meta.tone} />
                        </td>
                        <td className="py-4 text-right">
                          <button
                            className="text-sm font-semibold text-indigo-600"
                            onClick={() => {
                              setForm(buildForm(row))
                              setRecordOpen(true)
                            }}
                            type="button"
                          >
                            수납 처리
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {payments.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  조건에 맞는 수납 내역이 없습니다.
                </div>
              ) : null}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="후속 메모" subtitle="운영자가 바로 볼 요약" />
          <div className="mt-5 space-y-3">
            {recentNotes.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                표시할 메모가 없습니다.
              </div>
            ) : (
              recentNotes.map((row) => {
                const meta = getPaymentMeta(row.status)

                return (
                  <div key={row.id} className="rounded-[24px] bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{row.student.name}</p>
                      <StatusBadge label={meta.label} tone={meta.tone} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{row.note}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {formatMonth(row.month)} · {row.class?.name ?? '반 미지정'}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </SurfaceCard>
      </div>

      <OverlayPanel
        description="금액, 상태, 납부일, 메모를 같은 패널에서 바로 처리합니다."
        onClose={() => setRecordOpen(false)}
        open={recordOpen}
        title={form ? `${students.find((item) => item.id === form.studentId)?.name ?? '학생'} 수납 처리` : '수납 처리'}
      >
        {form ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">학생</span>
                <select
                  className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, studentId: event.target.value } : current,
                    )
                  }
                  value={form.studentId}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">반</span>
                <select
                  className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, classId: event.target.value } : current,
                    )
                  }
                  value={form.classId}
                >
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="수납 금액"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, amount: value } : current))
                }
                placeholder="320000"
                type="number"
                value={form.amount}
              />
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">상태</span>
                <select
                  className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                  onChange={(event) =>
                    setForm((current) =>
                      current
                        ? { ...current, status: event.target.value as PaymentStatus }
                        : current,
                    )
                  }
                  value={form.status}
                >
                  <option value="UNPAID">미납</option>
                  <option value="PARTIAL">부분 납부</option>
                  <option value="PAID">완납</option>
                </select>
              </label>
              <Field
                label="청구월"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, month: value } : current))
                }
                placeholder="2026-04"
                type="month"
                value={form.month}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="납부일"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, paidAt: value } : current))
                }
                placeholder="2026-04-02"
                type="date"
                value={form.paidAt}
              />
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-800">현재 상태 요약</p>
                <p className="mt-2 text-sm text-slate-600">
                  {formatMonth(form.month)} ·{' '}
                  {getPaymentMeta(form.status).label}
                  {form.paidAt ? ` · 납부일 ${formatDate(form.paidAt)}` : ''}
                </p>
              </div>
            </div>

            <Field
              label="처리 메모"
              onChange={(value) =>
                setForm((current) => (current ? { ...current, note: value } : current))
              }
              placeholder="학부모 문자 발송 예정"
              textarea
              value={form.note}
            />

            <div className="flex justify-end gap-3 pt-2">
              <button className={secondaryButton} onClick={() => setRecordOpen(false)} type="button">
                닫기
              </button>
              <button
                className={cx(
                  primaryButton,
                  'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20',
                )}
                disabled={isSaving}
                onClick={handleSavePayment}
                type="button"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                수납 기록 저장
              </button>
            </div>
          </>
        ) : null}
      </OverlayPanel>
    </div>
  )
}
