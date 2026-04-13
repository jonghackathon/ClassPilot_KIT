'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  MessageCircleQuestion,
  NotebookPen,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'

import {
  ActionButton,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const tabButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

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
      <div className="mx-auto max-h-full w-full max-w-[520px] overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Student Flow</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function StudentAttendancePage() {
  const monthLabels = ['2026년 3월', '2026년 4월', '2026년 5월']
  const monthSummaries = [
    { attendanceRate: 86, badge: '출석 9 · 지각 1 · 결석 0', records: [['3/28 (금)', '출석', '14:00 입실'], ['3/21 (금)', '출석', '14:02 입실']] as const },
    { attendanceRate: 80, badge: '출석 8 · 지각 1 · 결석 1', records: [['4/14 (월)', '결석', '출결 없음'], ['4/13 (일)', '출석', '14:00 입실'], ['4/8 (수)', '지각', '14:12 입실'], ['4/7 (화)', '출석', '13:58 입실']] as const },
    { attendanceRate: 92, badge: '출석 11 · 지각 0 · 결석 0', records: [['5/05 (월)', '출석', '13:56 입실'], ['5/03 (토)', '출석', '14:01 입실']] as const },
  ]
  const [monthIndex, setMonthIndex] = useState(1)
  const currentMonth = monthSummaries[monthIndex]

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 출결"
        title="이번 달 출결 흐름과 최근 기록을 한 눈에 확인해요"
        description="월 이동 버튼과 최근 기록을 함께 배치해서, 수강생이 이전달과 이번달 흐름을 바로 비교할 수 있게 구성했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">중등 수학 A반</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">출석률 {currentMonth.attendanceRate}%</p>
          </div>
          <StatusBadge label={currentMonth.badge} tone="emerald" />
        </div>
        <div className="mt-5">
          <ProgressBar value={currentMonth.attendanceRate} tone="indigo" />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center justify-between gap-3">
          <button className={secondaryButton} disabled={monthIndex === 0} onClick={() => setMonthIndex((current) => Math.max(0, current - 1))} type="button">
            <ChevronLeft className="h-4 w-4" />
            이전 달
          </button>
          <p className="text-sm font-semibold text-slate-800">{monthLabels[monthIndex]}</p>
          <button className={secondaryButton} disabled={monthIndex === monthLabels.length - 1} onClick={() => setMonthIndex((current) => Math.min(monthLabels.length - 1, current + 1))} type="button">
            다음 달
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
          {Array.from({ length: 28 }).map((_, index) => (
            <div
              key={index}
              className={cx(
                'rounded-2xl px-2 py-3 font-medium',
                index === 7 || index === 8 || index === 12
                  ? 'bg-emerald-50 text-emerald-700'
                  : index === 9
                    ? 'bg-amber-50 text-amber-700'
                    : index === 15
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200',
              )}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="최근 출결" />
        <div className="mt-5 space-y-3">
          {currentMonth.records.map((record) => (
            <div key={record[0]} className="rounded-2xl bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{record[0]}</p>
                  <p className="mt-1 text-sm text-slate-500">{record[2]}</p>
                </div>
                <StatusBadge
                  label={record[1]}
                  tone={record[1] === '출석' ? 'emerald' : record[1] === '지각' ? 'amber' : 'rose'}
                />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export function StudentAssignmentsPage() {
  const pending = [
    { title: '이차방정식 풀이', due: '마감 D-3', action: '이어서 작성', href: '/student/assignments/quadratic-1', draft: true },
    { title: '함수의 그래프 해석', due: '마감 D-7', action: '작성하기', href: '/student/assignments/function-graph', draft: false },
  ]
  const submitted = [
    { title: '일차함수 문제풀이', submittedAt: '4/5', feedback: '풀이 과정이 깔끔합니다. 3번 문제를 다시 확인해보세요.' },
    { title: '방정식 기초 연습', submittedAt: '3/28', feedback: '잘 했습니다!' },
  ]
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending')

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 과제"
        title="미제출 과제와 제출 완료 과제를 한 흐름으로 확인해요"
        description="상단 탭으로 바로 전환하고, 작성 중인 과제는 임시저장 상태까지 확인할 수 있도록 정리했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <button className={cx(tabButton, activeTab === 'pending' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setActiveTab('pending')} type="button">
            미제출 {pending.length}건
          </button>
          <button className={cx(tabButton, activeTab === 'submitted' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setActiveTab('submitted')} type="button">
            제출 완료
          </button>
        </div>
      </SurfaceCard>

      {activeTab === 'pending' ? (
        <SurfaceCard>
          <SectionHeading title="미제출 과제" subtitle="지금 바로 이어서 제출할 수 있어요." />
          <div className="mt-5 space-y-3">
            {pending.map((item) => (
              <Link key={item.title} href={item.href} className="block rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      {item.draft ? <StatusBadge label="임시저장 있음" tone="amber" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-500">중등 수학 A반</p>
                    <p className="mt-2 text-sm font-medium text-amber-600">{item.due}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-medium text-indigo-600">{item.action}</p>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'submitted' ? (
        <SurfaceCard>
          <SectionHeading title="제출 완료" subtitle="선생님 피드백과 함께 다시 확인할 수 있어요." />
          <div className="mt-5 space-y-3">
            {submitted.map((item) => (
              <div key={item.title} className="rounded-[28px] bg-slate-50 px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <StatusBadge label={`제출 ${item.submittedAt}`} tone="emerald" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.feedback}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  )
}

export function StudentAssignmentDetailPage() {
  const [answer, setAnswer] = useState(
    'x² + 3x - 4 = 0 을 인수분해하면 (x + 4)(x - 1) = 0 이므로 x = -4, 1 입니다.\n\n2x² - 5x + 2 = 0 은 판별식을 사용하거나 인수분해할 수 있습니다.',
  )
  const [aiUsed, setAiUsed] = useState<'used' | 'unused'>('used')
  const [aiNote, setAiNote] = useState('리스트 정리 방식과 풀이 순서를 참고했습니다.')
  const [saveStatus, setSaveStatus] = useState('자동저장 완료')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="과제 작성"
        title="이차방정식 풀이 과제를 작성하고 제출하는 화면"
        description="자동저장 상태, AI 사용 여부, 제출 확인 모달까지 실제 작성 흐름처럼 이어지도록 구성했습니다."
        backHref="/student/assignments"
        backLabel="과제 목록"
      />

      {submitted ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">과제가 제출되었어요.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">이제 제출 완료 탭에서 피드백을 기다리면 됩니다.</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <p className="text-sm font-medium text-amber-600">마감 4/11 (금) · D-3</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">이차방정식 풀이</h2>
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          다음 이차방정식을 풀고 풀이 과정을 서술하세요. 1) x² + 3x - 4 = 0 2) 2x² - 5x + 2 = 0
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="내 답변" subtitle="입력 중 상태와 자동저장 상태를 함께 보여줍니다." />
        <textarea
          className="mt-5 min-h-[260px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          onBlur={() => setSaveStatus('자동저장 완료')}
          onChange={(event) => {
            setAnswer(event.target.value)
            setSaveStatus('입력 중...')
          }}
          value={answer}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>{answer.length}자 · {saveStatus}</p>
          <p>마지막 저장 20:30</p>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="AI 사용 여부" subtitle="사용했다면 간단히 메모를 남길 수 있어요." />
        <div className="mt-5 flex flex-wrap gap-2">
          <button className={cx(tabButton, aiUsed === 'unused' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setAiUsed('unused')} type="button">
            사용 안 함
          </button>
          <button className={cx(tabButton, aiUsed === 'used' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setAiUsed('used')} type="button">
            사용함
          </button>
        </div>
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          onChange={(event) => setAiNote(event.target.value)}
          value={aiNote}
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <button className={secondaryButton} onClick={() => setSaveStatus('임시저장 완료')} type="button">
            임시저장
          </button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setSubmitOpen(true)} type="button">
            제출하기
          </button>
        </div>
      </SurfaceCard>

      <OverlayPanel
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        title="과제 제출 확인"
        description="제출 전 답변 길이와 AI 사용 메모를 다시 한 번 확인합니다."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusBadge label={`답변 ${answer.length}자`} tone="indigo" />
          <StatusBadge label={aiUsed === 'used' ? 'AI 사용 메모 있음' : 'AI 사용 안 함'} tone={aiUsed === 'used' ? 'violet' : 'slate'} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setSubmitOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => { setSubmitted(true); setSubmitOpen(false) }} type="button">제출 완료</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function StudentReviewPage() {
  const items = [
    { status: '읽지 않음', title: '4/8 (수) 수업 요약', topic: '이차방정식의 활용', href: '/student/review/quadratic-20260408', tone: 'indigo' as Tone },
    { status: '읽지 않음', title: '4/7 (화) 수업 요약', topic: '이차방정식의 근', href: '/student/review/quadratic-20260407', tone: 'indigo' as Tone },
    { status: '읽음 · 퀴즈 2/3', title: '4/6 (월) 수업 요약', topic: '근의 공식', href: '/student/review/quadratic-20260406', tone: 'emerald' as Tone },
  ]
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')
  const filteredItems = useMemo(
    () => items.filter((item) => (filter === 'all' ? true : item.status.includes('읽지 않음'))),
    [filter],
  )

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 자료"
        title="읽지 않은 복습 자료부터 먼저 확인할 수 있도록 정리했어요"
        description="읽음 상태 필터를 붙여서, 바로 다음 복습 자료로 넘어가는 흐름이 더 자연스럽게 이어지도록 했습니다."
        backHref="/student/home"
        backLabel="홈으로"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <button className={cx(tabButton, filter === 'unread' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setFilter('unread')} type="button">
            읽지 않음 우선
          </button>
          <button className={cx(tabButton, filter === 'all' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setFilter('all')} type="button">
            전체 보기
          </button>
        </div>
      </SurfaceCard>

      <div className="space-y-3">
        {filteredItems.map((item) => (
          <Link key={item.title} href={item.href} className="block">
            <SurfaceCard>
              <StatusBadge label={item.status} tone={item.tone} />
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-500">중등 수학 A반 · {item.topic}</p>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                확인하기
                <ArrowRight className="h-4 w-4" />
              </p>
            </SurfaceCard>
          </Link>
        ))}
      </div>

      <SurfaceCard>
        <div className="flex items-start gap-3">
          <MessageCircleQuestion className="mt-1 h-5 w-5 text-violet-500" />
          <div>
            <p className="font-semibold text-slate-900">복습하다 막히면 바로 질문해도 괜찮아요</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              질문하기는 홈이나 복습 상세에서 이어지는 보조 흐름으로 설계했습니다.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

export function StudentReviewDetailPage() {
  const questions = [
    {
      question: '직사각형의 넓이가 24이고 가로가 세로보다 2 크면 식은 무엇일까요?',
      choices: ['① x(x+2) = 24', '② x(x-2) = 24', '③ 2x+2 = 24', '④ x²+2 = 24'],
      correctIndex: 0,
      explanation: '세로를 x라 하면 가로는 x + 2이므로 x(x + 2) = 24가 됩니다.',
    },
    {
      question: '판별식이 0이면 근은 어떻게 되나요?',
      choices: ['① 서로 다른 두 근', '② 중근', '③ 허근만 존재', '④ 해가 없음'],
      correctIndex: 1,
      explanation: '판별식이 0이면 두 근이 같아지는 중근입니다.',
    },
    {
      question: '해를 구한 뒤 마지막으로 꼭 해야 하는 것은?',
      choices: ['① 식을 지우기', '② 정답 암기만 하기', '③ 문제 조건에 맞는지 검산하기', '④ 다음 문제로 바로 넘어가기'],
      correctIndex: 2,
      explanation: '실생활 문제는 구한 해가 문제 조건에 맞는지 검산하는 과정이 중요합니다.',
    },
  ]
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const currentQuestion = questions[questionIndex]
  const isLastQuestion = questionIndex === questions.length - 1

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 상세"
        title="4/8 (수) · 중등 수학 A반"
        description="핵심 요약을 읽고 퀴즈를 풀고, 다음 문제 또는 다음 수업 예습으로 이어지는 흐름을 자연스럽게 구성했습니다."
        backHref="/student/review"
        backLabel="복습 목록"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <SurfaceCard>
        <SectionHeading title="오늘 배운 핵심" />
        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
          <p>1. 이차방정식의 근을 실생활 문제에 적용하는 방법</p>
          <p>2. 넓이, 거리 문제를 방정식으로 세우는 과정</p>
          <p>3. 해가 문제의 조건에 맞는지 검증하는 방법</p>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title={`복습 퀴즈 ${questionIndex + 1} / ${questions.length}`} subtitle={currentQuestion.question} />
        <div className="mt-5 space-y-3">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={choice}
              className={cx(
                'w-full rounded-[24px] px-4 py-4 text-left text-sm font-medium',
                selectedChoice === index
                  ? checked && index === currentQuestion.correctIndex
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => {
                setSelectedChoice(index)
                setChecked(false)
              }}
              type="button"
            >
              {choice}
            </button>
          ))}
        </div>
        {checked ? (
          <div className="mt-5 rounded-[28px] bg-emerald-50 px-5 py-5">
            <p className="text-lg font-semibold text-emerald-800">정답이에요!</p>
            <p className="mt-2 text-sm leading-7 text-emerald-700">{currentQuestion.explanation}</p>
          </div>
        ) : (
          <button
            className={cx(
              primaryButton,
              'mt-5 bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            )}
            disabled={selectedChoice === null}
            onClick={() => setChecked(true)}
            type="button"
          >
            정답 확인
          </button>
        )}
        {checked ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {!isLastQuestion ? (
              <button
                className={secondaryButton}
                onClick={() => {
                  setQuestionIndex((current) => current + 1)
                  setSelectedChoice(null)
                  setChecked(false)
                }}
                type="button"
              >
                다음 문제
              </button>
            ) : (
              <StatusBadge label="퀴즈 완료" tone="emerald" />
            )}
          </div>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="다음 수업 예습" />
        <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
          <p className="text-sm font-medium text-slate-300">다음 수업 주제</p>
          <p className="mt-2 text-2xl font-semibold">이차함수의 그래프</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
            <li>y = ax² 기본 형태</li>
            <li>꼭짓점과 축의 의미</li>
          </ul>
        </div>
      </SurfaceCard>
    </div>
  )
}

export function StudentQnaPage() {
  const history = [
    {
      id: 1,
      question: '이차방정식에서 판별식이 0일 때 의미가 뭔가요?',
      source: 'AI 답변',
      answer: '판별식이 0이면 중근을 가지며 그래프가 x축에 접합니다.',
      status: 'answered',
    },
    {
      id: 2,
      question: '숙제 3번 문제 풀이 방법을 모르겠어요.',
      source: '강사 답변',
      answer: '먼저 좌변을 인수분해해 보세요. (x + 3)(x - 2) 형태가 됩니다.',
      status: 'answered',
    },
    {
      id: 3,
      question: '다음 시험 범위가 어디까지인가요?',
      source: '답변 대기',
      answer: '답변 대기 중...',
      status: 'waiting',
    },
  ]
  const [selectedClass, setSelectedClass] = useState('중등 수학 A반')
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down' | null>>({})

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="질문하기"
        title="수업 중 막힌 내용을 바로 질문하고 답변 이력을 확인해요"
        description="반 선택, 질문 입력, 답변 피드백까지 이어서 볼 수 있게 구성했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      {submitted ? (
        <SurfaceCard className="border border-indigo-100 bg-indigo-50/80">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-indigo-600" />
            <div>
              <p className="font-semibold text-indigo-900">질문이 등록되었어요.</p>
              <p className="mt-1 text-sm leading-6 text-indigo-700">AI 답변이 먼저 오거나, 필요하면 선생님 답변으로 이어집니다.</p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="space-y-3">
          <select className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none" onChange={(event) => setSelectedClass(event.target.value)} value={selectedClass}>
            <option>중등 수학 A반</option>
            <option>중등 영어 B반</option>
            <option>국어 A반</option>
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
                primaryButton,
                'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50',
              )}
              disabled={!question.trim()}
              onClick={() => {
                setSubmitted(true)
                setQuestion('')
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
        <SectionHeading title="질문 이력" subtitle={`${selectedClass} 기준`} />
        <div className="mt-5 space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-[28px] bg-slate-50 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge label={item.source} tone={item.source === 'AI 답변' ? 'violet' : item.status === 'waiting' ? 'amber' : 'emerald'} />
                {item.status === 'waiting' ? <StatusBadge label="답변 대기" tone="amber" /> : null}
              </div>
              <p className="mt-4 font-semibold text-slate-900">{item.question}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
              {item.status === 'answered' ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className={cx(tabButton, feedback[item.id] === 'up' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setFeedback((current) => ({ ...current, [item.id]: current[item.id] === 'up' ? null : 'up' }))} type="button">
                    <ThumbsUp className="mr-1 inline h-4 w-4" />
                    도움 됐어요
                  </button>
                  <button className={cx(tabButton, feedback[item.id] === 'down' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200')} onClick={() => setFeedback((current) => ({ ...current, [item.id]: current[item.id] === 'down' ? null : 'down' }))} type="button">
                    <ThumbsDown className="mr-1 inline h-4 w-4" />
                    다시 설명 필요
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
