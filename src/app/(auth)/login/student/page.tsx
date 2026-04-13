'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { ArrowLeft, ArrowRight, GraduationCap, LoaderCircle } from 'lucide-react'

type Step = 1 | 2 | 3

interface AcademyInfo {
  id: string
  name: string
}

interface ClassInfo {
  id: string
  name: string
}

interface StudentInfo {
  id: string
  maskedName: string
}

const STEPS = ['학원 코드', '이름 선택', 'PIN 입력']

const PIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, index) => {
        const stepNum = (index + 1) as Step
        const isDone = stepNum < current
        const isActive = stepNum === current
        return (
          <div key={label} className="flex items-center gap-2">
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
            <span className={`text-xs font-medium ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
              {label}
            </span>
            {index < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-slate-200" />}
          </div>
        )
      })}
    </div>
  )
}

function PinKeypad({ pin, onChange }: { pin: string; onChange: (v: string) => void }) {
  function handleKey(key: string) {
    if (key === '⌫') onChange(pin.slice(0, -1))
    else if (pin.length < 4) onChange(pin + key)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl transition ${
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
        {PIN_KEYS.map((key, i) => (
          <button
            key={i}
            type="button"
            disabled={key === ''}
            onClick={() => handleKey(key)}
            className={`flex h-14 items-center justify-center rounded-2xl text-lg font-semibold transition ${
              key === ''
                ? 'invisible'
                : key === '⌫'
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300'
                  : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 active:bg-slate-100'
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
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)

  // Step 1
  const [academyCode, setAcademyCode] = useState('')
  const [academyInfo, setAcademyInfo] = useState<AcademyInfo | null>(null)
  const [codeError, setCodeError] = useState('')
  const [isCheckingCode, setIsCheckingCode] = useState(false)

  // Step 2
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [isFetchingStudents, startFetchStudents] = useTransition()

  // Step 3
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isLoggingIn, startLogin] = useTransition()

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
      const json = await res.json()
      if (!res.ok) {
        setCodeError(json.error?.message ?? '학원 코드를 찾을 수 없어요.')
        return
      }
      setAcademyInfo(json.data)
      setAcademyCode(trimmed)

      // 반 목록 미리 로딩
      const classRes = await fetch(`/api/auth/students?academyCode=${encodeURIComponent(trimmed)}`)
      const classJson = await classRes.json()
      if (classRes.ok) setClasses(classJson.data.classes ?? [])
      setStep(2)
    } catch {
      setCodeError('연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsCheckingCode(false)
    }
  }

  function handleClassSelect(cls: ClassInfo) {
    setSelectedClass(cls)
    setSelectedStudent(null)
    startFetchStudents(async () => {
      const res = await fetch(
        `/api/auth/students?academyCode=${encodeURIComponent(academyCode)}&classId=${encodeURIComponent(cls.id)}`,
      )
      const json = await res.json()
      if (res.ok) setStudents(json.data.students ?? [])
    })
  }

  function handleStudentSelect(student: StudentInfo) {
    setSelectedStudent(student)
    setStep(3)
  }

  function handleBack() {
    if (step === 2) {
      setStep(1)
      setAcademyInfo(null)
      setClasses([])
      setSelectedClass(null)
    } else if (step === 3) {
      setStep(2)
      setPin('')
      setPinError('')
    }
  }

  function handleLogin() {
    if (pin.length < 4 || !selectedStudent || !academyCode) return
    setPinError('')
    startLogin(async () => {
      const result = await signIn('credentials', {
        type: 'student',
        academyCode,
        studentId: selectedStudent.id,
        pin,
        redirect: false,
      })
      if (result?.error) {
        setPinError('PIN이 올바르지 않아요. 다시 확인해 주세요.')
        setPin('')
        return
      }
      router.push('/student/home')
    })
  }

  return (
    <div className="glass-panel w-full max-w-[440px] rounded-[32px] border border-white/45 p-6 text-slate-900 shadow-2xl sm:p-8">
      <div className="mb-2">
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
        {step === 2 && academyInfo && (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{academyInfo.name}</span>
            {selectedClass ? ` · ${selectedClass.name}` : ''}
          </p>
        )}
        {step === 3 && selectedStudent && (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{selectedStudent.maskedName}</span>님의 PIN을 입력해 주세요.
          </p>
        )}
      </div>

      <div className="mb-6">
        <StepIndicator current={step} />
      </div>

      {/* Step 1 — 학원 코드 */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="academyCode">
              학원 코드
            </label>
            <div
              className={`flex h-14 items-center rounded-2xl border bg-white px-4 transition focus-within:ring-4 ${
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
                onKeyDown={(e) => { if (e.key === 'Enter') handleCodeSubmit() }}
                placeholder="예: ACAD-3F8K"
                value={academyCode}
              />
            </div>
            {codeError && <p className="text-sm font-medium text-red-600">{codeError}</p>}
          </div>

          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-px hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCheckingCode}
            onClick={handleCodeSubmit}
            type="button"
          >
            {isCheckingCode ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" />확인 중...</>
            ) : (
              <>다음<ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}

      {/* Step 2 — 반 선택 → 이름 선택 */}
      {step === 2 && (
        <div className="space-y-3">
          {!selectedClass ? (
            <>
              <p className="text-sm text-slate-500">수업 반을 선택해 주세요.</p>
              {classes.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  등록된 반이 없어요.
                </p>
              ) : (
                classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => handleClassSelect(cls)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {cls.name}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setSelectedClass(null); setStudents([]) }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-sky-600"
              >
                <ArrowLeft className="h-3 w-3" />
                반 다시 선택
              </button>

              {isFetchingStudents ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : students.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  이 반에 등록된 학생이 없어요.
                </p>
              ) : (
                students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleStudentSelect(student)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left text-sm font-semibold text-slate-900 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {student.maskedName}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* Step 3 — PIN 입력 */}
      {step === 3 && (
        <div className="space-y-6">
          <PinKeypad pin={pin} onChange={(v) => { setPin(v); setPinError('') }} />
          {pinError && (
            <p className="text-center text-sm font-medium text-red-600">{pinError}</p>
          )}
          <button
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-px hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            disabled={pin.length < 4 || isLoggingIn}
            onClick={handleLogin}
            type="button"
          >
            {isLoggingIn ? (
              <><LoaderCircle className="h-4 w-4 animate-spin" />로그인 중...</>
            ) : (
              <>로그인<ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
