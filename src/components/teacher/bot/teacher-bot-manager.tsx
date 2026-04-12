'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Bot, CheckCircle2, Save, Search, Sparkles, X } from 'lucide-react'
import useSWR from 'swr'

import { apiRequest, fetcher } from '@/lib/fetcher'
import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type BotFaqItem = {
  id: string
  classId?: string | null
  question: string
  answer: string
  sortOrder?: number
}

type BotQuestionItem = {
  id: string
  studentId: string
  classId?: string | null
  question: string
  aiAnswer?: string | null
  teacherAnswer?: string | null
  status: 'PENDING' | 'AI_ANSWERED' | 'TEACHER_ANSWERED'
  student?: { id: string; name: string; email?: string }
  class?: { id: string; name: string }
  createdAt?: string
}

type FaqDraft = {
  question: string
  answer: string
  sortOrder: string
}

type AnswerDraft = {
  teacherAnswer: string
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
      <div className="mx-auto w-full max-w-[680px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Bot</p>
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

const emptyFaqDraft: FaqDraft = {
  question: '',
  answer: '',
  sortOrder: '0',
}

const emptyAnswerDraft: AnswerDraft = {
  teacherAnswer: '',
}

function statusTone(status: BotQuestionItem['status']) {
  switch (status) {
    case 'TEACHER_ANSWERED':
      return 'emerald'
    case 'AI_ANSWERED':
      return 'violet'
    default:
      return 'amber'
  }
}

function statusLabel(status: BotQuestionItem['status']) {
  switch (status) {
    case 'TEACHER_ANSWERED':
      return '강사 답변'
    case 'AI_ANSWERED':
      return 'AI 초안'
    default:
      return '대기'
  }
}

export function TeacherBotManager() {
  const [activeTab, setActiveTab] = useState<'faq' | 'history' | 'settings'>('faq')
  const [statusFilter, setStatusFilter] = useState<'전체' | BotQuestionItem['status']>('전체')
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [answerModalOpen, setAnswerModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<BotFaqItem | null>(null)
  const [answeringQuestion, setAnsweringQuestion] = useState<BotQuestionItem | null>(null)
  const [faqDraft, setFaqDraft] = useState<FaqDraft>(emptyFaqDraft)
  const [answerDraft, setAnswerDraft] = useState<AnswerDraft>(emptyAnswerDraft)
  const [settings, setSettings] = useState({ autoReply: true, notifyTeacher: true })

  const faqResponse = useSWR<{ success: boolean; data: { items?: BotFaqItem[] } }>(
    '/api/bot-faq',
    fetcher,
  )
  const questionQuery = useMemo(() => {
    const params = new URLSearchParams()
    if (statusFilter !== '전체') {
      params.set('status', statusFilter)
    }
    const value = params.toString()
    return value ? `/api/bot-questions?${value}` : '/api/bot-questions'
  }, [statusFilter])
  const questionResponse = useSWR<{ success: boolean; data: { items?: BotQuestionItem[] } }>(
    questionQuery,
    fetcher,
  )

  const faqItems = faqResponse.data?.data?.items ?? []
  const questionItems = questionResponse.data?.data?.items ?? []

  const openFaqModal = (item?: BotFaqItem) => {
    setEditingFaq(item ?? null)
    setFaqDraft(
      item
        ? {
            question: item.question ?? '',
            answer: item.answer ?? '',
            sortOrder: String(item.sortOrder ?? 0),
          }
        : emptyFaqDraft,
    )
    setFaqModalOpen(true)
  }

  const openAnswerModal = (item: BotQuestionItem) => {
    setAnsweringQuestion(item)
    setAnswerDraft({
      teacherAnswer: item.teacherAnswer ?? item.aiAnswer ?? '',
    })
    setAnswerModalOpen(true)
  }

  const saveFaq = async () => {
    if (!faqDraft.question.trim() || !faqDraft.answer.trim()) {
      return
    }

    const payload = {
      question: faqDraft.question.trim(),
      answer: faqDraft.answer.trim(),
      sortOrder: Number(faqDraft.sortOrder || 0),
    }

    if (editingFaq) {
      await apiRequest(`/api/bot-faq/${editingFaq.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiRequest('/api/bot-faq', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    await faqResponse.mutate()
    setFaqModalOpen(false)
    setEditingFaq(null)
  }

  const saveAnswer = async () => {
    if (!answeringQuestion || !answerDraft.teacherAnswer.trim()) {
      return
    }

    await apiRequest(`/api/bot-questions/${answeringQuestion.id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ teacherAnswer: answerDraft.teacherAnswer.trim() }),
    })

    await questionResponse.mutate()
    setAnswerModalOpen(false)
    setAnsweringQuestion(null)
  }

  const deleteFaq = async (item: BotFaqItem) => {
    await apiRequest(`/api/bot-faq/${item.id}`, { method: 'DELETE' })
    await faqResponse.mutate()
  }

  const openQuestions = questionItems.filter((item) => item.status === 'PENDING').length
  const answeredQuestions = questionItems.filter((item) => item.status === 'TEACHER_ANSWERED').length

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="질문봇"
        title="FAQ와 질문 응답을 실제 데이터에 붙여 관리해요"
        description="FAQ 등록, 질문 목록, 강사 답변 저장이 모두 API와 연결되어 있습니다. 설정은 화면에서 바로 토글할 수 있게 두었습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={() => openFaqModal()}
            type="button"
          >
            <Bot className="h-4 w-4" />
            FAQ 추가
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="FAQ 수" value={`${faqItems.length}개`} detail="즉시 응답 가능" icon={Bot} tone="violet" />
        <MetricCard label="미답변 질문" value={`${openQuestions}건`} detail="강사 확인 필요" icon={Search} tone="amber" />
        <MetricCard label="강사 답변" value={`${answeredQuestions}건`} detail="저장된 응답" icon={CheckCircle2} tone="emerald" />
      </div>

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['faq', 'history', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              className={cx(
                'rounded-full px-3 py-2 text-sm font-medium transition',
                activeTab === tab
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === 'faq' ? 'FAQ' : tab === 'history' ? '질문 이력' : '설정'}
            </button>
          ))}
        </div>
      </SurfaceCard>

      {activeTab === 'faq' ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {faqItems.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{item.question}</h2>
                      <StatusBadge label="FAQ" tone="violet" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                      onClick={() => openFaqModal(item)}
                      type="button"
                    >
                      수정
                    </button>
                    <button
                      className="rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300"
                      onClick={() => deleteFaq(item)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="h-fit">
            <SectionHeading title="FAQ 운영 메모" subtitle="기존 질문을 반복 입력하지 않도록 정리합니다." />
            <div className="mt-5 space-y-3">
              {[
                '질문이 반복되는 항목은 FAQ로 먼저 흡수',
                '답변은 학생이 바로 이해할 수 있는 문장으로 유지',
                '수업 시간 변경, 과제 제출, AI 사용 규칙을 우선 정리',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <SurfaceCard>
              <div className="flex flex-wrap gap-2">
                {(['전체', 'PENDING', 'AI_ANSWERED', 'TEACHER_ANSWERED'] as const).map((item) => (
                  <button
                    key={item}
                    className={cx(
                      'rounded-full px-3 py-2 text-sm font-medium transition',
                      statusFilter === item
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200',
                    )}
                    onClick={() => setStatusFilter(item)}
                    type="button"
                  >
                    {item === '전체' ? item : statusLabel(item)}
                  </button>
                ))}
              </div>
            </SurfaceCard>
            {questionItems.map((item) => (
              <SurfaceCard key={item.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{item.question}</h2>
                      <StatusBadge label={statusLabel(item.status)} tone={statusTone(item.status)} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.student?.name ?? '학생 미상'} · {item.class?.name ?? '반 미지정'}
                    </p>
                  </div>
                  <button
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
                    onClick={() => openAnswerModal(item)}
                    type="button"
                  >
                    답변
                  </button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">AI 초안</p>
                    <p className="mt-2 whitespace-pre-line leading-6">{item.aiAnswer ?? '아직 없음'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">강사 답변</p>
                    <p className="mt-2 whitespace-pre-line leading-6">{item.teacherAnswer ?? '아직 없음'}</p>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>

          <SurfaceCard className="h-fit">
            <SectionHeading title="질문 응답 흐름" subtitle="AI 초안과 강사 답변을 분리해서 관리합니다." />
            <div className="mt-5 space-y-3">
              {[
                '먼저 FAQ와 일치하는 질문은 빠르게 재사용',
                '질문 이력에는 AI 초안과 최종 답변을 함께 남김',
                '강사 답변이 들어가면 상태를 TEACHER_ANSWERED로 저장',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4" />
                질문봇의 핵심은 FAQ와 응답 이력을 같이 보는 흐름입니다.
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {activeTab === 'settings' ? (
        <SurfaceCard>
          <SectionHeading title="질문봇 설정" subtitle="자동 응답과 알림 흐름은 화면에서 바로 토글할 수 있습니다." />
          <div className="mt-5 space-y-3">
            <button
              className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left"
              onClick={() => setSettings((current) => ({ ...current, autoReply: !current.autoReply }))}
              type="button"
            >
              <div>
                <p className="font-semibold text-slate-900">FAQ 자동 응답</p>
                <p className="mt-1 text-sm text-slate-500">등록된 FAQ와 일치하면 먼저 자동 응답합니다.</p>
              </div>
              <StatusBadge label={settings.autoReply ? 'ON' : 'OFF'} tone={settings.autoReply ? 'emerald' : 'slate'} />
            </button>
            <button
              className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left"
              onClick={() => setSettings((current) => ({ ...current, notifyTeacher: !current.notifyTeacher }))}
              type="button"
            >
              <div>
                <p className="font-semibold text-slate-900">강사 알림</p>
                <p className="mt-1 text-sm text-slate-500">직접 확인이 필요한 질문은 강사에게 바로 알립니다.</p>
              </div>
              <StatusBadge label={settings.notifyTeacher ? 'ON' : 'OFF'} tone={settings.notifyTeacher ? 'emerald' : 'slate'} />
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      <Dialog
        open={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        title={editingFaq ? 'FAQ 수정' : 'FAQ 등록'}
        description="질문과 답변을 바로 저장하거나 수정할 수 있습니다."
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">질문</span>
          <input
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            onChange={(event) => setFaqDraft((current) => ({ ...current, question: event.target.value }))}
            value={faqDraft.question}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">답변</span>
          <textarea
            className="min-h-[140px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setFaqDraft((current) => ({ ...current, answer: event.target.value }))}
            value={faqDraft.answer}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">정렬 순서</span>
          <input
            className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
            onChange={(event) => setFaqDraft((current) => ({ ...current, sortOrder: event.target.value }))}
            type="number"
            value={faqDraft.sortOrder}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
            onClick={() => setFaqModalOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={saveFaq}
            type="button"
          >
            <Save className="h-4 w-4" />
            저장
          </button>
        </div>
      </Dialog>

      <Dialog
        open={answerModalOpen}
        onClose={() => setAnswerModalOpen(false)}
        title="질문 답변"
        description={answeringQuestion ? answeringQuestion.question : undefined}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">강사 답변</span>
          <textarea
            className="min-h-[160px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setAnswerDraft((current) => ({ ...current, teacherAnswer: event.target.value }))}
            value={answerDraft.teacherAnswer}
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900"
            onClick={() => setAnswerModalOpen(false)}
            type="button"
          >
            취소
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:translate-y-[-1px]"
            onClick={saveAnswer}
            type="button"
          >
            <Save className="h-4 w-4" />
            답변 저장
          </button>
        </div>
      </Dialog>
    </div>
  )
}
