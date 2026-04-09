'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookCheck,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Copy,
  FileAudio2,
  Mic2,
  NotebookPen,
  PlayCircle,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  X,
} from 'lucide-react'

import {
  ActionButton,
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

type AttendanceStatus = '출석' | '지각' | '조퇴' | '결석'

type Lesson = {
  id: string
  time: string
  title: string
  topic: string
  href: string
}

type AssignmentRow = {
  name: string
  status: '제출' | '미제출'
  aiUses: string
  submittedAt: string
  historyCount: string
  feedback: '대기' | '완료'
}

type FaqItem = {
  id: number
  question: string
  answer: string
}

const filledButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const lineButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'
const pillButton = 'rounded-full px-3 py-2 text-sm font-medium transition'

const teacherLessons: Lesson[] = [
  { time: '14:00 - 15:30', title: '중급 A반', topic: 'Python 반복문과 리스트 컴프리헨션', href: '/teacher/copilot/lesson-1', id: 'lesson-1' },
  { time: '16:00 - 17:30', title: '초급 B반', topic: 'HTML/CSS 기초 레이아웃', href: '/teacher/copilot/lesson-2', id: 'lesson-2' },
]

const initialAttendance = {
  'lesson-1-이지은': '출석',
  'lesson-1-정우진': '지각',
  'lesson-1-한소영': '출석',
  'lesson-1-김태호': '결석',
  'lesson-2-이지은': '출석',
  'lesson-2-정우진': '출석',
  'lesson-2-한소영': '출석',
  'lesson-2-김태호': '조퇴',
} as const satisfies Record<string, AttendanceStatus>

function OverlayPanel({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto max-h-full w-full max-w-[560px] overflow-y-auto rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-600">Teacher Flow</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({
  label,
  defaultValue,
  textarea = false,
}: {
  label: string
  defaultValue: string
  textarea?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {textarea ? (
        <textarea className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none" defaultValue={defaultValue} />
      ) : (
        <input className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" defaultValue={defaultValue} />
      )}
    </label>
  )
}

export function TeacherAttendancePage() {
  const students = [
    ['이지은', '중2', '제출'],
    ['정우진', '중3', '미제출'],
    ['한소영', '중2', '제출'],
    ['김태호', '중1', '미제출'],
  ] as const
  const [viewMode, setViewMode] = useState<'일별' | '주별'>('일별')
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(initialAttendance)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const counts = useMemo(() => {
    const values = Object.values(attendanceMap)
    return {
      출석: values.filter((value) => value === '출석').length,
      지각: values.filter((value) => value === '지각').length,
      조퇴: values.filter((value) => value === '조퇴').length,
      결석: values.filter((value) => value === '결석').length,
    }
  }, [attendanceMap])

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="출결 관리"
        title="수업 전중후 흐름을 끊지 않도록 출결과 과제를 한 페이지에 배치했습니다"
        description="학생별 상태를 바로 바꾸고, 마지막에는 반 전체를 한 번에 확정하는 흐름까지 이어지도록 구성했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/copilot/lesson-1" label="코파일럿 시작" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(['일별', '주별'] as const).map((mode) => (
              <button
                key={mode}
                className={cx(
                  pillButton,
                  viewMode === mode ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200',
                )}
                onClick={() => setViewMode(mode)}
                type="button"
              >
                {mode}
              </button>
            ))}
            <StatusBadge label="2026년 4월 2주차" tone="slate" />
          </div>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setConfirmOpen(true)} type="button">
            <ClipboardCheck className="h-4 w-4" />
            반 전체 확정
          </button>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="출석" value={`${counts.출석}명`} detail="정상 출석" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="지각" value={`${counts.지각}명`} detail="주의 필요" icon={TrendingUp} tone="amber" />
        <MetricCard label="조퇴" value={`${counts.조퇴}명`} detail="중간 퇴실" icon={CalendarClock} tone="sky" />
        <MetricCard label="결석" value={`${counts.결석}명`} detail="후속 확인" icon={CircleHelp} tone="rose" />
      </div>

      {teacherLessons.map((lesson) => (
        <SurfaceCard key={lesson.title}>
          <SectionHeading
            title={`${lesson.title} · ${lesson.time}`}
            subtitle={`${viewMode} 보기 · ${lesson.topic}`}
            action={<ActionButton href={lesson.href} label="AI 코파일럿" tone="violet" />}
          />
          <div className="mt-5 grid gap-3">
            {students.map(([name, grade, assignment]) => {
              const key = `${lesson.id}-${name}`
              const attendance = attendanceMap[key]
              return (
                <div key={key} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{name}</p>
                      <p className="mt-1 text-sm text-slate-500">{grade}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['출석', '지각', '조퇴', '결석'] as const).map((status) => (
                        <button
                          key={status}
                          className={cx(
                            'rounded-2xl px-4 py-3 text-sm font-medium transition',
                            attendance === status
                              ? status === '출석'
                                ? 'bg-emerald-600 text-white'
                                : status === '지각'
                                  ? 'bg-amber-500 text-white'
                                  : status === '결석'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-sky-600 text-white'
                              : 'bg-slate-100 text-slate-600',
                          )}
                          onClick={() =>
                            setAttendanceMap((current) => ({
                              ...current,
                              [key]: status,
                            }))
                          }
                          type="button"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <StatusBadge label={assignment} tone={assignment === '제출' ? 'emerald' : 'rose'} />
                  </div>
                </div>
              )
            })}
          </div>
        </SurfaceCard>
      ))}

      <OverlayPanel
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="출결 전체 확정"
        description="현재 변경된 상태를 확인한 뒤 반 전체 출결을 한번에 저장하는 흐름입니다."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusBadge label={`출석 ${counts.출석}명`} tone="emerald" />
          <StatusBadge label={`지각 ${counts.지각}명`} tone="amber" />
          <StatusBadge label={`조퇴 ${counts.조퇴}명`} tone="sky" />
          <StatusBadge label={`결석 ${counts.결석}명`} tone="rose" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setConfirmOpen(false)} type="button">취소</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setConfirmOpen(false)} type="button">출결 확정</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherAssignmentsPage() {
  const assignments = [
    { title: 'Python 반복문 실습', group: '중급 A반', due: '마감 D-2', progress: 67, href: '/teacher/assignments/python-loop' },
    { title: 'HTML 포트폴리오 페이지', group: '초급 B반', due: '마감 D-5', progress: 33, href: '/teacher/assignments/html-portfolio' },
    { title: '리스트 컴프리헨션 연습', group: '중급 A반', due: '마감 D-12', progress: 84, href: '/teacher/assignments/list-comprehension' },
  ]
  const [statusFilter, setStatusFilter] = useState<'전체' | '진행중' | '피드백 대기'>('전체')
  const [createOpen, setCreateOpen] = useState(false)

  const filteredAssignments = assignments.filter((assignment) => {
    if (statusFilter === '전체') {
      return true
    }

    if (statusFilter === '진행중') {
      return assignment.progress < 80
    }

    return assignment.progress >= 60 && assignment.progress < 90
  })

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 관리"
        title="반별 과제 진행 상황과 제출률을 바로 읽을 수 있는 화면"
        description="새 과제 생성 모달과 진행 상태 필터를 붙여서 과제 운영 흐름을 실제처럼 확인할 수 있습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setCreateOpen(true)} type="button">
            <NotebookPen className="h-4 w-4" />
            과제 만들기
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['전체', '진행중', '피드백 대기'] as const).map((status) => (
            <button
              key={status}
              className={cx(
                pillButton,
                statusFilter === status ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setStatusFilter(status)}
              type="button"
            >
              {status}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <SurfaceCard key={assignment.title}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">{assignment.due}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{assignment.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{assignment.group}</p>
                </div>
                <Link href={assignment.href} className="text-sm font-semibold text-indigo-600">상세 보기</Link>
              </div>
              <div className="mt-5">
                <ProgressBar value={assignment.progress} tone={assignment.progress > 80 ? 'emerald' : assignment.progress > 50 ? 'indigo' : 'amber'} />
              </div>
              <p className="mt-3 text-sm text-slate-500">제출 현황 {Math.round((assignment.progress / 100) * 12)} / 12</p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="h-fit">
          <SectionHeading title="과제 운영 메모" subtitle="새 과제 생성 시 같이 확인할 항목" />
          <div className="mt-5 space-y-3">
            {['반 선택', '과제 제목', '과제 설명', '마감일', 'AI 사용 안내'].map((field) => (
              <div key={field} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">{field}</div>
            ))}
          </div>
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="font-semibold">피드백 대기 흐름</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              제출률이 일정 수준을 넘으면 피드백 대기 상태로 넘어가도록 문서 흐름을 반영했습니다.
            </p>
          </div>
        </SurfaceCard>
      </div>

      <OverlayPanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="새 과제 만들기"
        description="반, 제목, 마감일, 안내 문구를 한 번에 채울 수 있는 프론트 모달입니다."
      >
        <Field label="반 선택" defaultValue="중급 A반" />
        <Field label="과제 제목" defaultValue="반복문 추가 연습" />
        <Field label="마감일" defaultValue="2026-04-12" />
        <Field label="과제 설명" defaultValue="for문과 while문 차이를 비교하며 예제를 2개씩 작성해 보세요." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setCreateOpen(false)} type="button">취소</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setCreateOpen(false)} type="button">과제 초안 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherAssignmentDetailPage() {
  const rows: AssignmentRow[] = [
    { name: '이지은', status: '제출', aiUses: '2회', submittedAt: '4/6 14:32', historyCount: '3회', feedback: '대기' },
    { name: '정우진', status: '제출', aiUses: '0회', submittedAt: '4/7 09:15', historyCount: '1회', feedback: '완료' },
    { name: '한소영', status: '제출', aiUses: '5회', submittedAt: '4/8 11:20', historyCount: '7회', feedback: '대기' },
    { name: '김태호', status: '미제출', aiUses: '-', submittedAt: '-', historyCount: '-', feedback: '대기' },
  ]
  const [selectedStudent, setSelectedStudent] = useState<AssignmentRow>(rows[0])
  const [detailOpen, setDetailOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 상세"
        title="Python 반복문 실습 과제의 제출 현황과 작성 이력을 확인해요"
        description="학생별 상태를 보고 필요한 경우 작성 이력과 피드백 패널을 바로 여는 흐름으로 바꿨습니다."
        backHref="/teacher/assignments"
        backLabel="과제 목록"
        action={<ActionButton href="/teacher/bot" label="질문봇 보기" tone="violet" />}
      />

      <SurfaceCard>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="제출 완료" value="8 / 12" detail="67% 진행" icon={NotebookPen} tone="indigo" />
          <MetricCard label="AI 사용" value="평균 2.1회" detail="과정 데이터 포함" icon={Sparkles} tone="violet" />
          <MetricCard label="피드백 대기" value="4명" detail="검토 필요" icon={ClipboardCheck} tone="amber" />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="학생별 제출 현황" subtitle="작성 이력과 피드백 흐름" />
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">이름</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium">AI 사용</th>
                <th className="pb-3 font-medium">제출일</th>
                <th className="pb-3 font-medium">이력</th>
                <th className="pb-3 font-medium text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="py-4 font-semibold text-slate-900">{row.name}</td>
                  <td className="py-4"><StatusBadge label={row.status} tone={row.status === '제출' ? 'emerald' : 'rose'} /></td>
                  <td className="py-4 text-slate-600">{row.aiUses}</td>
                  <td className="py-4 text-slate-600">{row.submittedAt}</td>
                  <td className="py-4 text-slate-600">{row.historyCount}</td>
                  <td className="py-4 text-right">
                    <button
                      className="text-sm font-semibold text-indigo-600"
                      onClick={() => {
                        setSelectedStudent(row)
                        setDetailOpen(true)
                      }}
                      type="button"
                    >
                      이력 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <OverlayPanel
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`${selectedStudent.name} 작성 이력`}
        description="작성 과정과 피드백 메모를 한 패널에서 같이 보는 흐름입니다."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusBadge label={`상태 ${selectedStudent.status}`} tone={selectedStudent.status === '제출' ? 'emerald' : 'rose'} />
          <StatusBadge label={`AI 사용 ${selectedStudent.aiUses}`} tone="violet" />
        </div>
        <div className="space-y-3 rounded-[28px] bg-slate-50 p-4">
          {['4/5 10:00 · 초안 시작', '4/6 09:00 · 예시 수정', '4/8 11:20 · 최종 제출'].map((item) => (
            <div key={item} className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-700 ring-1 ring-slate-200">{item}</div>
          ))}
        </div>
        <Field label="피드백 메모" defaultValue="핵심 개념은 잘 이해했고, 리스트 컴프리헨션 예제를 1개만 더 연습하면 좋겠습니다." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setDetailOpen(false)} type="button">닫기</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setDetailOpen(false)} type="button">피드백 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherCopilotLandingPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title="오늘 수업 중 바로 시작할 세션을 선택해 주세요"
        description="코파일럿은 수업별 세션으로 나뉘므로, 강사는 먼저 수업을 선택한 뒤 질문 제안, 예시 코드, 판서용 정리를 받는 흐름으로 이동합니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/copilot/lesson-1" label="대표 세션 시작" tone="violet" />}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {teacherLessons.map((lesson) => (
          <SurfaceCard key={lesson.title}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-violet-600">{lesson.time}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{lesson.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.topic}</p>
              </div>
              <PlayCircle className="h-6 w-6 text-violet-500" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton href={lesson.href} label="세션 시작" tone="violet" />
              <ActionButton href="/teacher/attendance" label="출결 먼저 보기" tone="slate" />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

export function TeacherCopilotSessionPage() {
  const cards = [
    { title: '초보자 설명', content: 'for문은 반복 횟수가 정해져 있을 때 사용하고, while문은 조건이 유지되는 동안 반복할 때 사용합니다.', tone: 'emerald' as Tone },
    { title: '예시 코드', content: 'for i in range(5): print(i)\nwhile password != "1234":\n  ...', tone: 'sky' as Tone },
    { title: '심화 추가 질문', content: 'for를 while로 바꿀 수 있는 상황과, while을 for로 바꿀 수 있는 예를 학생에게 던져보세요.', tone: 'violet' as Tone },
    { title: '판서용 핵심 정리', content: 'for = 횟수 중심, while = 조건 중심. 상황에 맞게 선택.', tone: 'amber' as Tone },
  ]
  const [currentQuestion, setCurrentQuestion] = useState('for문이랑 while문 중에 어떤 걸 써야 하나요?')
  const [prompt, setPrompt] = useState('')
  const [history, setHistory] = useState([
    'range(1,10)이면 10은 포함 안 되나요?',
    '파이썬에서 들여쓰기는 꼭 해야 하나요?',
  ])
  const [copiedCard, setCopiedCard] = useState<string | null>(null)
  const [usedCards, setUsedCards] = useState<string[]>([])
  const [endOpen, setEndOpen] = useState(false)

  async function handleCopy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedCard(label)
    } catch {
      setCopiedCard(label)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title="중급 A반 · Python 반복문과 리스트 컴프리헨션"
        description="입력창에서 새 질문을 이어서 던지고, 생성 카드마다 복사/사용 표시를 남길 수 있게 바꿨습니다."
        backHref="/teacher/copilot"
        backLabel="수업 선택"
        action={
          <button className={cx(filledButton, 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20')} onClick={() => setEndOpen(true)} type="button">
            세션 종료
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="초보 30%" tone="emerald" />
          <StatusBadge label="중간 50%" tone="sky" />
          <StatusBadge label="심화 20%" tone="violet" />
        </div>
        <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
          <p className="text-sm font-medium text-slate-300">현재 질문</p>
          <p className="mt-3 text-xl font-semibold">{currentQuestion}</p>
        </div>
        <form
          className="mt-5 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault()
            if (!prompt.trim()) {
              return
            }
            setCurrentQuestion(prompt)
            setHistory((current) => [prompt, ...current].slice(0, 5))
            setPrompt('')
          }}
        >
          <input
            className="h-[54px] flex-1 rounded-[24px] border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="지금 학생이 물어본 질문을 그대로 입력해 보세요"
            value={prompt}
          />
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} type="submit">
            <Send className="h-4 w-4" />
            새 질문 반영
          </button>
        </form>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <SurfaceCard key={card.title}>
            <div className="flex items-center justify-between gap-3">
              <StatusBadge label={card.title} tone={card.tone} />
              <StatusBadge label={usedCards.includes(card.title) ? '수업에 사용함' : '생성 완료'} tone={usedCards.includes(card.title) ? 'emerald' : 'slate'} />
            </div>
            <p className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-600">{card.content}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className={lineButton} onClick={() => handleCopy(card.title, card.content)} type="button">
                <Copy className="h-4 w-4" />
                {copiedCard === card.title ? '복사됨' : '복사하기'}
              </button>
              <button
                className={cx(
                  filledButton,
                  usedCards.includes(card.title)
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20',
                )}
                onClick={() =>
                  setUsedCards((current) =>
                    current.includes(card.title) ? current.filter((item) => item !== card.title) : [...current, card.title],
                  )
                }
                type="button"
              >
                {usedCards.includes(card.title) ? '사용 취소' : '수업에 사용'}
              </button>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <SectionHeading title="이전 질문" subtitle="최근 5개 질문 히스토리" />
        <div className="mt-5 space-y-3">
          {history.map((item) => (
            <button
              key={item}
              className="w-full rounded-[24px] bg-slate-50 px-4 py-4 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              onClick={() => setCurrentQuestion(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <OverlayPanel
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="세션 종료 확인"
        description="종료 전 오늘 사용한 코파일럿 카드와 질문 히스토리를 다시 확인할 수 있습니다."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatusBadge label={`사용 카드 ${usedCards.length}개`} tone="emerald" />
          <StatusBadge label={`질문 기록 ${history.length}개`} tone="violet" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setEndOpen(false)} type="button">계속 진행</button>
          <Link href="/teacher/dashboard" className={cx(filledButton, 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-500/20')}>
            홈으로 종료
          </Link>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherRecordingPage() {
  const recordings = [
    { id: 'recording-1', title: '중급 A반 4/8 수업', status: '요약 완료', tone: 'emerald' as Tone },
    { id: 'recording-2', title: '초급 B반 4/7 수업', status: '검토 필요', tone: 'amber' as Tone },
    { id: 'recording-3', title: '중급 A반 4/6 수업', status: '업로드 완료', tone: 'sky' as Tone },
  ]
  const [selectedId, setSelectedId] = useState(recordings[0].id)
  const [uploadProgress, setUploadProgress] = useState(0)

  const selectedRecording = recordings.find((recording) => recording.id === selectedId) ?? recordings[0]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="녹음 정리"
        title="수업 녹음 업로드부터 요약 확인까지 한 흐름으로 이어집니다"
        description="업로드 진행 상태와 녹음별 상세 진입 흐름을 함께 보여 주도록 바꿨습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SurfaceCard>
          <SectionHeading title="녹음 목록" subtitle="업로드한 파일을 바로 선택해 볼 수 있어요." />
          <div className="mt-5 space-y-3">
            {recordings.map((recording) => (
              <button
                key={recording.id}
                className={cx(
                  'w-full rounded-[24px] border px-4 py-4 text-left transition',
                  selectedId === recording.id ? 'border-violet-200 bg-violet-50' : 'border-slate-200 bg-white',
                )}
                onClick={() => setSelectedId(recording.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{recording.title}</p>
                    <p className="mt-1 text-sm text-slate-500">자동 요약과 핵심 질문 추천이 연결됩니다.</p>
                  </div>
                  <StatusBadge label={recording.status} tone={recording.tone} />
                </div>
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="업로드 상태" subtitle="실제 업로드 전 프론트 진행 상태를 먼저 구성했습니다." />
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="text-sm font-medium text-slate-300">선택된 녹음</p>
            <p className="mt-2 text-2xl font-semibold">{selectedRecording.title}</p>
            <p className="mt-3 text-sm text-slate-300">상태: {selectedRecording.status}</p>
          </div>
          <div className="mt-5">
            <ProgressBar value={uploadProgress} tone={uploadProgress >= 100 ? 'emerald' : 'violet'} />
            <p className="mt-3 text-sm text-slate-500">업로드 진행률 {uploadProgress}%</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')}
              onClick={() => setUploadProgress((current) => (current >= 100 ? 0 : Math.min(current + 40, 100)))}
              type="button"
            >
              <Upload className="h-4 w-4" />
              업로드 진행
            </button>
            <ActionButton href="/teacher/recording/recording-1" label="상세 보기" tone="slate" />
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function TeacherRecordingDetailPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'moments'>('summary')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText('반복문 개념 설명, 학생 질문, 숙제 안내 요약')
      setCopied(true)
    } catch {
      setCopied(true)
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="녹음 상세"
        title="중급 A반 4/8 수업 요약"
        description="요약과 핵심 순간을 탭으로 나눠서, 강사가 필요한 정보만 빨리 볼 수 있도록 구성했습니다."
        backHref="/teacher/recording"
        backLabel="녹음 목록"
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['summary', 'moments'] as const).map((tab) => (
            <button
              key={tab}
              className={cx(
                pillButton,
                activeTab === tab ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === 'summary' ? '요약' : '핵심 순간'}
            </button>
          ))}
        </div>
      </SurfaceCard>

      {activeTab === 'summary' ? (
        <SurfaceCard>
          <SectionHeading title="수업 요약" subtitle="자동 요약 결과" />
          <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5 text-sm leading-7 text-slate-700">
            반복문 개념 차이를 설명하고, 학생 질문 두 개를 추가로 받아 while문 조건식을 다시 예제로 풀어 주었습니다. 마지막 10분에는 숙제 안내와 AI 사용 주의사항을 공지했습니다.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={lineButton} onClick={handleCopy} type="button">
              <Copy className="h-4 w-4" />
              {copied ? '복사 완료' : '요약 복사'}
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'moments' ? (
        <SurfaceCard>
          <SectionHeading title="핵심 순간" subtitle="수업 중 다시 보고 싶은 포인트" />
          <div className="mt-5 space-y-3">
            {[
              '14:12 · 학생 질문: while문은 언제 멈추나요?',
              '14:24 · 예시 코드 판서 구간',
              '15:08 · 숙제 안내 및 AI 사용 유의점',
            ].map((item) => (
              <div key={item} className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  )
}

export function TeacherBotPage() {
  const [activeTab, setActiveTab] = useState<'faq' | 'history' | 'settings'>('faq')
  const [faqItems, setFaqItems] = useState<FaqItem[]>([
    { id: 1, question: '숙제 제출 기한은 언제인가요?', answer: '과제 카드에 보이는 마감일 밤 11시 59분까지 제출하면 됩니다.' },
    { id: 2, question: 'AI를 써도 되나요?', answer: '아이디어 참고는 가능하지만, 사용 여부 메모를 함께 남겨야 합니다.' },
  ])
  const [faqModalOpen, setFaqModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null)
  const [draftQuestion, setDraftQuestion] = useState('')
  const [draftAnswer, setDraftAnswer] = useState('')
  const [settings, setSettings] = useState({ autoReply: true, notifyTeacher: true })

  function openFaqModal(item?: FaqItem) {
    setEditingFaq(item ?? null)
    setDraftQuestion(item?.question ?? '')
    setDraftAnswer(item?.answer ?? '')
    setFaqModalOpen(true)
  }

  function saveFaq() {
    if (!draftQuestion.trim() || !draftAnswer.trim()) {
      return
    }

    if (editingFaq) {
      setFaqItems((current) =>
        current.map((item) =>
          item.id === editingFaq.id ? { ...item, question: draftQuestion, answer: draftAnswer } : item,
        ),
      )
    } else {
      setFaqItems((current) => [
        { id: Date.now(), question: draftQuestion, answer: draftAnswer },
        ...current,
      ])
    }

    setFaqModalOpen(false)
    setEditingFaq(null)
    setDraftQuestion('')
    setDraftAnswer('')
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="질문봇"
        title="자주 묻는 질문과 답변 이력을 한 곳에서 관리해요"
        description="FAQ 등록, 수정, 삭제와 최근 질문 이력 탭을 붙여서 문서에 있던 운영 흐름을 프론트로 옮겼습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => openFaqModal()} type="button">
            <Bot className="h-4 w-4" />
            FAQ 추가
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['faq', 'history', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              className={cx(
                pillButton,
                activeTab === tab ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tab === 'faq' ? 'FAQ' : tab === 'history' ? '질문 이력' : '설정'}
            </button>
          ))}
        </div>
      </SurfaceCard>

      {activeTab === 'faq' ? (
        <div className="space-y-4">
          {faqItems.map((item) => (
            <SurfaceCard key={item.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600">학생 FAQ</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-950">{item.question}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.answer}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className={lineButton} onClick={() => openFaqModal(item)} type="button">수정</button>
                  <button className={cx(lineButton, 'border-rose-200 text-rose-600 hover:border-rose-300')} onClick={() => setFaqItems((current) => current.filter((faq) => faq.id !== item.id))} type="button">삭제</button>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <SurfaceCard>
          <SectionHeading title="최근 질문 이력" subtitle="학생 질문과 답변 상태" />
          <div className="mt-5 space-y-3">
            {[
              '중급 A반 · while문 조건식은 왜 필요하죠? · AI 답변 제공',
              '초급 B반 · CSS flex-wrap은 언제 써요? · 강사 확인 대기',
              '중급 A반 · 숙제 제출 기한 다시 알려 주세요 · FAQ 자동 응답',
            ].map((item) => (
              <div key={item} className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-700">{item}</div>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {activeTab === 'settings' ? (
        <SurfaceCard>
          <SectionHeading title="질문봇 설정" subtitle="자동 응답과 알림 흐름" />
          <div className="mt-5 space-y-3">
            <button className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left" onClick={() => setSettings((current) => ({ ...current, autoReply: !current.autoReply }))} type="button">
              <div>
                <p className="font-semibold text-slate-900">FAQ 자동 응답</p>
                <p className="mt-1 text-sm text-slate-500">등록된 FAQ와 일치하면 먼저 자동 응답합니다.</p>
              </div>
              <StatusBadge label={settings.autoReply ? 'ON' : 'OFF'} tone={settings.autoReply ? 'emerald' : 'slate'} />
            </button>
            <button className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-white px-4 py-4 text-left" onClick={() => setSettings((current) => ({ ...current, notifyTeacher: !current.notifyTeacher }))} type="button">
              <div>
                <p className="font-semibold text-slate-900">강사 알림</p>
                <p className="mt-1 text-sm text-slate-500">직접 확인이 필요한 질문은 강사에게 바로 알립니다.</p>
              </div>
              <StatusBadge label={settings.notifyTeacher ? 'ON' : 'OFF'} tone={settings.notifyTeacher ? 'emerald' : 'slate'} />
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      <OverlayPanel
        open={faqModalOpen}
        onClose={() => setFaqModalOpen(false)}
        title={editingFaq ? 'FAQ 수정' : 'FAQ 등록'}
        description="질문과 답변을 바로 추가하거나 수정할 수 있습니다."
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">질문</span>
          <input className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" onChange={(event) => setDraftQuestion(event.target.value)} value={draftQuestion} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-800">답변</span>
          <textarea className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none" onChange={(event) => setDraftAnswer(event.target.value)} value={draftAnswer} />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setFaqModalOpen(false)} type="button">취소</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={saveFaq} type="button">저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherChurnPage() {
  const rows = [
    { name: '김민수', summary: '출결 하락과 과제 지연이 동시에 발생', score: 80, tone: 'rose' as Tone },
    { name: '정우진', summary: '최근 질문 수 감소와 참여도 저하', score: 58, tone: 'amber' as Tone },
  ]
  const [selected, setSelected] = useState(rows[0])
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="이탈 현황"
        title="강사 관점에서 먼저 챙겨야 할 학생을 빠르게 확인해요"
        description="위험 학생 카드와 상담 메모 패널을 묶어서, 바로 다음 행동으로 이어지는 흐름을 구성했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {rows.map((row) => (
            <SurfaceCard key={row.name}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold text-slate-950">{row.name}</h2>
                    <StatusBadge label={`위험 ${row.score}%`} tone={row.tone} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{row.summary}</p>
                </div>
                <button className={lineButton} onClick={() => { setSelected(row); setContactOpen(true) }} type="button">
                  상담 메모
                </button>
              </div>
              <div className="mt-5">
                <ProgressBar value={row.score} tone={row.tone} />
              </div>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard>
          <SectionHeading title="후속 조치 제안" subtitle="이번 주 먼저 움직일 학생" />
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="text-sm font-medium text-slate-300">우선 학생</p>
            <p className="mt-2 text-2xl font-semibold">{selected.name}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{selected.summary}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={cx(filledButton, 'w-full bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setContactOpen(true)} type="button">
              후속 메모 열기
            </button>
          </div>
        </SurfaceCard>
      </div>

      <OverlayPanel
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={`${selected.name} 상담 메모`}
        description="강사 관점에서 남길 후속 메모와 학부모 전달 포인트를 입력합니다."
      >
        <Field label="메모 제목" defaultValue="출결 회복 체크" />
        <Field label="내용" defaultValue="다음 주 초에 과제 분량을 조금 조정하고, 수업 시작 전 짧게 체크인하기로 했습니다." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setContactOpen(false)} type="button">닫기</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setContactOpen(false)} type="button">메모 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function TeacherProgressPage() {
  const chapters = [
    { title: '중급 A반 · 반복문', progress: 72, detail: '예제 적용까지 완료' },
    { title: '초급 B반 · CSS 레이아웃', progress: 54, detail: 'flex 기초 진행 중' },
    { title: '중급 A반 · 리스트 컴프리헨션', progress: 38, detail: '다음 주 시작 예정' },
  ]
  const [selectedChapter, setSelectedChapter] = useState(chapters[0])
  const [recordOpen, setRecordOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="진도 관리"
        title="반별 진도 상태를 보고 바로 기록을 남길 수 있어요"
        description="진도 카드에서 현재 진행 상태를 확인하고, 기록 패널에서 다음 수업 메모까지 이어서 남길 수 있습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setRecordOpen(true)} type="button">
            <Target className="h-4 w-4" />
            진도 기록
          </button>
        }
      />

      <div className="space-y-4">
        {chapters.map((chapter) => (
          <SurfaceCard key={chapter.title}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">{chapter.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{chapter.detail}</p>
              </div>
              <button className={lineButton} onClick={() => { setSelectedChapter(chapter); setRecordOpen(true) }} type="button">
                기록 열기
              </button>
            </div>
            <div className="mt-5">
              <ProgressBar value={chapter.progress} tone={chapter.progress > 65 ? 'emerald' : chapter.progress > 45 ? 'indigo' : 'amber'} />
            </div>
          </SurfaceCard>
        ))}
      </div>

      <OverlayPanel
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title={`${selectedChapter.title} 진도 기록`}
        description="현재 진도율과 다음 수업 메모를 같이 남길 수 있는 패널입니다."
      >
        <Field label="현재 진도" defaultValue={`${selectedChapter.progress}%`} />
        <Field label="이번 수업 메모" defaultValue={selectedChapter.detail} textarea />
        <Field label="다음 수업 계획" defaultValue="예제 2개를 더 다루고, 학생 질문 시간을 10분 확보합니다." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={lineButton} onClick={() => setRecordOpen(false)} type="button">취소</button>
          <button className={cx(filledButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={() => setRecordOpen(false)} type="button">진도 기록 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}
