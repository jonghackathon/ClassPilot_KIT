'use client'

import { useState } from 'react'
import { Copy, LoaderCircle, Send, Sparkles, X } from 'lucide-react'

import { StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'
import { apiRequest } from '@/lib/fetcher'

const filledButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const lineButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type CopilotQuestion = {
  id: string
  question: string
  beginner: string | null
  example: string | null
  advanced: string | null
  summary: string | null
  usedCards: string[]
  createdAt: string
}

type CopilotSession = {
  id: string
  topic: string | null
  status: 'ACTIVE' | 'COMPLETED'
  questions: CopilotQuestion[]
}

function cardTone(label: string) {
  if (label === 'beginner') return 'emerald'
  if (label === 'example') return 'sky'
  if (label === 'advanced') return 'violet'
  return 'amber'
}

function cardLabel(label: string) {
  if (label === 'beginner') return '초보자 설명'
  if (label === 'example') return '예시 코드'
  if (label === 'advanced') return '심화 질문'
  return '판서용 요약'
}

export function CopilotPanel({
  lessonTitle,
  session,
  onRefresh,
}: {
  lessonTitle: string
  session: CopilotSession
  onRefresh: () => Promise<unknown>
}) {
  const [prompt, setPrompt] = useState('')
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [endOpen, setEndOpen] = useState(false)
  const latestQuestion = session.questions.at(-1) ?? null

  async function handleCopy(label: string, value?: string | null) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopiedCard(label)
    } catch {
      setCopiedCard(label)
    }
  }

  async function handleSubmitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!prompt.trim()) return

    setIsSubmitting(true)
    try {
      await apiRequest('/api/copilot/questions', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session.id,
          question: prompt.trim(),
        }),
      })
      setPrompt('')
      await onRefresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCompleteSession() {
    setIsCompleting(true)
    try {
      await apiRequest(`/api/copilot/sessions/${session.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'COMPLETED',
        }),
      })
      setEndOpen(false)
      await onRefresh()
    } finally {
      setIsCompleting(false)
    }
  }

  const cards = latestQuestion
    ? [
        { key: 'beginner', content: latestQuestion.beginner },
        { key: 'example', content: latestQuestion.example },
        { key: 'advanced', content: latestQuestion.advanced },
        { key: 'summary', content: latestQuestion.summary },
      ]
    : []

  return (
    <div className="space-y-6">
      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">AI 수업 코파일럿</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{lessonTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              최신 질문을 기준으로 설명, 예시, 확장 질문, 판서 요약 카드를 제공합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label={session.status === 'ACTIVE' ? '세션 진행 중' : '세션 종료'} tone={session.status === 'ACTIVE' ? 'emerald' : 'slate'} />
            <button
              className={cx(
                filledButton,
                'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20',
              )}
              disabled={session.status === 'COMPLETED'}
              onClick={() => setEndOpen(true)}
              type="button"
            >
              세션 종료
            </button>
          </div>
        </div>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmitQuestion}>
          <input
            className="h-[54px] flex-1 rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="지금 학생이 물어본 질문을 그대로 입력해 보세요"
            value={prompt}
          />
          <button
            className={cx(
              filledButton,
              'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
            )}
            disabled={isSubmitting || session.status === 'COMPLETED'}
            type="submit"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            질문 보내기
          </button>
        </form>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.length ? (
          cards.map((card) => (
            <SurfaceCard key={card.key}>
              <div className="flex items-center justify-between gap-3">
                <StatusBadge label={cardLabel(card.key)} tone={cardTone(card.key)} />
                <StatusBadge
                  label={latestQuestion?.usedCards.includes(card.key) ? '카드 준비됨' : '미생성'}
                  tone={latestQuestion?.usedCards.includes(card.key) ? 'emerald' : 'slate'}
                />
              </div>
              <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">
                {card.content ?? '아직 생성된 카드가 없습니다.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className={lineButton} onClick={() => handleCopy(card.key, card.content)} type="button">
                  <Copy className="h-4 w-4" />
                  {copiedCard === card.key ? '복사됨' : '복사하기'}
                </button>
              </div>
            </SurfaceCard>
          ))
        ) : (
          <SurfaceCard className="xl:col-span-2">
            <div className="rounded-[28px] bg-violet-50 px-5 py-6 text-sm leading-6 text-violet-800">
              첫 질문을 보내면 설명 카드가 생성됩니다.
            </div>
          </SurfaceCard>
        )}
      </div>

      <SurfaceCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">질문 히스토리</h3>
            <p className="mt-1 text-sm text-slate-500">최근 질문부터 다시 확인할 수 있어요.</p>
          </div>
          <StatusBadge label={`${session.questions.length}개`} tone="slate" />
        </div>
        <div className="mt-5 space-y-3">
          {session.questions.length ? (
            [...session.questions].reverse().map((item) => (
              <div key={item.id} className="rounded-[24px] bg-slate-50 px-4 py-4">
                <p className="font-semibold text-slate-900">{item.question}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Intl.DateTimeFormat('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(item.createdAt))}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-500">
              아직 질문 이력이 없습니다.
            </p>
          )}
        </div>
      </SurfaceCard>

      {endOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto max-w-[560px] rounded-[32px] bg-white p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-rose-600">세션 종료 확인</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">오늘 코파일럿 세션을 종료할까요?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  종료 후에도 질문 이력은 남아 있고, 상태만 완료로 바뀝니다.
                </p>
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                onClick={() => setEndOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatusBadge label={`질문 ${session.questions.length}개`} tone="violet" />
              <StatusBadge label={session.topic ?? '주제 미설정'} tone="amber" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className={lineButton} onClick={() => setEndOpen(false)} type="button">
                계속 진행
              </button>
              <button
                className={cx(
                  filledButton,
                  'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20',
                )}
                disabled={isCompleting}
                onClick={handleCompleteSession}
                type="button"
              >
                {isCompleting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                종료하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
