'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

const previewLinks = [
  { href: '/admin/dashboard', label: '운영자 화면 보기', tone: 'bg-indigo-600' },
  { href: '/teacher/dashboard', label: '강사 화면 보기', tone: 'bg-violet-600' },
  { href: '/student/home', label: '수강생 화면 보기', tone: 'bg-sky-500' },
]

const demoAccounts = [
  { role: '운영자', email: 'admin@academind.kr' },
  { role: '강사', email: 'teacher@academind.kr' },
  { role: '수강생', email: 'student@academind.kr' },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      router.push(result?.url ?? '/login')
    })
  }

  return (
    <div className="glass-panel w-full max-w-[480px] rounded-[32px] border border-white/45 p-6 text-slate-900 shadow-2xl sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            AcadeMind
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            학원 운영, 수업 관리, 복습 경험을 한 흐름으로 연결하는 AI 학원
            관리 플랫폼
          </p>
        </div>

        <div className="hidden rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-right sm:block">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            Today
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-700">4월 8일 수요일</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-[28px] bg-slate-950 p-5 text-white sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">운영</p>
          <p className="mt-2 text-sm font-medium text-slate-100">미납과 이탈 위험을 한눈에</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">수업</p>
          <p className="mt-2 text-sm font-medium text-slate-100">출결과 AI 코파일럿을 빠르게</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">학습</p>
          <p className="mt-2 text-sm font-medium text-slate-100">과제와 복습을 부담 없이</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {errorMessage ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            이메일
          </label>
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
            <Mail className="h-4 w-4 text-slate-400" />
            <input
              id="email"
              aria-label="이메일"
              autoComplete="email"
              autoFocus
              className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@academind.kr"
              type="email"
              value={email}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              비밀번호
            </label>
            <button
              className="text-xs font-medium text-slate-500 transition hover:text-indigo-600"
              onClick={() =>
                setErrorMessage('비밀번호 재설정은 현재 관리자 문의 방식으로 운영 중입니다.')
              }
              type="button"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
            <KeyRound className="h-4 w-4 text-slate-400" />
            <input
              id="password"
              aria-label="비밀번호"
              autoComplete="current-password"
              className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해주세요"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              className="text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:translate-y-[-1px] hover:shadow-xl hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isPending}
          type="submit"
        >
          {isPending ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            <>
              로그인
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-[28px] border border-slate-200/80 bg-white/85 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles className="h-4 w-4 text-violet-500" />
          빠른 입력
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.role}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              onClick={() => {
                setEmail(account.email)
                setPassword('demo1234')
              }}
              type="button"
            >
              {account.role} 계정 채우기
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p>
            인증 연동 전에도 화면 흐름을 검토할 수 있도록 역할별 미리보기
            링크를 함께 제공합니다.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {previewLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between rounded-2xl ${link.tone} px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:translate-y-[-1px]`}
          >
            {link.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  )
}
