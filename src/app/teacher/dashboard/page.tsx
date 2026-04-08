import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  CalendarClock,
  ClipboardCheck,
  MessageSquareDot,
  Mic2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

const stats = [
  { label: '오늘 수업', value: '2반', icon: CalendarClock, tone: 'bg-sky-50 text-sky-600' },
  { label: '미체크 출결', value: '0명', icon: ClipboardCheck, tone: 'bg-emerald-50 text-emerald-600' },
  { label: '미제출 과제', value: '2건', icon: Mic2, tone: 'bg-amber-50 text-amber-600' },
  { label: '미답변 질문', value: '3건', icon: MessageSquareDot, tone: 'bg-violet-50 text-violet-600' },
]

const lessons = [
  {
    time: '14:00 - 15:30',
    title: '중급 A반',
    topic: 'Python 반복문과 리스트 컴프리헨션',
  },
  {
    time: '16:00 - 17:30',
    title: '초급 B반',
    topic: 'HTML/CSS 기초 레이아웃',
  },
]

const questions = [
  {
    student: '이지은',
    className: '중급 A반',
    question: 'for문에서 range(1, 10)이면 10은 포함 안 되나요?',
    status: 'AI 초안 있음',
  },
  {
    student: '박준호',
    className: '초급 B반',
    question: 'CSS에서 margin과 padding 차이가 뭔가요?',
    status: 'AI 응답 없음',
  },
  {
    student: '최서연',
    className: '초급 B반',
    question: '변수 이름에 한글을 써도 되나요?',
    status: 'AI 응답 없음',
  },
]

const churn = [
  { name: '김하늘', className: '초급 B반', score: '82%', reason: '출석률 하락 · 과제 미제출 3회' },
  { name: '정우진', className: '중급 A반', score: '54%', reason: '질문 감소 · 최근 지각 2회' },
]

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="surface-card rounded-[32px] border border-white/70 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-600">강사 홈</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              안녕하세요, 김민수 강사님.
              <br />
              오늘은 수업 두 반과 질문 세 건이 기다리고 있어요.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              출결 입력, 코파일럿 시작, 질문 확인이 자연스럽게 이어지도록 수업
              전중후 흐름을 전면에 배치했습니다.
            </p>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Next Action</p>
            <p className="mt-2 text-xl font-semibold">14:00 중급 A반 출결 확인</p>
            <p className="mt-2 text-sm text-slate-300">수업 시작 전 코파일럿 세션 준비 권장</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              href={
                stat.label === '오늘 수업' || stat.label === '미체크 출결'
                  ? '/teacher/attendance'
                  : stat.label === '미제출 과제'
                    ? '/teacher/assignments'
                    : '/teacher/bot'
              }
              className="block"
            >
              <article className="surface-card rounded-[28px] border border-white/70 p-5">
                <div className={`inline-flex rounded-2xl p-3 ${stat.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
              </article>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="surface-card rounded-[32px] border border-white/70 p-6">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-sky-500" />
            <h2 className="text-2xl font-semibold text-slate-950">오늘 수업</h2>
          </div>

          <div className="mt-6 space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.time}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-sky-600">{lesson.time}</p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">{lesson.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.topic}</p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[170px]">
                    <Link href="/teacher/attendance" className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white">
                      <ClipboardCheck className="h-4 w-4" />
                      출결 입력
                    </Link>
                    <Link href="/teacher/copilot/lesson-1" className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 ring-1 ring-violet-100">
                      <Sparkles className="h-4 w-4" />
                      AI 코파일럿 시작
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-card rounded-[32px] border border-white/70 p-6">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              <h2 className="text-2xl font-semibold text-slate-950">미답변 질문</h2>
            </div>
            <div className="mt-5 space-y-3">
              {questions.map((question) => (
                <Link key={question.question} href="/teacher/bot" className="block rounded-[24px] bg-slate-50 px-4 py-4">
                  <p className="font-medium leading-6 text-slate-900">{question.question}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {question.student} · {question.className}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {question.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="surface-card rounded-[32px] border border-white/70 p-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              <h2 className="text-2xl font-semibold text-slate-950">담당반 이탈 위험</h2>
            </div>
            <div className="mt-5 space-y-3">
              {churn.map((student) => (
                <Link
                  key={student.name}
                  href="/teacher/churn"
                  className="block rounded-[24px] border border-rose-100 bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.className}</p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-sm font-semibold text-rose-700">
                      {student.score}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{student.reason}</p>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
