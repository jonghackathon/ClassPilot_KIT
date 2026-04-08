import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  CircleHelp,
  Compass,
  MessageCircleQuestion,
  NotebookPen,
  Sparkles,
} from 'lucide-react'

import {
  ActionButton,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
} from '@/components/frontend/common'

export function StudentAttendancePage() {
  const records = [
    ['4/14 (월)', '결석', '출결 없음'],
    ['4/13 (일)', '출석', '14:00 입실'],
    ['4/8 (수)', '지각', '14:12 입실'],
    ['4/7 (화)', '출석', '13:58 입실'],
  ] as const

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 출결"
        title="이번 달 출결 흐름과 최근 기록을 한 눈에 확인해요"
        description="모바일 기준으로 상단에는 출석률과 달력을, 아래에는 최근 기록을 배치해 빠르게 읽을 수 있도록 구성했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">중등 수학 A반</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">출석률 80%</p>
          </div>
          <StatusBadge label="출석 8 · 지각 1 · 결석 1" tone="emerald" />
        </div>
        <div className="mt-5">
          <ProgressBar value={80} tone="indigo" />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">이전 달</button>
          <p className="text-sm font-semibold text-slate-800">2026년 4월</p>
          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">다음 달</button>
        </div>
        <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
          {Array.from({ length: 28 }).map((_, index) => (
            <div
              key={index}
              className={`rounded-2xl px-2 py-3 font-medium ${
                index === 7 || index === 8 || index === 12
                  ? 'bg-emerald-50 text-emerald-700'
                  : index === 9
                    ? 'bg-amber-50 text-amber-700'
                    : index === 15
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="최근 출결" />
        <div className="mt-5 space-y-3">
          {records.map((record) => (
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
    { title: '이차방정식 풀이', due: '마감 D-3', action: '이어서 작성', href: '/student/assignments/quadratic-1' },
    { title: '함수의 그래프 해석', due: '마감 D-7', action: '작성하기', href: '/student/assignments/function-graph' },
  ]

  const submitted = [
    { title: '일차함수 문제풀이', submittedAt: '4/5', feedback: '풀이 과정이 깔끔합니다. 3번 문제를 다시 확인해보세요.' },
    { title: '방정식 기초 연습', submittedAt: '3/28', feedback: '잘 했습니다!' },
  ]

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="내 과제"
        title="미제출 과제와 제출 완료 과제를 한 흐름으로 확인해요"
        description="작성 중인 과제는 바로 이어서 작성할 수 있고, 제출 완료 과제는 피드백과 함께 다시 확인할 수 있도록 구성했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="미제출 2건" tone="amber" />
          <StatusBadge label="제출 완료" tone="emerald" />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="미제출 과제" subtitle="지금 바로 이어서 제출할 수 있어요." />
        <div className="mt-5 space-y-3">
          {pending.map((item) => (
            <Link key={item.title} href={item.href} className="block rounded-[28px] border border-slate-200 bg-white px-5 py-5 transition hover:border-indigo-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
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
    </div>
  )
}

export function StudentAssignmentDetailPage() {
  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="과제 작성"
        title="이차방정식 풀이 과제를 작성하고 제출하는 화면"
        description="설명, 답안 작성 영역, 자동저장 상태, AI 사용 여부, 제출 버튼까지 하나의 스크롤 흐름으로 배치했습니다."
        backHref="/student/assignments"
        backLabel="과제 목록"
      />

      <SurfaceCard>
        <p className="text-sm font-medium text-amber-600">마감 4/11 (금) · D-3</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">이차방정식 풀이</h2>
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
          다음 이차방정식을 풀고 풀이 과정을 서술하세요. 1) x² + 3x - 4 = 0 2) 2x² - 5x + 2 = 0
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="내 답변" subtitle="자동저장과 수동 저장 흐름을 함께 보여줍니다." />
        <textarea
          className="mt-5 min-h-[260px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          defaultValue={'x² + 3x - 4 = 0 을 인수분해하면 (x + 4)(x - 1) = 0 이므로 x = -4, 1 입니다.\n\n2x² - 5x + 2 = 0 은 판별식을 사용하거나 인수분해할 수 있습니다.'}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>342자 · 자동저장 완료</p>
          <p>마지막 저장 20:30</p>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="AI 사용 여부" subtitle="사용했다면 간단히 메모를 남길 수 있어요." />
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge label="사용 안 함" tone="slate" />
          <StatusBadge label="사용함" tone="indigo" />
        </div>
        <textarea
          className="mt-4 min-h-[120px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
          defaultValue="리스트 정리 방식과 풀이 순서를 참고했습니다."
        />
        <div className="mt-5 flex flex-wrap gap-3">
          <ActionButton href="/student/assignments" label="임시저장" tone="slate" />
          <ActionButton href="/student/assignments" label="제출하기" tone="indigo" />
        </div>
      </SurfaceCard>
    </div>
  )
}

export function StudentReviewPage() {
  const items = [
    { status: '읽지 않음', title: '4/8 (수) 수업 요약', topic: '이차방정식의 활용', href: '/student/review/quadratic-20260408', tone: 'indigo' as const },
    { status: '읽지 않음', title: '4/7 (화) 수업 요약', topic: '이차방정식의 근', href: '/student/review/quadratic-20260407', tone: 'indigo' as const },
    { status: '읽음 · 퀴즈 2/3', title: '4/6 (월) 수업 요약', topic: '근의 공식', href: '/student/review/quadratic-20260406', tone: 'emerald' as const },
  ]

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 자료"
        title="읽지 않은 복습 자료부터 먼저 확인할 수 있도록 정리했어요"
        description="복습 자료는 읽음 상태와 퀴즈 진행 상태를 함께 보여주고, 상세 페이지에서 바로 퀴즈와 다음 수업 예습으로 이어집니다."
        backHref="/student/home"
        backLabel="홈으로"
        action={<ActionButton href="/student/qna" label="질문하기" tone="violet" />}
      />

      <div className="space-y-3">
        {items.map((item) => (
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
  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="복습 상세"
        title="4/8 (수) · 중등 수학 A반"
        description="핵심 요약을 먼저 읽고 퀴즈를 통해 이해를 확인한 뒤, 마지막에는 다음 수업 예습으로 자연스럽게 넘어가도록 구성했습니다."
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
        <SectionHeading title="복습 퀴즈 1 / 3" subtitle="선택지를 고르고 정답 확인 흐름으로 이어집니다." />
        <div className="mt-5 space-y-3">
          {[
            '① x(x+2) = 24',
            '② x(x-2) = 24',
            '③ 2x+2 = 24',
            '④ x²+2 = 24',
          ].map((choice, index) => (
            <div
              key={choice}
              className={`rounded-[24px] px-4 py-4 text-sm font-medium ${
                index === 0
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {choice}
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[28px] bg-emerald-50 px-5 py-5">
          <p className="text-lg font-semibold text-emerald-800">정답이에요!</p>
          <p className="mt-2 text-sm leading-7 text-emerald-700">
            세로를 x라 하면 가로는 x + 2이므로 x(x + 2) = 24가 됩니다.
          </p>
        </div>
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
    ['이차방정식에서 판별식이 0일 때 의미가 뭔가요?', 'AI 답변', '판별식이 0이면 중근을 가지며 그래프가 x축에 접합니다.'],
    ['숙제 3번 문제 풀이 방법을 모르겠어요.', '강사 답변', '먼저 좌변을 인수분해해 보세요. (x + 3)(x - 2) 형태가 됩니다.'],
    ['다음 시험 범위가 어디까지인가요?', '답변 대기', '답변 대기 중...'],
  ] as const

  return (
    <div className="space-y-4">
      <PageHero
        eyebrow="질문하기"
        title="수업 중 막힌 내용을 바로 질문하고 답변 이력을 확인해요"
        description="질문은 반 단위로 연결되고, AI 답변과 강사 직접 답변을 같은 흐름 안에서 비교해 볼 수 있도록 구성했습니다."
        backHref="/student/home"
        backLabel="홈으로"
      />

      <SurfaceCard>
        <div className="space-y-3">
          <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">중등 수학 A반</div>
          <textarea
            className="min-h-[140px] w-full rounded-[28px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 outline-none"
            defaultValue="궁금한 점을 입력하세요..."
          />
          <ActionButton href="/student/qna" label="질문 보내기" tone="indigo" />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="내 질문 내역" subtitle="최신 질문이 위에 보입니다." />
        <div className="mt-5 space-y-3">
          {history.map((item) => (
            <div key={item[0]} className="rounded-[28px] bg-slate-50 px-5 py-5">
              <p className="font-semibold text-slate-900">{item[0]}</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge
                  label={item[1]}
                  tone={item[1] === 'AI 답변' ? 'violet' : item[1] === '강사 답변' ? 'indigo' : 'amber'}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item[2]}</p>
              <div className="mt-4 flex gap-2">
                <StatusBadge label="도움됐어요" tone="emerald" />
                <StatusBadge label="아직 어려워요" tone="rose" />
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}
