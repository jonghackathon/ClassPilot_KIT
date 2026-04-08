'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bot,
  BookCheck,
  BookOpenText,
  CircleUserRound,
  GraduationCap,
  HeartPulse,
  Mic2,
  NotebookPen,
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

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">
        <header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-violet-600">AcadeMind Teacher</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                수업 흐름이 끊기지 않도록 설계된 강사 워크스페이스
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Today</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">중급 A반 · 14:00</p>
              </div>
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <CircleUserRound className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
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
    </div>
  )
}
