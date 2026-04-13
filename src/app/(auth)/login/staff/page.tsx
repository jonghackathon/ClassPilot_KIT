'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState, useTransition, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, Mail } from 'lucide-react'

type FieldErrors = {
  email?: string
  password?: string
}

function resolveRoleHome(role?: string) {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'TEACHER') return '/teacher/dashboard'
  return '/student/home'
}

function StaffLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? undefined

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [isPending, startTransition] = useTransition()

  function validate() {
    const errors: FieldErrors = {}
    if (!email.trim()) {
      errors.email = '이메일을 입력해 주세요.'
    } else if (!email.includes('@')) {
      errors.email = '이메일 형식을 확인해 주세요.'
    }
    if (!password.trim()) {
      errors.password = '비밀번호를 입력해 주세요.'
    } else if (password.trim().length < 4) {
      errors.password = '비밀번호는 4자 이상이어야 해요.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setInfoMessage('')
    if (!validate()) return

    startTransition(async () => {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않아요.')
        return
      }

      const session = await getSession()
      const role = session?.user?.role

      const nextPath =
        callbackUrl && !callbackUrl.startsWith('/login')
          ? callbackUrl
          : result?.url && !result.url.includes('/login')
            ? result.url
            : resolveRoleHome(role as string | undefined)

      router.push(nextPath)
    })
  }

  return (
    <div className="glass-panel w-full max-w-[440px] rounded-[32px] border border-white/45 p-6 text-slate-900 shadow-2xl sm:p-8">
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
      >
        <ArrowLeft className="h-4 w-4" />
        역할 선택으로
      </Link>

      <div className="mb-8">
        <p className="text-sm font-semibold text-indigo-600">원장 · 강사</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          이메일로 로그인
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          관리자 또는 강사 계정으로 워크스페이스에 접근해요.
        </p>
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

        {infoMessage && (
          <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
            {infoMessage}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            이메일
          </label>
          <div
            className={`flex h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:ring-4 ${
              fieldErrors.email
                ? 'border-red-200 focus-within:border-red-300 focus-within:ring-red-100'
                : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-100'
            }`}
          >
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="email"
              aria-label="이메일"
              autoComplete="email"
              autoFocus
              className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((c) => ({ ...c, email: undefined }))
              }}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
          </div>
          {fieldErrors.email ? (
            <p className="text-sm font-medium text-red-600">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              비밀번호
            </label>
            <button
              className="text-xs font-medium text-slate-500 transition hover:text-indigo-600"
              onClick={() => { setInfoMessage('비밀번호 재설정은 관리자에게 문의해 주세요.'); setErrorMessage('') }}
              type="button"
            >
              비밀번호를 잊으셨나요?
            </button>
          </div>

          <div
            className={`flex h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:ring-4 ${
              fieldErrors.password
                ? 'border-red-200 focus-within:border-red-300 focus-within:ring-red-100'
                : 'border-slate-200 focus-within:border-indigo-400 focus-within:ring-indigo-100'
            }`}
          >
            <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              id="password"
              aria-label="비밀번호"
              autoComplete="current-password"
              className="h-full w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((c) => ({ ...c, password: undefined }))
              }}
              placeholder="비밀번호 입력"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              className="shrink-0 text-slate-400 transition hover:text-slate-600"
              onClick={() => setShowPassword((c) => !c)}
              type="button"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="text-sm font-medium text-red-600">{fieldErrors.password}</p>
          ) : null}
        </div>

        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-70"
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
    </div>
  )
}

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLoginForm />
    </Suspense>
  )
}
