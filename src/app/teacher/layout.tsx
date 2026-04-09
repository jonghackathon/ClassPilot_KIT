'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Bot,
  BookCheck,
  BookOpenText,
  CircleUserRound,
  GraduationCap,
  HeartPulse,
  LogOut,
  Mic2,
  NotebookPen,
  Settings2,
  Sparkles,
} from 'lucide-react'

const navigation = [
  { href: '/teacher/dashboard', label: '홈', icon: GraduationCap },
  { href: '/teacher/attendance', label: '출결', icon: BookCheck },
  { href: '/teacher/assignments', label: '과제', icon: NotebookPen },
  { href: '/teacher/copilot', label: '코파일럿', icon: Sparkles },
  { href: '/teacher/recording', label: '녹음 정리', icon: Mic2 },
  { href: '/teacher/bot', label: '질문봇', icon: Bot },
  { href: '/teacher/churn', label: '이탈 현황', icon: HeartPulse },
  { href: '/teacher/progress', label: '진도', icon: BookOpenText },
]

const notifications = [
  { title: '중급 A반 출결 입력 전', detail: '14:00 수업 시작 10분 전입니다. 출결 화면을 먼저 열어두면 좋아요.' },
  { title: '과제 피드백 대기', detail: 'Python 반복문 실습 과제에서 4명의 피드백이 아직 대기 중입니다.' },
]

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const displayName = session?.user?.name ?? '박강사'
  const displayEmail = session?.user?.email ?? 'teacher@academind.kr'

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      }).format(new Date()),
    [],
  )

  useEffect(() => {
    setAlarmOpen(false)
    setProfileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">
        <header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">AcadeMind Teacher</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                수업 흐름이 끊기지 않도록 설계된 강사 워크스페이스
              </h1>
              <p className="mt-2 text-sm text-slate-500">오늘 일정과 피드백 대기 흐름을 한 곳에서 볼 수 있어요.</p>
            </div>

            <div className="relative flex items-center gap-3 self-start lg:self-auto">
              <div className="hidden rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 sm:block">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Today</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">중급 A반 · {todayLabel}</p>
              </div>
              <button
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-violet-200 hover:text-violet-600"
                onClick={() => {
                  setAlarmOpen((current) => !current)
                  setProfileOpen(false)
                }}
                type="button"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-amber-500" />
              </button>
              <button
                className="flex h-11 items-center gap-3 rounded-2xl bg-slate-950 px-4 text-white"
                onClick={() => {
                  setProfileOpen((current) => !current)
                  setAlarmOpen(false)
                }}
                type="button"
              >
                <CircleUserRound className="h-5 w-5" />
                <span className="hidden text-sm font-semibold sm:inline">{displayName}</span>
              </button>

              {alarmOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
                  <p className="text-sm font-semibold text-slate-900">수업 알림</p>
                  <div className="mt-4 space-y-3">
                    {notifications.map((item) => (
                      <div key={item.title} className="rounded-2xl bg-slate-50 px-4 py-4">
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {profileOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[260px] rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
                  <div className="rounded-[24px] bg-violet-600 px-4 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.22em] text-violet-100">Teacher</p>
                    <p className="mt-2 text-lg font-semibold">{displayName}</p>
                    <p className="mt-2 text-sm text-violet-100">{displayEmail}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link href="/teacher/dashboard" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                      <GraduationCap className="h-4 w-4" />
                      강사 홈
                    </Link>
                    <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900" type="button">
                      <Settings2 className="h-4 w-4" />
                      수업 알림 설정
                    </button>
                    <button
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                      onClick={handleLogout}
                      type="button"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <nav className="mt-5 hidden gap-2 overflow-x-auto pb-1 md:flex">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-white/80 text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto max-w-[1200px] py-6">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/90 px-4 pb-4 pt-3 backdrop-blur md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
        <div className="mx-auto grid max-w-[560px] grid-cols-4 gap-2 rounded-[28px] bg-slate-950 p-2 text-white shadow-2xl shadow-slate-900/15">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-[22px] px-2 py-3 text-[11px] font-medium transition ${
                  isActive ? 'bg-white text-slate-950' : 'text-slate-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
