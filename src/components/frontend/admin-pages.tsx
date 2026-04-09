'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  MessageSquareWarning,
  Phone,
  Plus,
  Search,
  Sparkles,
  Users,
  UserSquare2,
  X,
} from 'lucide-react'

import {
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

type BadgeTone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

type StudentRow = {
  name: string
  grade: string
  group: string
  attendance: string
  risk: '높음' | '주의' | '정상'
  tone: BadgeTone
  href: string
}

type ComplaintRow = {
  title: string
  parent: string
  group: string
  status: '미처리' | '처리중' | '처리 완료'
  tone: BadgeTone
  summary: string
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'
const chipButton =
  'rounded-full px-3 py-2 text-sm font-medium transition'

const studentRows: StudentRow[] = [
  {
    name: '김민수',
    grade: '중2',
    group: '수학 A반',
    attendance: '72%',
    risk: '높음',
    tone: 'rose',
    href: '/admin/students/kim-minsu',
  },
  {
    name: '이서연',
    grade: '중3',
    group: '영어 B반',
    attendance: '65%',
    risk: '주의',
    tone: 'amber',
    href: '/admin/students/lee-seoyeon',
  },
  {
    name: '박지호',
    grade: '중1',
    group: '수학 A반, 국어 A반',
    attendance: '95%',
    risk: '정상',
    tone: 'emerald',
    href: '/admin/students/park-jiho',
  },
  {
    name: '최하은',
    grade: '중2',
    group: '영어 B반',
    attendance: '88%',
    risk: '정상',
    tone: 'emerald',
    href: '/admin/students/choi-haeun',
  },
]

const teacherRows = [
  { name: '박강사', email: 'park@academind.kr', groups: '수학 A반, 수학 C반', classes: '주 4회', subject: '수학' },
  { name: '김강사', email: 'kim@academind.kr', groups: '영어 B반', classes: '주 2회', subject: '영어' },
  { name: '이강사', email: 'lee@academind.kr', groups: '국어 A반', classes: '주 2회', subject: '국어' },
  { name: '정강사', email: 'jung@academind.kr', groups: '수학 B반', classes: '주 3회', subject: '수학' },
]

const classCards = [
  {
    title: '수학 A반',
    subject: '수학',
    level: '중급',
    teacher: '박강사',
    schedule: '월, 수 16:00 - 18:00',
    seats: '정원 24명 중 19명',
    href: '/admin/classes/math-a',
  },
  {
    title: '영어 B반',
    subject: '영어',
    level: '고급',
    teacher: '김강사',
    schedule: '화, 목 17:00 - 19:00',
    seats: '정원 18명 중 15명',
    href: '/admin/classes/english-b',
  },
  {
    title: '국어 A반',
    subject: '국어',
    level: '중급',
    teacher: '이강사',
    schedule: '수, 금 15:00 - 17:00',
    seats: '정원 16명 중 8명',
    href: '/admin/classes/korean-a',
  },
]

const paymentRows = [
  { name: '김민수', amount: '₩320,000', status: '미납', tone: 'rose' as const, due: '4/12', note: '문자 발송 필요' },
  { name: '이서연', amount: '₩290,000', status: '부분 납부', tone: 'amber' as const, due: '4/10', note: '잔액 ₩90,000' },
  { name: '박지호', amount: '₩320,000', status: '완납', tone: 'emerald' as const, due: '4/05', note: '처리 완료' },
]

const churnRows = [
  { name: '김민수', reason: '출결 하락 + 미납 동시 발생', score: 80, tone: 'rose' as const, owner: '박강사' },
  { name: '이서연', reason: '질문 수 급감 + 과제 지연', score: 64, tone: 'amber' as const, owner: '김강사' },
  { name: '최하은', reason: '최근 2주 출석 변동', score: 41, tone: 'amber' as const, owner: '이강사' },
]

const complaintRows: ComplaintRow[] = [
  {
    title: '수업 시간 변경 요청',
    parent: '김OO',
    group: '수학 A반',
    status: '미처리',
    tone: 'rose',
    summary: '학부모가 화요일 보강 시간을 요청했습니다.',
  },
  {
    title: '과제 난이도 관련 문의',
    parent: '최OO',
    group: '영어 B반',
    status: '처리중',
    tone: 'amber',
    summary: '최근 과제 난이도 상승으로 보완 자료 요청이 들어왔습니다.',
  },
  {
    title: '주차 안내 문의',
    parent: '이OO',
    group: '국어 A반',
    status: '처리 완료',
    tone: 'emerald',
    summary: '정문 공사 기간 중 임시 주차 위치를 안내했습니다.',
  },
]

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
            <p className="text-sm font-medium text-indigo-600">Front Interaction</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
            onClick={onClose}
            type="button"
          >
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
  placeholder,
  textarea = false,
}: {
  label: string
  placeholder: string
  textarea?: boolean
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
          defaultValue={placeholder}
        />
      ) : (
        <input
          className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
          defaultValue={placeholder}
        />
      )}
    </label>
  )
}

export function AdminStudentsPage() {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<'전체' | '높음' | '주의' | '정상'>('전체')
  const [registerOpen, setRegisterOpen] = useState(false)
  const [registerSaved, setRegisterSaved] = useState(false)

  const filteredRows = useMemo(
    () =>
      studentRows.filter((student) => {
        const matchesSearch =
          search.trim().length === 0 ||
          student.name.includes(search) ||
          student.group.includes(search)
        const matchesRisk = riskFilter === '전체' || student.risk === riskFilter
        return matchesSearch && matchesRisk
      }),
    [riskFilter, search],
  )

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 관리"
        title="학생 목록과 위험 신호를 한 화면에서 관리할 수 있어요"
        description="검색, 위험도 필터, 학생 등록, 상세 진입까지 운영자가 실제로 가장 많이 쓰는 흐름을 먼저 붙였습니다."
        action={
          <button
            className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')}
            onClick={() => setRegisterOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            학생 등록
          </button>
        }
      />

      {registerSaved ? (
        <SurfaceCard className="border border-emerald-100 bg-emerald-50/80">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">학생 등록 흐름을 프론트에서 먼저 연결했어요.</p>
              <p className="mt-1 text-sm leading-6 text-emerald-700">
                실제 저장은 아직 아니지만, 운영자가 입력해야 할 항목과 저장 후 피드백 배너 흐름까지 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              <input
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="이름, 반 이름으로 학생 찾기"
                value={search}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {(['전체', '높음', '주의', '정상'] as const).map((risk) => (
                <button
                  key={risk}
                  className={cx(
                    chipButton,
                    riskFilter === risk
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200',
                  )}
                  onClick={() => setRiskFilter(risk)}
                  type="button"
                >
                  {risk === '전체' ? '위험도 전체' : risk}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-300" />
              <p className="text-sm font-semibold">학생 등록 준비</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              이름, 학년, 반 배정, 학부모 연락처까지 한번에 입력하도록 설계했습니다.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
              onClick={() => setRegisterOpen(true)}
              type="button"
            >
              등록 모달 열기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading title="학생 목록" subtitle={`필터 결과 ${filteredRows.length}명`} />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">이름</th>
                  <th className="pb-3 font-medium">학년</th>
                  <th className="pb-3 font-medium">수강반</th>
                  <th className="pb-3 font-medium">출석률</th>
                  <th className="pb-3 font-medium">이탈</th>
                  <th className="pb-3 font-medium text-right">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((student) => (
                  <tr key={student.name}>
                    <td className="py-4 font-semibold text-slate-900">
                      <Link href={student.href} className="transition hover:text-indigo-600">
                        {student.name}
                      </Link>
                    </td>
                    <td className="py-4 text-slate-600">{student.grade}</td>
                    <td className="py-4 text-slate-600">{student.group}</td>
                    <td className="py-4 text-slate-600">{student.attendance}</td>
                    <td className="py-4">
                      <StatusBadge label={student.risk} tone={student.tone} />
                    </td>
                    <td className="py-4 text-right">
                      <Link href={student.href} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
                        보기
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading title="주의 학생 요약" subtitle="목록에서 놓치기 쉬운 학생만 따로 모았습니다." />
            <div className="mt-5 space-y-3">
              {studentRows.slice(0, 3).map((student) => (
                <Link
                  key={student.name}
                  href={student.href}
                  className="block rounded-[24px] border border-slate-200 bg-white px-4 py-4 transition hover:border-indigo-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{student.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{student.group}</p>
                    </div>
                    <StatusBadge label={student.risk} tone={student.tone} />
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={student.name === '김민수' ? 80 : student.name === '이서연' ? 64 : 32} tone={student.tone} />
                  </div>
                </Link>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="등록 체크리스트" subtitle="신규 학생 등록 시 필요한 기본 입력 항목입니다." />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatusBadge label="이름 / 이메일" tone="indigo" />
              <StatusBadge label="학교 / 학년" tone="sky" />
              <StatusBadge label="수강반 매핑" tone="violet" />
              <StatusBadge label="학부모 연락처" tone="amber" />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="신규 학생 등록"
        description="문서에 적힌 기본 등록 플로우를 프론트 모달로 먼저 연결했습니다."
      >
        <Field label="학생 이름" placeholder="김민수" />
        <Field label="이메일" placeholder="minsu@academind.kr" />
        <Field label="학년 / 학교" placeholder="중2 · OO중학교" />
        <Field label="수강반" placeholder="수학 A반, 영어 B반" />
        <Field label="학부모 연락처" placeholder="010-1234-5678" />
        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRegisterOpen(false)} type="button">
            취소
          </button>
          <button
            className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')}
            onClick={() => {
              setRegisterSaved(true)
              setRegisterOpen(false)
            }}
            type="button"
          >
            등록 흐름 저장
          </button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminStudentDetailPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignment' | 'consultation' | 'payment'>('attendance')
  const [editOpen, setEditOpen] = useState(false)
  const [consultOpen, setConsultOpen] = useState(false)

  const assignmentRows = [
    { title: '단원평가 3', group: '수학 A반', due: '04-07', status: '제출', tone: 'emerald' as const },
    { title: 'Essay Draft', group: '영어 B반', due: '04-08', status: '미제출', tone: 'rose' as const },
    { title: '독후감 초안', group: '국어 A반', due: '04-09', status: '제출', tone: 'emerald' as const },
  ]

  const consultationRows = [
    { date: '2026-04-05', title: '전화 상담', note: '출석률 저하 관련 학부모 면담', owner: '박강사' },
    { date: '2026-03-20', title: '방문 상담', note: '학습 동기 부여 상담 진행', owner: '박강사' },
    { date: '2026-03-01', title: '전화 상담', note: '첫 등원 안내 및 수업 설명', owner: '김원장' },
  ]

  const paymentTimeline = [
    { month: '2026년 4월', status: '미납', tone: 'rose' as const, amount: '₩320,000' },
    { month: '2026년 3월', status: '완납', tone: 'emerald' as const, amount: '₩320,000' },
    { month: '2026년 2월', status: '완납', tone: 'emerald' as const, amount: '₩320,000' },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 상세"
        title="김민수 학생의 출결, 과제, 상담, 결제 흐름을 한 번에 확인해요"
        description="탭 전환과 빠른 수정/상담 추가 버튼을 붙여서 운영자가 실제로 보는 순서를 바로 따라갈 수 있게 구성했습니다."
        backHref="/admin/students"
        backLabel="학생 목록"
        action={
          <div className="flex flex-wrap gap-3">
            <button className={secondaryButton} onClick={() => setEditOpen(true)} type="button">
              학생 정보 수정
            </button>
            <button
              className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')}
              onClick={() => setConsultOpen(true)}
              type="button"
            >
              상담 기록 추가
            </button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <SurfaceCard className="h-fit">
          <SectionHeading title="기본 정보" subtitle="학생 요약" />
          <div className="mt-5 space-y-5">
            <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Student</p>
              <h2 className="mt-2 text-2xl font-semibold">김민수</h2>
              <p className="mt-2 text-sm text-slate-300">중2 · OO중학교 · 재원</p>
            </div>
            <div className="grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-4">이메일: minsu@academind.kr</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">학부모 연락처: 010-1234-5678</div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4">수강반: 수학 A반, 영어 B반</div>
            </div>
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-5 py-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-rose-800">이탈 위험도</p>
                <StatusBadge label="80% 위험" tone="rose" />
              </div>
              <div className="mt-4">
                <ProgressBar value={80} tone="rose" />
              </div>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-rose-700">
                <li>출결 부진과 과제 미제출이 동시에 증가</li>
                <li>최근 질문 수 감소로 참여도 하락 신호 감지</li>
              </ul>
            </div>
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <div className="flex flex-wrap gap-2">
              {[
                ['attendance', '출결'],
                ['assignment', '과제'],
                ['consultation', '상담'],
                ['payment', '결제'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={cx(
                    chipButton,
                    activeTab === key
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200',
                  )}
                  onClick={() => setActiveTab(key as 'attendance' | 'assignment' | 'consultation' | 'payment')}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </SurfaceCard>

          {activeTab === 'attendance' ? (
            <SurfaceCard>
              <SectionHeading title="출결 요약" subtitle="이번 달 출결 흐름" />
              <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">4월 출결 달력</p>
                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                    {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                      <div key={day} className="py-2">{day}</div>
                    ))}
                    {Array.from({ length: 21 }).map((_, index) => (
                      <div
                        key={index}
                        className={cx(
                          'rounded-2xl px-2 py-3 font-medium',
                          index === 8 || index === 11 || index === 15
                            ? 'bg-emerald-50 text-emerald-700'
                            : index === 9
                              ? 'bg-amber-50 text-amber-700'
                              : index === 16
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-white text-slate-500 ring-1 ring-slate-200',
                        )}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <MetricCard label="출석" value="8회" detail="정상 출석" icon={CheckCircle2} tone="emerald" />
                  <MetricCard label="지각" value="1회" detail="주의 필요" icon={AlertTriangle} tone="amber" />
                </div>
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'assignment' ? (
            <SurfaceCard>
              <SectionHeading title="과제 현황" subtitle="최근 제출 여부와 마감일" />
              <div className="mt-5 space-y-3">
                {assignmentRows.map((assignment) => (
                  <div key={assignment.title} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{assignment.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{assignment.group} · 마감 {assignment.due}</p>
                      </div>
                      <StatusBadge label={assignment.status} tone={assignment.tone} />
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'consultation' ? (
            <SurfaceCard>
              <SectionHeading
                title="상담 기록"
                subtitle="최근 상담 이력과 후속 조치"
                action={
                  <button className={secondaryButton} onClick={() => setConsultOpen(true)} type="button">
                    상담 추가
                  </button>
                }
              />
              <div className="mt-5 space-y-3">
                {consultationRows.map((row) => (
                  <div key={`${row.date}-${row.title}`} className="rounded-[24px] bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="mt-1 text-sm text-slate-500">{row.date} · {row.owner}</p>
                      </div>
                      <StatusBadge label="후속 체크" tone="amber" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{row.note}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          ) : null}

          {activeTab === 'payment' ? (
            <SurfaceCard>
              <SectionHeading title="결제 이력" subtitle="최근 3개월 수납 상태" />
              <div className="mt-5 space-y-3">
                {paymentTimeline.map((payment) => (
                  <div key={payment.month} className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{payment.month}</p>
                      <p className="mt-1 text-sm text-slate-500">{payment.amount}</p>
                    </div>
                    <StatusBadge label={payment.status} tone={payment.tone} />
                  </div>
                ))}
              </div>
            </SurfaceCard>
          ) : null}
        </div>
      </div>

      <OverlayPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="학생 정보 수정"
        description="상세 화면 안에서 바로 수정하고 다시 돌아오는 흐름을 확인할 수 있습니다."
      >
        <Field label="학생 이름" placeholder="김민수" />
        <Field label="학교 / 학년" placeholder="중2 · OO중학교" />
        <Field label="수강반" placeholder="수학 A반, 영어 B반" />
        <Field label="학부모 연락처" placeholder="010-1234-5678" />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setEditOpen(false)} type="button">닫기</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setEditOpen(false)} type="button">변경 내용 반영</button>
        </div>
      </OverlayPanel>

      <OverlayPanel
        open={consultOpen}
        onClose={() => setConsultOpen(false)}
        title="상담 기록 추가"
        description="전화, 방문, 문자 후속 조치를 같은 패널에서 남길 수 있도록 했습니다."
      >
        <Field label="상담 유형" placeholder="전화 상담" />
        <Field label="담당자" placeholder="박강사" />
        <Field label="상담 내용" placeholder="최근 출석 저하와 과제 지연에 대해 학부모와 상담했습니다." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setConsultOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setConsultOpen(false)} type="button">기록 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminTeachersPage() {
  const [subjectFilter, setSubjectFilter] = useState<'전체' | '수학' | '영어' | '국어'>('전체')
  const [registerOpen, setRegisterOpen] = useState(false)

  const filteredTeachers = teacherRows.filter((teacher) =>
    subjectFilter === '전체' ? true : teacher.subject === subjectFilter,
  )

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 관리"
        title="강사 배정과 반 연결 상태를 빠르게 확인해요"
        description="과목 필터와 강사 등록 패널을 붙여서 실제 운영에서 필요한 관리 흐름을 먼저 구현했습니다."
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setRegisterOpen(true)} type="button">
            <Plus className="h-4 w-4" />
            강사 등록
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['전체', '수학', '영어', '국어'] as const).map((subject) => (
            <button
              key={subject}
              className={cx(
                chipButton,
                subjectFilter === subject
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setSubjectFilter(subject)}
              type="button"
            >
              {subject === '전체' ? '과목 전체' : subject}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {filteredTeachers.map((teacher) => (
            <SurfaceCard key={teacher.email}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">{teacher.subject}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{teacher.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{teacher.email}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">담당 반: {teacher.groups}</p>
                </div>
                <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-800">수업 빈도</p>
                  <p className="mt-2">{teacher.classes}</p>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>

        <div className="space-y-4">
          <MetricCard label="등록 강사" value="12명" detail="활성 강사 11명" icon={UserSquare2} tone="indigo" />
          <MetricCard label="이번 주 공백" value="2타임" detail="대체 강사 배정 필요" icon={CalendarDays} tone="amber" />
          <SurfaceCard>
            <SectionHeading title="운영 메모" subtitle="강사 등록 시 함께 확인할 항목" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <StatusBadge label="과목 / 담당 반" tone="sky" />
              <StatusBadge label="연락처 / 이메일" tone="indigo" />
              <StatusBadge label="시간표 가능 시간" tone="amber" />
              <StatusBadge label="계약 메모" tone="violet" />
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="강사 등록"
        description="강사 카드로 연결되기 전 필요한 필드만 간단하게 정리했습니다."
      >
        <Field label="강사 이름" placeholder="신규 강사" />
        <Field label="이메일" placeholder="teacher@academind.kr" />
        <Field label="담당 과목" placeholder="수학" />
        <Field label="가능 시간대" placeholder="화, 목 16:00 이후 가능" textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRegisterOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setRegisterOpen(false)} type="button">등록 준비 완료</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminClassesPage() {
  const [subjectFilter, setSubjectFilter] = useState<'전체' | '수학' | '영어' | '국어'>('전체')
  const [createOpen, setCreateOpen] = useState(false)

  const filteredClasses = classCards.filter((item) =>
    subjectFilter === '전체' ? true : item.subject === subjectFilter,
  )

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 관리"
        title="반 생성부터 상세 진입까지 운영 흐름을 이어서 확인할 수 있어요"
        description="반 카드를 실제 운영 툴처럼 구성하고, 생성 모달과 상세 화면으로 자연스럽게 이동되도록 만들었습니다."
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setCreateOpen(true)} type="button">
            <Plus className="h-4 w-4" />
            반 생성
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          {(['전체', '수학', '영어', '국어'] as const).map((subject) => (
            <button
              key={subject}
              className={cx(
                chipButton,
                subjectFilter === subject
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200',
              )}
              onClick={() => setSubjectFilter(subject)}
              type="button"
            >
              {subject === '전체' ? '과목 전체' : subject}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredClasses.map((item) => (
          <Link key={item.href} href={item.href}>
            <SurfaceCard className="h-full transition hover:translate-y-[-2px] hover:border-indigo-100">
              <p className="text-sm font-medium text-indigo-600">{item.subject} · {item.level}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-3 text-sm text-slate-500">담당 강사 {item.teacher}</p>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-4">{item.schedule}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4">{item.seats}</div>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                상세 보기
                <ArrowRight className="h-4 w-4" />
              </p>
            </SurfaceCard>
          </Link>
        ))}
      </div>

      <OverlayPanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="반 생성"
        description="반 이름, 과목, 담당 강사, 시간표를 한 패널에서 정의할 수 있도록 정리했습니다."
      >
        <Field label="반 이름" placeholder="수학 C반" />
        <Field label="과목 / 레벨" placeholder="수학 · 중급" />
        <Field label="담당 강사" placeholder="박강사" />
        <Field label="시간표" placeholder="화, 목 18:00 - 20:00" />
        <Field label="운영 메모" placeholder="중간고사 대비 특강 포함" textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setCreateOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setCreateOpen(false)} type="button">반 생성 준비</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminClassDetailPage() {
  const [rosterOpen, setRosterOpen] = useState(false)
  const students = [
    ['김민수', '중2', '출석 72%', '위험'],
    ['박지호', '중1', '출석 95%', '정상'],
    ['최하은', '중2', '출석 88%', '정상'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 상세"
        title="수학 A반 운영 상태와 학생 편성 흐름을 확인해요"
        description="반 정보, 소속 학생, 대기 학생, 편성 액션을 한 흐름으로 이어서 볼 수 있게 만들었습니다."
        backHref="/admin/classes"
        backLabel="반 목록"
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setRosterOpen(true)} type="button">
            학생 편성 관리
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="현재 인원" value="19명" detail="정원 24명" icon={Users} tone="indigo" />
        <MetricCard label="담당 강사" value="박강사" detail="주 2회 수업" icon={UserSquare2} tone="sky" />
        <MetricCard label="다음 수업" value="수 16:00" detail="중간고사 대비" icon={CalendarDays} tone="violet" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading title="현재 학생" subtitle="위험 신호가 있는 학생을 함께 표시합니다." />
          <div className="mt-5 space-y-3">
            {students.map((student) => (
              <div key={student[0]} className="flex items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{student[0]}</p>
                  <p className="mt-1 text-sm text-slate-500">{student[1]} · {student[2]}</p>
                </div>
                <StatusBadge label={student[3]} tone={student[3] === '위험' ? 'rose' : 'emerald'} />
              </div>
            ))}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading title="대기 학생" subtitle="편성 검토가 필요한 학생" />
            <div className="mt-5 space-y-3">
              {['이서연', '한지우'].map((name) => (
                <div key={name} className="rounded-[24px] bg-slate-50 px-4 py-4">
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-sm text-slate-500">입반 상담 완료 · 편성 대기</p>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="반 운영 메모" subtitle="다음 회차 준비" />
            <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
              <p className="font-semibold">중간고사 대비 주간</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">보강 가능 학생과 과제 보완 학생을 함께 확인해 주세요.</p>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        title="학생 편성 관리"
        description="반 편성 / 제외 액션을 프론트 흐름으로 먼저 붙였습니다."
      >
        <Field label="추가할 학생" placeholder="이서연" />
        <Field label="제외 검토 학생" placeholder="없음" />
        <Field label="편성 메모" placeholder="다음 주부터 목요일 보강반 합류 예정" textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRosterOpen(false)} type="button">닫기</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setRosterOpen(false)} type="button">편성 반영</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminSchedulePage() {
  const weeks = ['4월 1주차', '4월 2주차', '4월 3주차']
  const [weekIndex, setWeekIndex] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [showConflict, setShowConflict] = useState(true)

  const scheduleRows = [
    { day: '월', time: '16:00', title: '수학 A반', room: '3강의실', tone: 'indigo' as const },
    { day: '화', time: '17:00', title: '영어 B반', room: '2강의실', tone: 'sky' as const },
    { day: '수', time: '15:00', title: '국어 A반', room: '1강의실', tone: 'violet' as const },
    { day: '목', time: '18:00', title: '수학 B반', room: '3강의실', tone: 'amber' as const },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="시간표"
        title="주간 시간표를 보고 새 수업을 바로 추가할 수 있어요"
        description="주차 이동, 충돌 경고, 새 수업 추가 모달까지 연결해서 운영자가 실제 배정 순서를 확인할 수 있습니다."
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setCreateOpen(true)} type="button">
            <Plus className="h-4 w-4" />
            수업 추가
          </button>
        }
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button className={secondaryButton} onClick={() => setWeekIndex((current) => Math.max(0, current - 1))} type="button">
              <ChevronLeft className="h-4 w-4" />
              이전 주
            </button>
            <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              {weeks[weekIndex]}
            </div>
            <button className={secondaryButton} onClick={() => setWeekIndex((current) => Math.min(weeks.length - 1, current + 1))} type="button">
              다음 주
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <StatusBadge label="강의실 3개 운영" tone="slate" />
        </div>
      </SurfaceCard>

      {showConflict ? (
        <SurfaceCard className="border border-amber-100 bg-amber-50/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-amber-900">목요일 18:00 강의실 충돌 가능성이 있어요.</p>
              <p className="mt-1 text-sm leading-6 text-amber-700">수학 B반과 신규 특강이 같은 강의실을 사용하도록 잡혀 있습니다.</p>
            </div>
            <button className={secondaryButton} onClick={() => setShowConflict(false)} type="button">
              확인 완료
            </button>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scheduleRows.map((row) => (
          <SurfaceCard key={`${row.day}-${row.title}`}>
            <StatusBadge label={row.day} tone={row.tone} />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">{row.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{row.time} · {row.room}</p>
            <p className="mt-4 text-sm text-slate-600">이번 주 배정 기준으로 표시되는 카드입니다.</p>
          </SurfaceCard>
        ))}
      </div>

      <OverlayPanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="새 수업 배정"
        description="시간표 생성 전 강의실, 강사, 반 정보를 한 번에 검토하는 패널입니다."
      >
        <Field label="반 이름" placeholder="중간고사 대비 특강" />
        <Field label="강사" placeholder="박강사" />
        <Field label="요일 / 시간" placeholder="목 18:00 - 19:30" />
        <Field label="강의실" placeholder="3강의실" />
        <div className="rounded-[24px] border border-amber-100 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-700">
          같은 시간대에 3강의실 사용 카드가 있어 충돌 여부를 먼저 확인해 주세요.
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setCreateOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setCreateOpen(false)} type="button">배정안 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminPaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState(paymentRows[0])
  const [recordOpen, setRecordOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="수강료"
        title="미납, 부분 납부, 완납 상태를 보고 바로 수납 처리해요"
        description="학생별 수납 상태를 표와 카드로 나눠 읽고, 각 행에서 수납 모달을 열 수 있게 구성했습니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="미납" value="3건" detail="후속 연락 필요" icon={CircleDollarSign} tone="rose" />
        <MetricCard label="부분 납부" value="2건" detail="잔액 확인 필요" icon={CreditCard} tone="amber" />
        <MetricCard label="완납" value="28건" detail="이번 달 기준" icon={CheckCircle2} tone="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <SectionHeading title="학생별 수납 현황" subtitle="행별로 바로 수납 처리할 수 있습니다." />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">이름</th>
                  <th className="pb-3 font-medium">금액</th>
                  <th className="pb-3 font-medium">마감일</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium text-right">처리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentRows.map((row) => (
                  <tr key={row.name}>
                    <td className="py-4 font-semibold text-slate-900">{row.name}</td>
                    <td className="py-4 text-slate-600">{row.amount}</td>
                    <td className="py-4 text-slate-600">{row.due}</td>
                    <td className="py-4"><StatusBadge label={row.status} tone={row.tone} /></td>
                    <td className="py-4 text-right">
                      <button
                        className="text-sm font-semibold text-indigo-600"
                        onClick={() => {
                          setSelectedPayment(row)
                          setRecordOpen(true)
                        }}
                        type="button"
                      >
                        수납 처리
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="후속 메모" subtitle="운영자가 바로 볼 요약" />
          <div className="mt-5 space-y-3">
            {paymentRows.map((row) => (
              <div key={row.name} className="rounded-[24px] bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{row.name}</p>
                  <StatusBadge label={row.status} tone={row.tone} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{row.note}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <OverlayPanel
        open={recordOpen}
        onClose={() => setRecordOpen(false)}
        title={`${selectedPayment.name} 수납 처리`}
        description="금액, 메모, 결제 수단을 확인하는 프론트용 처리 패널입니다."
      >
        <Field label="수납 금액" placeholder={selectedPayment.amount} />
        <Field label="결제 수단" placeholder="카드 / 계좌이체 / 현금" />
        <Field label="처리 메모" placeholder={selectedPayment.note} textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setRecordOpen(false)} type="button">닫기</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setRecordOpen(false)} type="button">수납 기록 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminChurnPage() {
  const [selectedStudent, setSelectedStudent] = useState(churnRows[0])
  const [contactOpen, setContactOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="이탈 예측"
        title="위험 학생을 보고 바로 연락·후속 조치를 기록해요"
        description="위험 점수만 보는 화면에서 끝나지 않도록, 연락 기록 패널과 운영 메모 흐름까지 함께 붙였습니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="고위험" value="2명" detail="즉시 연락 권장" icon={AlertTriangle} tone="rose" />
        <MetricCard label="주의" value="3명" detail="이번 주 상담 필요" icon={Phone} tone="amber" />
        <MetricCard label="정상 회복" value="4명" detail="최근 2주 기준" icon={Sparkles} tone="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {churnRows.map((student) => (
            <SurfaceCard key={student.name}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold text-slate-950">{student.name}</h2>
                    <StatusBadge label={`위험 ${student.score}%`} tone={student.tone} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{student.reason}</p>
                  <p className="mt-2 text-sm text-slate-500">담당 강사 {student.owner}</p>
                </div>
                <button
                  className={secondaryButton}
                  onClick={() => {
                    setSelectedStudent(student)
                    setContactOpen(true)
                  }}
                  type="button"
                >
                  <Phone className="h-4 w-4" />
                  연락 기록
                </button>
              </div>
              <div className="mt-5">
                <ProgressBar value={student.score} tone={student.tone} />
              </div>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard>
          <SectionHeading title="운영 우선순위" subtitle="이번 주 바로 움직일 학생" />
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="text-sm font-medium text-slate-300">가장 먼저 연락할 학생</p>
            <p className="mt-2 text-2xl font-semibold">{selectedStudent.name}</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{selectedStudent.reason}</p>
          </div>
          <div className="mt-5 space-y-3">
            <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              출결, 과제, 수납 지표가 동시에 흔들릴 때 우선 연락 흐름을 열어두는 구조입니다.
            </div>
            <button className={cx(primaryButton, 'w-full bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setContactOpen(true)} type="button">
              {selectedStudent.name} 연락 패널 열기
            </button>
          </div>
        </SurfaceCard>
      </div>

      <OverlayPanel
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        title={`${selectedStudent.name} 후속 조치 기록`}
        description="운영자와 강사가 같은 톤으로 후속 조치를 남길 수 있게 구성했습니다."
      >
        <Field label="연락 방식" placeholder="학부모 전화" />
        <Field label="담당자" placeholder={selectedStudent.owner} />
        <Field label="후속 메모" placeholder="이번 주 내 출결 회복 여부를 다시 확인하기로 안내했습니다." textarea />
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setContactOpen(false)} type="button">닫기</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setContactOpen(false)} type="button">조치 기록 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}

export function AdminComplaintsPage() {
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow>(complaintRows[0])
  const [responseOpen, setResponseOpen] = useState(false)

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="민원 관리"
        title="민원 접수부터 응답 작성까지 한 흐름에서 처리해요"
        description="민원 카드에서 바로 응답 패널을 열 수 있게 구성해서, 운영자가 뒤로가지 않고 처리 상태를 이어서 관리할 수 있습니다."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          {complaintRows.map((complaint) => (
            <SurfaceCard key={`${complaint.parent}-${complaint.title}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold text-slate-950">{complaint.title}</h2>
                    <StatusBadge label={complaint.status} tone={complaint.tone} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{complaint.parent} · {complaint.group}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{complaint.summary}</p>
                </div>
                <button
                  className={secondaryButton}
                  onClick={() => {
                    setSelectedComplaint(complaint)
                    setResponseOpen(true)
                  }}
                  type="button"
                >
                  응답 작성
                </button>
              </div>
            </SurfaceCard>
          ))}
        </div>

        <div className="space-y-6">
          <MetricCard label="미처리" value="1건" detail="당일 응답 필요" icon={MessageSquareWarning} tone="rose" />
          <MetricCard label="처리중" value="1건" detail="추가 확인 대기" icon={ClipboardList} tone="amber" />
          <MetricCard label="완료" value="8건" detail="이번 달 누적" icon={CheckCircle2} tone="emerald" />
          <SurfaceCard>
            <SectionHeading title="응답 원칙" subtitle="같은 톤으로 답변하기" />
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
              <p>1. 요청 요지를 먼저 요약해 공감 표현을 남깁니다.</p>
              <p>2. 변경 가능한 항목과 어려운 항목을 분리해서 설명합니다.</p>
              <p>3. 후속 일정이나 재답변 시점을 꼭 적습니다.</p>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <OverlayPanel
        open={responseOpen}
        onClose={() => setResponseOpen(false)}
        title={`${selectedComplaint.title} 응답 작성`}
        description="상태 변경과 응답 초안을 한 패널에서 같이 처리하도록 연결했습니다."
      >
        <Field label="처리 상태" placeholder={selectedComplaint.status} />
        <Field label="응답 초안" placeholder="요청 주신 시간 변경 가능 여부를 내부 확인 후 오늘 오후 6시까지 다시 안내드리겠습니다." textarea />
        <div className="rounded-[24px] bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          민원 대상: {selectedComplaint.parent} · {selectedComplaint.group}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className={secondaryButton} onClick={() => setResponseOpen(false)} type="button">취소</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setResponseOpen(false)} type="button">응답 저장</button>
        </div>
      </OverlayPanel>
    </div>
  )
}
