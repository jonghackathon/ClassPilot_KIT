'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bell,
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  Home,
  NotebookPen,
} from 'lucide-react'

const navigation = [
  { href: '/student/home', label: '홈', icon: Home },
  { href: '/student/attendance', label: '출결', icon: CalendarCheck2 },
  { href: '/student/assignments', label: '과제', icon: NotebookPen },
  { href: '/student/review', label: '복습', icon: BookOpen },
]

const notifications = [
  { title: '과제 마감 D-3', detail: '이차방정식 풀이 과제를 오늘 이어서 작성하면 좋아요.' },
  { title: '새 복습 자료 도착', detail: '4월 8일 수업 요약과 퀴즈 3문제가 추가됐어요.' },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [alarmOpen, setAlarmOpen] = useState(false)

  const displayName = session?.user?.name?.replace(/님$/, '') ?? '민수'

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(new Date()),
    [],
  )

  useEffect(() => {
    setAlarmOpen(false)
  }, [pathname])

  return (
    <div
      className="min-h-screen bg-transparent"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6.5rem)' }}
    >
      <div className="mx-auto max-w-[680px] px-4 pt-4">
        <header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">AcadeMind</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-950">{displayName}님의 학습 홈</p>
                  <p className="text-sm leading-6 text-slate-500">
                    오늘 해야 할 일부터 바로 확인해요
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200 sm:min-w-[170px] sm:flex-none">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{todayLabel}</p>
              </div>
              <button
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-sky-200 hover:text-sky-600"
                onClick={() => setAlarmOpen((current) => !current)}
                type="button"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-sky-500" />
              </button>

              {alarmOpen ? (
                <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:w-[320px]">
                  <p className="text-sm font-semibold text-slate-900">알림</p>
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
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[640px] px-1 pb-4 pt-6">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[720px] px-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
        <div className="glass-panel mx-auto grid grid-cols-4 rounded-[28px] border border-white/65 p-2 shadow-2xl">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-[22px] px-3 py-3 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-500 hover:text-slate-900'
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
