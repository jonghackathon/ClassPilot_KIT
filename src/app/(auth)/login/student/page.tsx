'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, GraduationCap, LoaderCircle } from 'lucide-react'

type Step = 1 | 2 | 3

const STEPS = [
  { label: '학원 코드' },
  { label: '이름 선택' },
  { label: 'PIN 입력' },
]

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const stepNum = (index + 1) as Step
        const isDone = stepNum < current
        const isActive = stepNum === current
        return (
          <div key={step.label} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                isDone
                  ? 'bg-sky-500 text-white'
                  : isActive
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-200 text-slate-500'
              }`}
            >
              {isDone ? '✓' : stepNum}
            </div>
            <span
              className={`text-xs font-medium transition ${
                isActive ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <div className="mx-1 h-px w-6 bg-slate-200" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

// PIN 숫자 키패드
const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

function PinKeypad({
  pin,
  onChange,
}: {
  pin: string
  onChange: (next: string) => void
}) {
  function handleKey(key: string) {
    if (key === '⌫') {
      onChange(pin.slice(0, -1))
    } else if (key !== '' && pin.length < 4) {
      onChange(pin + key)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-bold transition ${
              pin.length > i
                ? 'border-sky-500 bg-sky-50 text-sky-700'
                : 'border-slate-200 bg-white text-transparent'
            }`}
          >
            {pin.length > i ? '●' : '○'}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PIN_KEYS.map((key, index) => (
          <button
            key={index}
            type="button"
            disabled={key === ''}
            onClick={() => handleKey(key)}
            className={`flex h-14 items-center justify-center rounded-2xl text-lg font-semibold transition ${
              key === ''
                ? 'invisible'
                : key === '⌫'
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                  : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300 active:bg-slate-100'
            }`}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function StudentLoginPage() {
  const [step, setStep] = useState<Step>(1)
  const [academyCode, setAcademyCode] = useState('')
  const [academyName, setAcademyName] = useState('')
  const [codeError, setCodeError] = useState('')
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)
  const [pin, setPin] = useState('')

  async function handleCodeSubmit() {
    setCodeError('')
    const trimmed = academyCode.trim().toUpperCase()
    if (!trimmed) {
      setCodeError('학원 코드를 입력해 주세요.')
      return
    }

    setIsCheckingCode(true)
    try {
      const res = await fetch(`/api/auth/academy?code=${encodeURIComponent(trimmed)}`)
      if (!res.ok) {
        setCodeError('학원 코드를 찾을 수 없어요. 다시 확인해 주세요.')
        return
      }
      const data = await res.json()
      setAcademyName(data.name)
      setAcademyCode(trimmed)
      setStep(2)
    } catch {
      setCodeError('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsCheckingCode(false)
    }
  }

  function handleStudentSelect(student: { id: string; name: string }) {
    setSelectedStudent(student)
    setStep(3)
  }

  function handleBack() {
    if (step === 2) {
      setStep(1)
      setAcademyName('')
    } else if (step === 3) {
      setStep(2)
      setPin('')
    }
  }

  return (
    <div className="glass-panel w-full max-w-[440px] rounded-[32px] border border-white/45 p-6 text-slate-900 shadow-2xl sm:p-8">
      <div className="mb-2 flex items-center gap-3">
        {step === 1 ? (
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-600"
          >
            <ArrowLeft className="h-4 w-4" />
            역할 선택으로
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-600"
          >
            <ArrowLeft className="h-4 w-4" />
            이전
          </button>
        )}
      </div>

      <div className="mb-6 mt-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-sky-600" />
          <p className="text-sm font-semibold text-sky-600">수강생</p>
        </div>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {step === 1 && '학원 코드 입력'}
          {step === 2 && '이름을 선택해 주세요'}
          {step === 3 && 'PIN 입력'}
        </h2>
        {step === 2 && academyName ? (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{academyName}</span> 학생 목록이에요.
          </p>
        ) : null}
        {step === 3 && selectedStudent ? (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{selectedStudent.name}</span>님의 PIN을 입력해 주세요.
          </p>
        ) : null}
      </div>

      <div className="mb-6">
        <StepIndicator current={step} />
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="academyCode">
              학원 코드
            </label>
            <div
              className={`flex h-14 items-center gap-3 rounded-2xl border bg-white px-4 transition focus-within:ring-4 ${
                codeError
                  ? 'border-red-200 focus-within:border-red-300 focus-within:ring-red-100'
                  : 'border-slate-200 focus-within:border-sky-400 focus-within:ring-sky-100'
              }`}
            >
              <input
                id="academyCode"
                autoFocus
                autoCapitalize="characters"
                className="h-full w-full bg-transparent text-center text-lg font-bold tracking-[0.3em] text-slate-900 outline-none placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                maxLength={9}
                onChange={(e) => {
                  setAcademyCode(e.target.value.toUpperCase())
                  setCodeError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCodeSubmit()
                }}
                placeholder="예: ACAD-3F8K"
                value={academyCode}
              />
            </div>
            {codeError ? (
              <p className="text-sm font-medium text-red-600">{codeError}</p>
            ) : null}
          </div>

          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-px hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCheckingCode}
            onClick={handleCodeSubmit}
            type="button"
          >
            {isCheckingCode ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                다음
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <StudentSelectStep
          academyCode={academyCode}
          onSelect={handleStudentSelect}
        />
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <PinKeypad pin={pin} onChange={setPin} />
          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-px hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pin.length < 4}
            type="button"
          >
            로그인
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function StudentSelectStep({
  academyCode,
  onSelect,
}: {
  academyCode: string
  onSelect: (student: { id: string; name: string }) => void
}) {
  // TODO: Phase 3 — API 연동 후 실제 데이터로 교체
  // GET /api/auth/students?academyCode=xxx&classId=yyy
  const placeholder = [
    { id: '1', name: '김민○' },
    { id: '2', name: '이수○' },
    { id: '3', name: '박지○' },
  ]

  return (
    <div className="space-y-3">
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        DB 연동 전 플레이스홀더입니다. Phase 3 작업 후 실제 학생 목록으로 교체돼요.
      </p>
      {placeholder.map((student) => (
        <button
          key={student.id}
          type="button"
          onClick={() => onSelect(student)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
        >
          {student.name}
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </button>
      ))}
      <p className="text-center text-xs text-slate-400">코드: {academyCode}</p>
    </div>
  )
}
