import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  NotebookPen,
  Sparkles,
} from 'lucide-react'

export default function Page() {
  return (
    <div className="space-y-4">
      <section className="surface-card overflow-hidden rounded-[32px] border border-white/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-sky-600">오늘 수업</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              중등 수학 A반
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              14:00 - 15:30 · 이차방정식의 활용
            </p>
          </div>
          <div className="w-full rounded-3xl bg-slate-950 px-4 py-4 text-left text-white sm:w-auto sm:text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Room</p>
            <p className="mt-1 text-lg font-semibold">3강의실</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <Link href="/student/review" className="block">
          <article className="surface-card rounded-[30px] border border-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-2xl bg-violet-50 p-3 text-violet-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">복습 자료가 도착했어요</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  오늘 수업 핵심 개념이 3분 요약 카드와 퀴즈로 정리되어 있어요.
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </article>
        </Link>

        <Link href="/student/assignments/quadratic-1" className="block">
          <article className="surface-card rounded-[30px] border border-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-2xl bg-amber-50 p-3 text-amber-600">
                  <NotebookPen className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-slate-950">제출할 과제</h2>
                <p className="mt-2 text-sm text-slate-600">이차방정식 풀이 과제 · 마감 D-3</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  지금 작성하면 오늘 배운 내용과 바로 연결돼요
                </p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </article>
        </Link>
      </section>

      <Link href="/student/attendance" className="block">
        <section className="surface-card rounded-[32px] border border-white/70 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">이번 달 출석률</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">80%</p>
            </div>
            <div className="w-full rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 sm:w-auto">
              출석 8 · 지각 1 · 결석 1
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-3 py-4">
              <CalendarDays className="mx-auto h-4 w-4 text-sky-500" />
              <p className="mt-2 text-sm font-medium text-slate-700">이번 주 수업</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">3회</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-4">
              <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
              <p className="mt-2 text-sm font-medium text-slate-700">완료한 과제</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">12건</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-3 py-4">
              <BookOpen className="mx-auto h-4 w-4 text-violet-500" />
              <p className="mt-2 text-sm font-medium text-slate-700">복습 기록</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">5일</p>
            </div>
          </div>
        </section>
      </Link>

      <Link href="/student/qna" className="block">
        <section className="surface-card rounded-[30px] border border-white/70 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-2xl bg-sky-50 p-3 text-sky-600">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">질문하기</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                복습하거나 과제를 하다가 막히면 바로 질문 내역으로 이어질 수 있어요.
              </p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
          </div>
        </section>
      </Link>
    </div>
  )
}
