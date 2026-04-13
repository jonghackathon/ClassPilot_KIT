import Link from 'next/link'
import { ArrowRight, BookOpen, GraduationCap, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="w-full max-w-[440px] space-y-4">
      <div className="mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/25">
          <GraduationCap className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
          ClassPilot
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          역할을 선택하면 맞는 로그인 화면으로 연결해 드려요.
        </p>
      </div>

      <Link
        href="/login/staff"
        className="glass-panel group flex w-full items-center justify-between rounded-[24px] border border-white/55 px-6 py-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10"
      >
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">원장 · 강사</span>
          </div>
          <p className="mt-2 text-base font-semibold text-slate-900">이메일로 로그인</p>
          <p className="mt-1 text-sm text-slate-500">
            등록된 이메일과 비밀번호를 사용해요.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>

      <Link
        href="/login/student"
        className="glass-panel group flex w-full items-center justify-between rounded-[24px] border border-white/55 px-6 py-6 transition hover:border-sky-200 hover:shadow-lg hover:shadow-sky-500/10"
      >
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-sky-600" />
            <span className="text-sm font-semibold text-sky-600">수강생</span>
          </div>
          <p className="mt-2 text-base font-semibold text-slate-900">학원 코드로 로그인</p>
          <p className="mt-1 text-sm text-slate-500">
            학원 코드, 이름, PIN으로 간단하게 들어와요.
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>

      {/* 데모 계정 안내 */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">데모 계정 안내</span>
        </div>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span className="text-slate-500">원장 (ADMIN)</span>
            <span className="font-mono">admin@academind.kr / 1234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">강사 (TEACHER)</span>
            <span className="font-mono">teacher@academind.kr / 1234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">수강생 (STUDENT)</span>
            <span className="font-mono">학원코드 DEMO-1234 · 민수 · 1234</span>
          </div>
        </div>
      </div>
    </div>
  )
}
