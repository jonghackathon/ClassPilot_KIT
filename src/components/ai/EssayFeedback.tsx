'use client'

import { useState } from 'react'
import { LoaderCircle, Sparkles, X } from 'lucide-react'

import { StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { apiRequest } from '@/lib/fetcher'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type FeedbackResult = {
  understanding: string
  structure: string
  expression: string
  nextAction: string
  teacherComment: string
}

export function EssayFeedback({
  assignmentId,
  assignmentTitle,
  studentName,
  extractedText,
  open,
  onClose,
}: {
  assignmentId: string
  assignmentTitle: string
  studentName: string
  extractedText: string
  open: boolean
  onClose: () => void
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null)

  if (!open) {
    return null
  }

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      const response = await apiRequest<{ success: boolean; data: FeedbackResult }>(
        '/api/ai/essay-feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            assignmentId,
            assignmentTitle,
            studentName,
            extractedText,
          }),
        },
      )
      setFeedback(response.data)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm font-medium text-violet-600">AI 첨삭 패널</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{studentName} 제출물 분석</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{assignmentTitle} 기준 피드백 초안을 생성합니다.</p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-[0.9fr_1.1fr] sm:px-6">
          <SurfaceCard className="rounded-[28px]">
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="텍스트 추출 완료" tone="emerald" />
              <StatusBadge label={feedback ? 'AI 초안 생성됨' : 'AI 대기'} tone={feedback ? 'violet' : 'slate'} />
            </div>
            <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
              {extractedText}
            </div>
            <button
              className={cx(primaryButton, 'mt-5 w-full bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')}
              disabled={isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI 첨삭 초안 생성
            </button>
          </SurfaceCard>

          <div className="space-y-4">
            {feedback ? (
              ([
                ['문제 이해', feedback.understanding],
                ['구성', feedback.structure],
                ['표현', feedback.expression],
                ['다음 액션', feedback.nextAction],
                ['강사 최종 코멘트', feedback.teacherComment],
              ] as const).map(([title, value]) => (
                <SurfaceCard key={title} className="rounded-[28px]">
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{value}</p>
                </SurfaceCard>
              ))
            ) : (
              <SurfaceCard className="rounded-[28px]">
                <p className="text-sm text-slate-500">아직 생성된 피드백이 없습니다.</p>
              </SurfaceCard>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button className={secondaryButton} onClick={onClose} type="button">닫기</button>
        </div>
      </div>
    </div>
  )
}
