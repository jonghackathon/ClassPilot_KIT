'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  LayoutGrid,
  MessageSquareWarning,
  Search,
  Users,
  UserSquare2,
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

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
          <header className="glass-panel sticky top-4 z-20 mb-6 flex flex-col gap-4 rounded-[28px] border border-white/55 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500 sm:min-w-[320px]">
              <Search className="h-4 w-4" />
              학생, 반, 결제, 민원 검색
            </div>

            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600">
                <Bell className="h-4 w-4" />
              </button>
              <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
                  Operations
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">정태님</p>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-8rem)]">
          {children}
          </main>
        </div>
      </div>
    </div>
  )
}
