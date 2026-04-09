'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareWarning,
  Search,
  Settings2,
  UserRound,
  Users,
  UserSquare2,
  X,
} from 'lucide-react'

const navigation = [
  { href: '/admin/dashboard', label: '대시보드', icon: LayoutGrid },
  { href: '/admin/students', label: '학생 관리', icon: Users },
  { href: '/admin/teachers', label: '강사 관리', icon: UserSquare2 },
  { href: '/admin/classes', label: '반 관리', icon: BookOpen },
  { href: '/admin/schedule', label: '시간표', icon: CalendarDays },
  { href: '/admin/payments', label: '수강료', icon: CircleDollarSign },
  { href: '/admin/churn', label: '이탈 예측', icon: AlertTriangle },
  { href: '/admin/complaints', label: '민원 관리', icon: MessageSquareWarning },
]

const notifications = [
  { title: '미납 확인 필요', detail: '김민수 학부모님 4월 수강료가 아직 미납 상태입니다.' },
  { title: '민원 응답 대기', detail: '수업 시간 변경 요청 1건이 응답 대기 중입니다.' },
  { title: '위험 학생 상승', detail: '이서연 학생의 이탈 위험도가 이번 주에 상승했습니다.' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

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
    setMobileNavOpen(false)
    setAlarmOpen(false)
    setProfileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1480px] gap-6 px-4 py-4 lg:px-6">
        <aside className="glass-panel sticky top-4 hidden h-[calc(100vh-2rem)] w-[280px] shrink-0 rounded-[30px] border border-white/55 p-5 lg:flex lg:flex-col">
          <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
            <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
              AcadeMind Admin
            </p>
            <h1 className="mt-3 text-2xl font-semibold">운영자 워크스페이스</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              오늘의 지표와 위험 신호를 가장 먼저 보는 운영 화면입니다.
            </p>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">오늘의 리스크</p>
            <p className="mt-2 leading-6">
              미납 3건, 출석 하락 2명, 확인 대기 민원 4건이 감지되었습니다.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="glass-panel sticky top-4 z-20 mb-6 rounded-[28px] border border-white/55 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 sm:gap-5">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/85 text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                  onClick={() => setMobileNavOpen(true)}
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Operations</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-800">운영 관리자 · {todayLabel}</p>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 sm:min-w-[320px]">
                  <Search className="h-4 w-4" />
                  학생, 반, 결제, 민원 검색
                </div>

                <div className="relative flex items-center gap-3 self-end sm:self-auto">
                  <button
                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    onClick={() => {
                      setAlarmOpen((current) => !current)
                      setProfileOpen(false)
                    }}
                    type="button"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500" />
                  </button>
                  <button
                    className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-left transition hover:border-indigo-200"
                    onClick={() => {
                      setProfileOpen((current) => !current)
                      setAlarmOpen(false)
                    }}
                    type="button"
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                      Operations
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">운영 관리자</p>
                  </button>

                  {alarmOpen ? (
                    <div className="absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">알림 센터</p>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          3건
                        </span>
                      </div>
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
                      <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Workspace</p>
                        <p className="mt-2 text-lg font-semibold">운영 관리자</p>
                        <p className="mt-2 text-sm text-slate-300">오늘 일정과 리스크를 먼저 확인해 주세요.</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                          <UserRound className="h-4 w-4" />
                          내 대시보드
                        </Link>
                        <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900" type="button">
                          <Settings2 className="h-4 w-4" />
                          알림 설정
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
            </div>
          </header>

          <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        </div>
      </div>

      {mobileNavOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden">
          <div className="absolute left-4 right-4 top-4 rounded-[32px] border border-white/55 bg-white p-5 shadow-2xl shadow-slate-900/15">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">AcadeMind Admin</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">운영자 빠른 이동</p>
              </div>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"
                onClick={() => setMobileNavOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="mt-5 grid gap-2 sm:grid-cols-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-sm font-medium transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  )
}
