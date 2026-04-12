'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { CheckCircle2, Paperclip, Send, Sparkles } from 'lucide-react'

import { ActionButton, PageHero, SectionHeading, StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { apiRequest, fetcher } from '@/lib/fetcher'

import { formatKoreanDate, formatKoreanDateTime, type ApiEnvelope } from './student-data'

type AssignmentSubmission = {
  id: string
  content: string | null
  aiUsed: boolean | null
  aiUsageDetail: string | null
  teacherFeedback: string | null
  submittedAt: string | null
  history?: Array<{
    id: string
    content: string
    charCount: number
    createdAt: string
  }>
}

type AssignmentDetail = {
  id: string
  title: string
  type: 'CODING' | 'ESSAY' | 'IMAGE'
  content: string | null
  teacherNote: string | null
  imageUrls: string[]
  dueDate: string | null
  class: { id: string; name: string }
  teacher: { id: string; name: string; email: string }
  submissions: AssignmentSubmission[]
}

const typeLabels: Record<AssignmentDetail['type'], string> = {
  CODING: '코딩',
  ESSAY: '서술',
  IMAGE: '이미지',
}

export function StudentAssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const { data, error, isLoading, mutate } = useSWR<ApiEnvelope<AssignmentDetail>>(
    assignmentId ? `/api/assignments/${assignmentId}` : null,
    fetcher,
  )

  const assignment = data?.data
  const submission = assignment?.submissions?.[0] ?? null
  const [content, setContent] = useState('')
  const [aiUsed, setAiUsed] = useState(false)
  const [aiUsageDetail, setAiUsageDetail] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setContent(submission?.content ?? '')
    setAiUsed(Boolean(submission?.aiUsed))
    setAiUsageDetail(submission?.aiUsageDetail ?? '')
  }, [submission?.aiUsageDetail, submission?.aiUsed, submission?.content, submission?.id])

  const historyItems = useMemo(() => submission?.history ?? [], [submission?.history])

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="과제 상세"
        title={assignment?.title ?? '과제 정보를 불러오는 중이에요'}
        description="과제 본문, 제출 상태, AI 사용 여부를 실데이터 기준으로 확인하고 바로 제출할 수 있게 연결했습니다."
        backHref="/student/assignments"
        backLabel="과제 목록"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      {notice ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">{notice}</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">저장된 내용은 바로 제출 목록에 반영돼요.</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={typeLabels[assignment?.type ?? 'ESSAY']} tone="indigo" />
          <StatusBadge label={formatKoreanDate(assignment?.dueDate)} tone="amber" />
          <StatusBadge label={assignment?.class.name ?? '반 정보 없음'} tone="sky" />
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">{assignment?.title ?? '과제를 불러오는 중'}</h2>
        <p className="mt-2 text-sm text-slate-500">{assignment?.teacher.name ?? '담당 선생님 정보 없음'}</p>
        <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-600">
          {assignment?.content ?? '과제 본문이 없습니다.'}
        </div>
        {assignment?.imageUrls?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {assignment.imageUrls.map((_, index) => (
              <span
                key={`${assignment.id}-image-${index}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200"
              >
                <Paperclip className="h-3.5 w-3.5" />
                첨부 이미지
              </span>
            ))}
          </div>
        ) : null}
        {assignment?.teacherNote ? (
          <p className="mt-4 rounded-[24px] bg-violet-50 px-5 py-4 text-sm leading-6 text-violet-700">
            {assignment.teacherNote}
          </p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="내 제출" subtitle="작성한 답안을 저장하고 제출할 수 있어요." />
        {submission ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <StatusBadge label="기존 제출 있음" tone="emerald" />
            <StatusBadge label={submission.aiUsed ? 'AI 사용함' : 'AI 사용 안 함'} tone={submission.aiUsed ? 'violet' : 'slate'} />
            <StatusBadge label={formatKoreanDateTime(submission.submittedAt)} tone="sky" />
          </div>
        ) : null}
        <textarea
          className="mt-5 min-h-[240px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          onChange={(event) => setContent(event.target.value)}
          placeholder="풀이 과정을 입력하세요..."
          value={content}
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            className={cx(
              'inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition',
              aiUsed
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
            onClick={() => setAiUsed((current) => !current)}
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            AI 사용 여부 {aiUsed ? '켜짐' : '꺼짐'}
          </button>
        </div>
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          onChange={(event) => setAiUsageDetail(event.target.value)}
          placeholder="AI를 사용했다면 어떤 식으로 참고했는지 적어주세요."
          value={aiUsageDetail}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving || !content.trim()}
            onClick={async () => {
              setSaving(true)
              try {
                await apiRequest(`/api/assignments/${assignmentId}/submissions`, {
                  method: 'POST',
                  body: JSON.stringify({
                    content: content.trim(),
                    aiUsed,
                    aiUsageDetail: aiUsageDetail.trim() || null,
                    attachments: [],
                  }),
                })
                await mutate()
                setNotice('과제가 저장되고 제출되었어요.')
              } finally {
                setSaving(false)
              }
            }}
            type="button"
          >
            <Send className="h-4 w-4" />
            {submission ? '다시 제출하기' : '제출하기'}
          </button>
        </div>
      </SurfaceCard>

      {submission?.teacherFeedback ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">선생님 피드백</p>
              <p className="mt-2 text-sm leading-6 text-emerald-700">{submission.teacherFeedback}</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      {historyItems.length ? (
        <SurfaceCard>
          <SectionHeading title="제출 기록" subtitle="이전 저장 기록을 확인할 수 있어요." />
          <div className="mt-5 space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-[24px] bg-slate-50 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900">{formatKoreanDateTime(item.createdAt)}</p>
                  <StatusBadge label={`${item.charCount}자`} tone="slate" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.content}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {isLoading ? (
        <SurfaceCard>
          <p className="text-sm text-slate-500">과제를 불러오는 중이에요.</p>
        </SurfaceCard>
      ) : null}

      {error ? (
        <SurfaceCard className="border border-rose-100 bg-rose-50/80">
          <p className="text-sm text-rose-700">과제 상세를 불러오지 못했어요.</p>
        </SurfaceCard>
      ) : null}
    </div>
  )
}
