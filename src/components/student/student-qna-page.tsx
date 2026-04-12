'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { ArrowRight, MessageCircleQuestion, Send } from 'lucide-react'

import { ActionButton, PageHero, SectionHeading, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { apiRequest, fetcher } from '@/lib/fetcher'

import { formatKoreanDateTime, type ApiEnvelope, type PaginatedData, unwrapItems } from './student-data'

type AssignmentItem = {
  id: string
  title: string
  class: { id: string; name: string }
}

type QnaItem = {
  id: string
  question: string
  status: 'PENDING' | 'AI_ANSWERED' | 'TEACHER_ANSWERED'
  aiAnswer: string | null
  teacherAnswer: string | null
  helpful: boolean | null
  createdAt: string
  class: { id: string; name: string } | null
}

const statusTone: Record<QnaItem['status'], 'amber' | 'violet' | 'emerald'> = {
  PENDING: 'amber',
  AI_ANSWERED: 'violet',
  TEACHER_ANSWERED: 'emerald',
}

export function StudentQnaPage() {
  const { data: assignmentsResponse } = useSWR<ApiEnvelope<PaginatedData<AssignmentItem>>>(
    '/api/assignments?limit=100',
    fetcher,
  )
  const { data, error, isLoading } = useSWR<ApiEnvelope<PaginatedData<QnaItem>>>(
    '/api/qna?limit=100',
    fetcher,
  )

  const assignments = unwrapItems(assignmentsResponse)
  const items = unwrapItems(data)

  const classOptions = useMemo(() => {
    const seen = new Map<string, string>()
    assignments.forEach((item) => {
      if (!seen.has(item.class.id)) {
        seen.set(item.class.id, item.class.name)
      }
    })
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [assignments])

  const [selectedClassId, setSelectedClassId] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedClassId && classOptions[0]) {
      setSelectedClassId(classOptions[0].id)
    }
  }, [classOptions, selectedClassId])

  const selectedClassName = classOptions.find((item) => item.id === selectedClassId)?.name ?? '전체 반'

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="질문하기"
        title="질문을 남기고 답변 이력을 실데이터로 확인해요"
        description="과제와 연결된 반을 선택해서 질문할 수 있고, 최근 질문과 답변도 바로 확인할 수 있게 바꿨습니다."
        backHref="/student/home"
        backLabel="홈으로"
        action={<ActionButton href="/student/review" label="복습 보기" tone="violet" />}
      />

      {notice ? (
        <SurfaceCard className="border border-indigo-100 bg-indigo-50/80">
          <div className="flex items-start gap-3">
            <MessageCircleQuestion className="mt-1 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-semibold text-indigo-900">{notice}</p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">새 질문은 목록에 바로 반영됩니다.</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <SectionHeading title="새 질문" subtitle="수업 반을 선택하고 궁금한 내용을 바로 보낼 수 있어요." />
        <div className="mt-5 space-y-3">
          <select
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setSelectedClassId(event.target.value)}
            value={selectedClassId}
          >
            <option value="">전체 반</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <textarea
            className="min-h-[140px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="궁금한 점을 입력하세요..."
            value={question}
          />
          <div className="flex justify-end">
            <button
              className={cx(
                'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]',
                'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={!question.trim() || submitting}
              onClick={async () => {
                setSubmitting(true)
                try {
                  await apiRequest('/api/qna', {
                    method: 'POST',
                    body: JSON.stringify({
                      question: question.trim(),
                      classId: selectedClassId || null,
                    }),
                  })
                  setQuestion('')
                  setNotice('질문이 등록되었어요.')
                  await mutate('/api/qna?limit=100')
                } finally {
                  setSubmitting(false)
                }
              }}
              type="button"
            >
              <Send className="h-4 w-4" />
              질문 보내기
            </button>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="질문 이력" subtitle={selectedClassName} />
        <div className="mt-5 space-y-3">
          {error ? (
            <p className="rounded-[24px] bg-rose-50 px-5 py-6 text-sm text-rose-700">질문 목록을 불러오지 못했어요.</p>
          ) : null}
          {isLoading ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">질문 목록을 불러오는 중이에요.</p>
          ) : null}
          {!isLoading && !items.length ? (
            <p className="rounded-[24px] bg-slate-50 px-5 py-6 text-sm text-slate-500">아직 등록한 질문이 없어요.</p>
          ) : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-[28px] bg-slate-50 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={item.class?.name ?? '전체 반'} tone="sky" />
                <StatusBadge label={item.status} tone={statusTone[item.status]} />
                {item.helpful !== null ? <StatusBadge label={item.helpful ? '도움 됨' : '추가 설명 필요'} tone={item.helpful ? 'emerald' : 'rose'} /> : null}
              </div>
              <p className="mt-4 font-semibold text-slate-900">{item.question}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.teacherAnswer ?? item.aiAnswer ?? '답변 대기 중'}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">{formatKoreanDateTime(item.createdAt)}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
