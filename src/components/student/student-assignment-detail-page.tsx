'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { CheckCircle2, Clock3, Paperclip, Save, Send, Sparkles, X } from 'lucide-react'

import {
  ActionButton,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'
import { apiRequest, fetcher } from '@/lib/fetcher'

import { formatKoreanDate, formatKoreanDateTime, type ApiEnvelope } from './student-data'

type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWED'

type AssignmentSubmission = {
  id: string
  status: SubmissionStatus
  content: string | null
  aiUsed: boolean | null
  aiUsageDetail: string | null
  teacherFeedback: string | null
  submittedAt: string | null
  updatedAt?: string | null
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
  type: 'WORKBOOK' | 'ESSAY' | 'IMAGE'
  content: string | null
  teacherNote: string | null
  imageUrls: string[]
  dueDate: string | null
  class: { id: string; name: string }
  teacher: { id: string; name: string; email: string }
  submissions: AssignmentSubmission[]
}

type SubmissionEnvelope = ApiEnvelope<AssignmentSubmission>

const typeLabels: Record<AssignmentDetail['type'], string> = {
  WORKBOOK: '문제풀이',
  ESSAY: '서술',
  IMAGE: '이미지',
}

function serializeDraft(content: string, aiUsed: boolean, aiUsageDetail: string) {
  return JSON.stringify({
    content,
    aiUsed,
    aiUsageDetail: aiUsageDetail.trim(),
  })
}

function SubmissionConfirmDialog({
  open,
  onClose,
  onConfirm,
  disabled,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  disabled: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[560px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">과제 제출 확인</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">이 답안으로 제출할까요?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              제출하면 선생님 피드백 대기 상태로 전환되고, 제출 기록에도 바로 남습니다.
            </p>
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            aria-label="닫기"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            onClick={onClose}
            type="button"
          >
            계속 수정하기
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={onConfirm}
            type="button"
          >
            <Send className="h-4 w-4" />
            제출 확정
          </button>
        </div>
      </div>
    </div>
  )
}

function SubmissionEditor({
  assignmentId,
  submission,
  refreshAssignment,
}: {
  assignmentId: string
  submission: AssignmentSubmission | null
  refreshAssignment: () => Promise<unknown>
}) {
  const [content, setContent] = useState(() => submission?.content ?? '')
  const [aiUsed, setAiUsed] = useState(() => Boolean(submission?.aiUsed))
  const [aiUsageDetail, setAiUsageDetail] = useState(() => submission?.aiUsageDetail ?? '')
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    serializeDraft(submission?.content ?? '', Boolean(submission?.aiUsed), submission?.aiUsageDetail ?? ''),
  )
  const [saveState, setSaveState] = useState<'idle' | 'autosaving' | 'submitting'>('idle')
  const [notice, setNotice] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    submission?.updatedAt ?? submission?.submittedAt ?? null,
  )
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  // POST 성공 후 mutate 완료 전 사이에 재저장이 발생해도 PATCH를 쓰도록 id를 추적
  const submissionIdRef = useRef<string | null>(submission?.id ?? null)

  const currentSnapshot = serializeDraft(content, aiUsed, aiUsageDetail)
  const dirty = currentSnapshot !== savedSnapshot
  const hasDraftContent = Boolean(content.trim() || aiUsed || aiUsageDetail.trim())

  const persistSubmission = useCallback(
    async (mode: 'draft' | 'submit') => {
      if (!hasDraftContent && mode === 'draft') {
        return
      }

      if (mode === 'draft' && !dirty) {
        return
      }

      setSaveState(mode === 'submit' ? 'submitting' : 'autosaving')

      try {
        const payload = {
          content: content.trim() || null,
          aiUsed,
          aiUsageDetail: aiUsageDetail.trim() || null,
          attachments: [],
          status: mode === 'submit' ? 'SUBMITTED' : 'DRAFT',
        }

        const currentSubmissionId = submissionIdRef.current
        const endpoint = currentSubmissionId
          ? `/api/assignments/${assignmentId}/submissions/${currentSubmissionId}`
          : `/api/assignments/${assignmentId}/submissions`
        const method = currentSubmissionId ? 'PATCH' : 'POST'

        const response = await apiRequest<SubmissionEnvelope>(endpoint, {
          method,
          body: JSON.stringify(payload),
        })

        // POST로 처음 생성된 경우 id를 ref에 저장 (mutate 완료 전 재저장 시 PATCH 사용)
        if (!currentSubmissionId && response.data.id) {
          submissionIdRef.current = response.data.id
        }

        const savedAt =
          mode === 'submit'
            ? response.data.submittedAt ?? new Date().toISOString()
            : response.data.updatedAt ?? new Date().toISOString()

        setSavedSnapshot(currentSnapshot)
        setLastSavedAt(savedAt)
        setNotice(mode === 'submit' ? '과제를 제출했어요.' : '임시저장되었습니다.')

        if (mode === 'submit') {
          setSubmitModalOpen(false)
        }

        await refreshAssignment()
      } finally {
        setSaveState('idle')
      }
    },
    [
      aiUsageDetail,
      aiUsed,
      assignmentId,
      content,
      currentSnapshot,
      dirty,
      hasDraftContent,
      refreshAssignment,
    ],
  )

  useEffect(() => {
    if (!hasDraftContent || !dirty) {
      return
    }

    const intervalId = window.setInterval(() => {
      void persistSubmission('draft')
    }, 5 * 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [dirty, hasDraftContent, persistSubmission])

  const statusLabel =
    submission?.status === 'REVIEWED'
      ? '피드백 도착'
      : submission?.status === 'SUBMITTED'
        ? '제출 완료'
        : submission
          ? '임시 저장'
          : '새 답안'

  return (
    <>
      {notice ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">{notice}</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                {lastSavedAt
                  ? `${formatKoreanDateTime(lastSavedAt)} 기준으로 저장된 상태예요.`
                  : '저장된 내용은 바로 제출 기록에 반영돼요.'}
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <SectionHeading
          title="내 제출"
          subtitle="5분마다 임시저장되고, 제출은 확인 모달에서 한 번 더 체크해요."
        />
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <StatusBadge label={statusLabel} tone={submission?.status === 'SUBMITTED' ? 'emerald' : 'amber'} />
          <StatusBadge label={aiUsed ? 'AI 사용함' : 'AI 사용 안 함'} tone={aiUsed ? 'violet' : 'slate'} />
          <StatusBadge
            label={lastSavedAt ? formatKoreanDateTime(lastSavedAt) : '아직 저장 전'}
            tone="sky"
          />
        </div>

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

          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
            <Clock3 className="h-3.5 w-3.5" />
            {dirty ? '다음 자동저장 대기 중' : '저장된 초안과 동일'}
          </span>
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
            disabled={saveState !== 'idle' || !hasDraftContent}
            onClick={() => {
              void persistSubmission('draft')
            }}
            type="button"
          >
            <Save className="h-4 w-4" />
            {saveState === 'autosaving' ? '임시저장 중...' : '지금 임시저장'}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saveState !== 'idle' || !content.trim()}
            onClick={() => setSubmitModalOpen(true)}
            type="button"
          >
            <Send className="h-4 w-4" />
            {submission?.status === 'SUBMITTED' ? '다시 제출하기' : '제출하기'}
          </button>
        </div>
      </SurfaceCard>

      <SubmissionConfirmDialog
        disabled={saveState !== 'idle'}
        onClose={() => setSubmitModalOpen(false)}
        onConfirm={() => {
          void persistSubmission('submit')
        }}
        open={submitModalOpen}
      />
    </>
  )
}

export function StudentAssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const { data, error, isLoading, mutate } = useSWR<ApiEnvelope<AssignmentDetail>>(
    assignmentId ? `/api/assignments/${assignmentId}` : null,
    fetcher,
  )

  const assignment = data?.data
  const submission = assignment?.submissions?.[0] ?? null
  const historyItems = useMemo(() => submission?.history ?? [], [submission?.history])

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="과제 상세"
        title={assignment?.title ?? '과제 정보를 불러오는 중이에요'}
        description="과제 본문, 제출 상태, AI 사용 여부를 실데이터 기준으로 확인하고, 임시저장과 제출을 분리해 관리할 수 있게 정리했습니다."
        backHref="/student/assignments"
        backLabel="과제 목록"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

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

      <SubmissionEditor
        assignmentId={assignmentId}
        key={submission?.id ?? `${assignmentId}-draft`}
        refreshAssignment={() => mutate()}
        submission={submission}
      />

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
