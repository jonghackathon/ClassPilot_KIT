import Link from 'next/link'
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarClock,
  CircleDollarSign,
  Clock3,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'

const stats = [
  {
    label: '전체 수강생',
    value: '87명',
    change: '이번 달 +5',
    icon: Users,
    tone: 'from-indigo-600 to-indigo-500',
  },
  {
    label: '오늘 수업',
    value: '12반',
    change: '현재 4반 진행 중',
    icon: CalendarClock,
    tone: 'from-sky-500 to-cyan-500',
  },
  {
    label: '미납 수강료',
    value: '₩450,000',
    change: '3건 확인 필요',
    icon: CircleDollarSign,
    tone: 'from-amber-500 to-orange-500',
  },
  {
    label: '이탈 위험',
    value: '2명',
    change: '상담 우선 필요',
    icon: ShieldAlert,
    tone: 'from-rose-500 to-red-500',
  },
]

const riskStudents = [
  { name: '김민수', group: '수학 A반', risk: '82%', reason: '출결 하락, 과제 미제출 3회' },
  { name: '이서연', group: '영어 B반', risk: '64%', reason: '질문 감소, 상담 후속 필요' },
  { name: '정도윤', group: '국어 A반', risk: '55%', reason: '결제 지연, 집중도 하락' },
]

const todayClasses = [
  { time: '14:00', title: '수학 A반', status: '3/8 출석 체크', room: '3강의실' },
  { time: '15:00', title: '영어 B반', status: '5/6 출석 체크', room: '2강의실' },
  { time: '17:00', title: '국어 A반', status: '4/5 출석 체크', room: '1강의실' },
]

const assignments = [
  { title: '단원평가 3', group: '수학 A반', due: '4월 7일', pending: '2명 미제출' },
  { title: 'Essay Draft', group: '영어 B반', due: '4월 8일', pending: '3명 미제출' },
  { title: '독후감 초안', group: '국어 A반', due: '4월 9일', pending: '1명 미제출' },
]

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="surface-card overflow-hidden rounded-[32px] border border-white/70 p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">운영 요약</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              오늘 학원 흐름은 안정적이지만,
              <br className="hidden sm:block" />
              두 명의 이탈 위험 학생은 바로 보는 편이 좋습니다.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              대시보드에서 위험 신호를 먼저 확인하고, 이후 학생 상세와 반별
              진행 상황으로 자연스럽게 드릴다운할 수 있게 구성했습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">출석률</p>
              <p className="mt-2 text-2xl font-semibold">92%</p>
            </div>
            <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">민원</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">4건</p>
            </div>
            <div className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">상담 예정</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">6명</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <Link
              key={stat.label}
              href={
                stat.label === '전체 수강생'
                  ? '/admin/students'
                  : stat.label === '오늘 수업'
                    ? '/admin/schedule'
                    : stat.label === '미납 수강료'
                      ? '/admin/payments'
                      : '/admin/churn'
              }
              className="block"
            >
              <article className="surface-card rounded-[28px] border border-white/70 p-5">
                <div className={`inline-flex rounded-2xl bg-gradient-to-br ${stat.tone} p-3 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-5 text-sm text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {stat.value}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{stat.change}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              </article>
            </Link>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-card rounded-[32px] border border-white/70 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600">이탈 위험 학생</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                우선 대응이 필요한 학생
              </h2>
            </div>
            <div className="rounded-2xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
              오늘 업데이트됨
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {riskStudents.map((student) => (
              <Link
                key={student.name}
                href="/admin/students"
                className="block rounded-[26px] border border-rose-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                      <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {student.group}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{student.reason}</p>
                  </div>

                  <div className="min-w-[140px] rounded-2xl bg-rose-50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-rose-400">Risk</p>
                    <p className="mt-1 text-2xl font-semibold text-rose-700">{student.risk}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-card rounded-[32px] border border-white/70 p-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-sky-500" />
              <h2 className="text-xl font-semibold text-slate-950">오늘 수업 현황</h2>
            </div>
            <div className="mt-5 space-y-3">
              {todayClasses.map((lesson) => (
                <Link key={lesson.time} href="/admin/classes" className="block rounded-[24px] bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{lesson.title}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {lesson.time}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{lesson.status}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {lesson.room}
                  </p>
                </Link>
              ))}
            </div>
          </article>

          <article className="surface-card rounded-[32px] border border-white/70 p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <h2 className="text-xl font-semibold text-slate-950">미제출 과제 현황</h2>
            </div>
            <div className="mt-5 space-y-3">
              {assignments.map((item) => (
                <Link
                  key={`${item.group}-${item.title}`}
                  href="/admin/classes"
                  className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.group}</p>
                  <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                    <span>{item.due}</span>
                    <span>{item.pending}</span>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
