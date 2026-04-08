import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  MessageSquareWarning,
  Search,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  UserSquare2,
} from 'lucide-react'

import {
  ActionButton,
  MetricCard,
  PageHero,
  ProgressBar,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
} from '@/components/frontend/common'

const studentRows = [
  {
    name: '김민수',
    grade: '중2',
    group: '수학 A반',
    attendance: '72%',
    risk: '높음',
    tone: 'rose' as const,
    href: '/admin/students/kim-minsu',
  },
  {
    name: '이서연',
    grade: '중3',
    group: '영어 B반',
    attendance: '65%',
    risk: '주의',
    tone: 'amber' as const,
    href: '/admin/students/lee-seoyeon',
  },
  {
    name: '박지호',
    grade: '중1',
    group: '수학 A반, 국어 A반',
    attendance: '95%',
    risk: '정상',
    tone: 'emerald' as const,
    href: '/admin/students/park-jiho',
  },
  {
    name: '최하은',
    grade: '중2',
    group: '영어 B반',
    attendance: '88%',
    risk: '정상',
    tone: 'emerald' as const,
    href: '/admin/students/choi-haeun',
  },
]

const teacherRows = [
  { name: '박강사', email: 'park@academind.kr', groups: '수학 A반, 수학 C반', classes: '8회' },
  { name: '김강사', email: 'kim@academind.kr', groups: '영어 B반', classes: '4회' },
  { name: '이강사', email: 'lee@academind.kr', groups: '국어 A반', classes: '3회' },
  { name: '정강사', email: 'jung@academind.kr', groups: '수학 B반', classes: '4회' },
]

const classCards = [
  {
    title: '수학 A반',
    subject: '수학',
    level: '중급',
    teacher: '박강사',
    schedule: '월, 수 16:00 - 18:00',
    seats: 80,
    href: '/admin/classes/math-a',
  },
  {
    title: '영어 B반',
    subject: '영어',
    level: '고급',
    teacher: '김강사',
    schedule: '화, 목 17:00 - 19:00',
    seats: 83,
    href: '/admin/classes/english-b',
  },
  {
    title: '국어 A반',
    subject: '국어',
    level: '중급',
    teacher: '이강사',
    schedule: '수, 금 15:00 - 17:00',
    seats: 50,
    href: '/admin/classes/korean-a',
  },
]

const complaints = [
  {
    title: '수업 시간 변경 요청',
    parent: '김OO',
    group: '수학 A반',
    status: '미처리',
    tone: 'rose' as const,
  },
  {
    title: '과제 난이도 관련 문의',
    parent: '최OO',
    group: '영어 B반',
    status: '처리중',
    tone: 'amber' as const,
  },
]

export function AdminStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 관리"
        title="학생 목록과 위험 신호를 한 화면에서 관리할 수 있어요"
        description="검색, 필터, 위험도 확인, 학생 등록까지 한 흐름으로 구성했습니다. 운영자는 목록에서 바로 문제 학생을 찾고 상세 페이지로 이동할 수 있습니다."
        action={<ActionButton href="/admin/students/kim-minsu" label="대표 학생 상세 보기" />}
      />

      <SurfaceCard>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
              <Search className="h-4 w-4" />
              이름 또는 이메일로 학생 검색
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="반 전체" />
              <StatusBadge label="상태 전체" />
              <StatusBadge label="위험도 전체" />
              <StatusBadge label="이름순" tone="indigo" />
            </div>
          </div>
          <div className="rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-sky-300" />
              <p className="text-sm font-semibold">학생 등록 준비</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              이름, 이메일, 학년, 수강반, 학부모 연락처까지 한 번에 등록하도록 흐름을 잡았습니다.
            </p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <SectionHeading title="학생 목록" subtitle="총 87명 중 위험 학생 5명" />
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
                {studentRows.map((student) => (
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
    </div>
  )
}

export function AdminStudentDetailPage() {
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

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="학생 상세"
        title="김민수 학생의 출결, 과제, 상담, 결제 흐름을 한 번에 확인해요"
        description="왼쪽에는 기본 정보와 위험도 요약을 두고, 오른쪽에는 출결과 과제, 상담, 결제 이력을 순서대로 배치했습니다."
        backHref="/admin/students"
        backLabel="학생 목록"
        action={
          <div className="flex flex-wrap gap-3">
            <ActionButton href="/admin/students" label="목록으로 이동" tone="slate" />
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
            <SectionHeading title="출결 요약" subtitle="이번 달 출결 흐름" />
            <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">4월 출결 달력</p>
                <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
                  {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
                    <div key={day} className="py-2">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 21 }).map((_, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl px-2 py-3 font-medium ${
                        index === 8 || index === 11 || index === 15
                          ? 'bg-emerald-50 text-emerald-700'
                          : index === 9
                            ? 'bg-amber-50 text-amber-700'
                            : index === 16
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-white text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3">
                <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                  <p className="text-sm font-medium text-emerald-700">출석 18회</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-800">72%</p>
                </div>
                <div className="rounded-2xl bg-amber-50 px-4 py-4">
                  <p className="text-sm font-medium text-amber-700">지각 2회</p>
                  <p className="mt-1 text-2xl font-semibold text-amber-800">8%</p>
                </div>
                <div className="rounded-2xl bg-rose-50 px-4 py-4">
                  <p className="text-sm font-medium text-rose-700">결석 5회</p>
                  <p className="mt-1 text-2xl font-semibold text-rose-800">20%</p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SurfaceCard>
              <SectionHeading title="과제 제출 현황" subtitle="제출률 75%" />
              <div className="mt-5 space-y-3">
                {assignmentRows.map((row) => (
                  <div key={row.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{row.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {row.group} · {row.due}
                        </p>
                      </div>
                      <StatusBadge label={row.status} tone={row.tone} />
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <SectionHeading title="상담 타임라인" subtitle="최근 상담 이력" />
              <div className="mt-5 space-y-4">
                {consultationRows.map((row) => (
                  <div key={row.date} className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {row.date} · {row.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{row.note}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{row.owner}</p>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          </div>

          <SurfaceCard>
            <SectionHeading title="결제 이력" subtitle="총 납부 900,000원 · 미납 300,000원" />
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {[
                { month: '4월', amount: '₩300,000', status: '미납', tone: 'rose' as const },
                { month: '3월', amount: '₩300,000', status: '납부', tone: 'emerald' as const },
                { month: '2월', amount: '₩300,000', status: '납부', tone: 'emerald' as const },
                { month: '1월', amount: '₩300,000', status: '납부', tone: 'emerald' as const },
              ].map((row) => (
                <div key={row.month} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <p className="text-sm text-slate-500">{row.month}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{row.amount}</p>
                  <div className="mt-3">
                    <StatusBadge label={row.status} tone={row.tone} />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  )
}

export function AdminTeachersPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="강사 관리"
        title="강사별 담당반과 수업량을 함께 보는 운영 화면"
        description="이름 검색, 담당반 확인, 수업량 요약이 한 화면에 정리되어 있어 반 배정과 일정 조율을 빠르게 할 수 있습니다."
        action={<ActionButton href="/admin/classes" label="반 관리로 이동" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 lg:min-w-[360px]">
            <Search className="h-4 w-4" />
            이름 또는 이메일 검색
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge label="수학" tone="indigo" />
            <StatusBadge label="영어" tone="sky" />
            <StatusBadge label="국어" tone="violet" />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard>
          <SectionHeading title="강사 목록" subtitle="현재 등록된 강사 5명" />
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">이름</th>
                  <th className="pb-3 font-medium">이메일</th>
                  <th className="pb-3 font-medium">담당반</th>
                  <th className="pb-3 font-medium text-right">수업수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teacherRows.map((teacher) => (
                  <tr key={teacher.email}>
                    <td className="py-4 font-semibold text-slate-900">{teacher.name}</td>
                    <td className="py-4 text-slate-600">{teacher.email}</td>
                    <td className="py-4 text-slate-600">{teacher.groups}</td>
                    <td className="py-4 text-right text-slate-900">{teacher.classes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="등록 흐름" subtitle="새 강사 등록 시 필요한 핵심 항목" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-semibold text-slate-900">기본 정보</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">이름, 이메일, 연락처 입력</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-semibold text-slate-900">담당 과목</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">수학, 영어, 국어 체크</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-semibold text-slate-900">담당 반</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">반별 수업 배정과 중복 확인</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
              <p className="font-semibold">권장 흐름</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">강사 등록 후 바로 반 관리에서 시간표와 연결</p>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function AdminClassesPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 관리"
        title="반 구성, 정원, 강사, 시간표를 카드형으로 빠르게 훑어볼 수 있어요"
        description="과목, 요일, 강사 필터를 기준으로 반을 정렬하고 상세 보기로 자연스럽게 이어지도록 구성했습니다."
        action={<ActionButton href="/admin/schedule" label="주간 시간표 보기" tone="sky" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="과목 전체" />
          <StatusBadge label="요일 전체" />
          <StatusBadge label="강사 전체" />
          <StatusBadge label="정원 임박" tone="amber" />
        </div>
      </SurfaceCard>

      <div className="grid gap-5 xl:grid-cols-3">
        {classCards.map((card) => (
          <SurfaceCard key={card.title} className="h-full">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.subject} · {card.level}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{card.title}</h2>
              </div>
              <StatusBadge label={`${card.seats}%`} tone={card.seats > 75 ? 'amber' : 'emerald'} />
            </div>
            <div className="mt-5 space-y-2 text-sm leading-6 text-slate-600">
              <p>강사: {card.teacher}</p>
              <p>시간: {card.schedule}</p>
              <p>수강생: {Math.round(card.seats / 10)} / 10</p>
            </div>
            <div className="mt-4">
              <ProgressBar value={card.seats} tone={card.seats > 75 ? 'amber' : 'emerald'} />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton href={card.href} label="상세 보기" />
              <ActionButton href="/admin/schedule" label="시간표 확인" tone="slate" />
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

export function AdminClassDetailPage() {
  const members = [
    { name: '김민수', grade: '중2', attendance: '72%', status: '재원', href: '/admin/students/kim-minsu' },
    { name: '박지호', grade: '중1', attendance: '95%', status: '재원', href: '/admin/students/park-jiho' },
    { name: '정도윤', grade: '중3', attendance: '91%', status: '재원', href: '/admin/students/jeong-doyun' },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="반 상세"
        title="수학 A반의 학생, 시간표, 진도 현황을 한 페이지로 묶었습니다"
        description="반 관리의 핵심은 학생 현황과 시간표, 진도가 끊기지 않고 이어지는 것입니다. 세 영역을 한 화면에 배치해 흐름을 유지했습니다."
        backHref="/admin/classes"
        backLabel="반 관리"
        action={<ActionButton href="/admin/students" label="학생 목록 열기" />}
      />

      <SurfaceCard>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">과목</p>
            <p className="mt-2 text-lg font-semibold">수학 · 중급</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">강사</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">박강사</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">시간</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">월, 수 16:00</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">정원</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">8 / 10</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard>
          <SectionHeading title="수강생 목록" subtitle="반 내 학생 관리" action={<ActionButton href="/admin/students" label="학생 등록" tone="violet" />} />
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="pb-3 font-medium">이름</th>
                  <th className="pb-3 font-medium">학년</th>
                  <th className="pb-3 font-medium">출석률</th>
                  <th className="pb-3 font-medium">상태</th>
                  <th className="pb-3 font-medium text-right">이동</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member.name}>
                    <td className="py-4 font-semibold text-slate-900">
                      <Link href={member.href}>{member.name}</Link>
                    </td>
                    <td className="py-4 text-slate-600">{member.grade}</td>
                    <td className="py-4 text-slate-600">{member.attendance}</td>
                    <td className="py-4">
                      <StatusBadge label={member.status} tone="emerald" />
                    </td>
                    <td className="py-4 text-right">
                      <Link href={member.href} className="text-sm font-medium text-indigo-600">
                        학생 상세
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
            <SectionHeading title="시간표" subtitle="이번 주 기준" />
            <div className="mt-5 space-y-3">
              {['월요일 16:00 - 18:00 · 301호', '수요일 16:00 - 18:00 · 301호'].map((line) => (
                <div key={line} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                  {line}
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="진도 현황" subtitle="전체 진행률 60%" />
            <div className="mt-5">
              <ProgressBar value={60} tone="indigo" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                ['1주차', '1단원 함수', '완료', 'emerald'],
                ['2주차', '2단원 방정식', '완료', 'emerald'],
                ['3주차', '4단원 도형', '진행중', 'sky'],
                ['4주차', '5단원 확률', '예정', 'slate'],
              ].map(([week, title, status, tone]) => (
                <div key={`${week}-${title}`} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{week}</p>
                      <p className="mt-1 text-sm text-slate-500">{title}</p>
                    </div>
                    <StatusBadge label={status} tone={tone as 'emerald' | 'sky' | 'slate'} />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </div>
    </div>
  )
}

export function AdminSchedulePage() {
  const schedule = [
    { time: '16:00', mon: '수학 A반', tue: '수학 B반', wed: '수학 A반', thu: '수학 B반', fri: '영어 A반' },
    { time: '17:00', mon: '', tue: '영어 B반', wed: '국어 A반', thu: '영어 B반', fri: '' },
    { time: '18:00', mon: '', tue: '', wed: '수학 C반', thu: '', fri: '' },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="시간표"
        title="주간 수업 시간을 격자 형태로 빠르게 확인해요"
        description="운영자는 수업 블록을 보고 바로 반 상세로 이동하거나 빈 시간을 확인할 수 있습니다. 모바일에서는 리스트형으로도 읽히도록 단순한 구조로 정리했습니다."
        action={<ActionButton href="/admin/classes" label="반 카드 보기" tone="sky" />}
      />

      <SurfaceCard>
        <SectionHeading title="2026년 4월 2주차" subtitle="과목별 색상은 상세 페이지에서 더 정교하게 연결됩니다." />
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">시간</th>
                {['월', '화', '수', '목', '금'].map((day) => (
                  <th key={day} className="pb-3 font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((row) => (
                <tr key={row.time}>
                  <td className="py-4 font-semibold text-slate-900">{row.time}</td>
                  {([row.mon, row.tue, row.wed, row.thu, row.fri] as string[]).map((lesson, index) => (
                    <td key={`${row.time}-${index}`} className="py-4">
                      {lesson ? (
                        <Link
                          href="/admin/classes/math-a"
                          className="block rounded-2xl bg-indigo-50 px-3 py-3 font-medium text-indigo-700"
                        >
                          {lesson}
                        </Link>
                      ) : (
                        <div className="rounded-2xl bg-slate-50 px-3 py-3 text-slate-400">비어 있음</div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  )
}

export function AdminPaymentsPage() {
  const rows = [
    { name: '김민수', group: '수학 A반', amount: '₩300,000', status: '미납', tone: 'rose' as const },
    { name: '이서연', group: '영어 B반', amount: '₩300,000', status: '미납', tone: 'rose' as const },
    { name: '박지호', group: '수학 A반', amount: '₩300,000', status: '납부', tone: 'emerald' as const },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="수강료 관리"
        title="납부 상태를 월 단위로 정리하고 미납 건을 빠르게 추적합니다"
        description="총액, 납부 완료, 미납 현황을 먼저 보여주고 아래 표에서 학생별 상태를 확인할 수 있도록 구성했습니다."
        action={<ActionButton href="/admin/students/kim-minsu" label="미납 학생 보기" tone="amber" />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="총 수강료" value="₩26,100,000" detail="87명 기준" icon={CircleDollarSign} tone="indigo" />
        <MetricCard label="납부 완료" value="₩25,200,000" detail="84명 완료" icon={TrendingUp} tone="emerald" />
        <MetricCard label="미납" value="₩900,000" detail="3명 확인 필요" icon={BellRing} tone="rose" />
      </div>

      <SurfaceCard>
        <SectionHeading title="4월 수강료 리스트" subtitle="연도, 월, 상태 필터 기반" />
        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge label="2026년 4월" tone="slate" />
          <StatusBadge label="상태 전체" />
          <StatusBadge label="반 전체" />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">학생</th>
                <th className="pb-3 font-medium">반</th>
                <th className="pb-3 font-medium">금액</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium text-right">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="py-4 font-semibold text-slate-900">
                    <Link href="/admin/students/kim-minsu">{row.name}</Link>
                  </td>
                  <td className="py-4 text-slate-600">{row.group}</td>
                  <td className="py-4 text-slate-600">{row.amount}</td>
                  <td className="py-4">
                    <StatusBadge label={row.status} tone={row.tone} />
                  </td>
                  <td className="py-4 text-right text-indigo-600">학생 보기</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  )
}

export function AdminChurnPage() {
  const students = [
    {
      name: '김민수',
      group: '수학 A반 · 중2',
      score: 80,
      detail: '출결 70 · 과제 50 · 접속 30 · 질문 20',
      tone: 'rose' as const,
      href: '/admin/students/kim-minsu',
    },
    {
      name: '이서연',
      group: '영어 B반 · 중3',
      score: 70,
      detail: '출결 60 · 과제 40 · 접속 50 · 질문 60',
      tone: 'rose' as const,
      href: '/admin/students/lee-seoyeon',
    },
    {
      name: '최하은',
      group: '영어 B반 · 중2',
      score: 50,
      detail: '출결 45 · 과제 52 · 접속 48 · 질문 38',
      tone: 'amber' as const,
      href: '/admin/students/choi-haeun',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="이탈 예측 레이더"
        title="위험 학생을 점수와 요인 단위로 빠르게 읽을 수 있게 구성했습니다"
        description="연락과 이탈 처리 전 단계에서 운영자가 어떤 학생을 먼저 봐야 하는지 명확하게 보여주는 페이지입니다."
        action={<ActionButton href="/admin/students" label="학생 목록으로 이동" tone="rose" />}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="위험" value="2명" detail="즉시 상담 권장" icon={AlertTriangle} tone="rose" />
        <MetricCard label="주의" value="3명" detail="이번 주 추적 필요" icon={TrendingUp} tone="amber" />
        <MetricCard label="정상" value="82명" detail="안정적 흐름" icon={Users} tone="emerald" />
      </div>

      <div className="space-y-4">
        {students.map((student) => (
          <SurfaceCard key={student.name}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-slate-950">{student.name}</h2>
                  <StatusBadge label={`${student.score}%`} tone={student.tone} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{student.group}</p>
                <div className="mt-4">
                  <ProgressBar value={student.score} tone={student.tone} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{student.detail}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <ActionButton href={student.href} label="학생 상세" tone="indigo" />
                <ActionButton href="/admin/complaints" label="연락 기록" tone="slate" />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}

export function AdminComplaintsPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="민원 관리"
        title="민원 상태와 AI 초안 응답을 함께 검토하는 운영 화면"
        description="미처리, 처리중, 완료 흐름을 분리하고 학부모 문의에 바로 대응할 수 있도록 응답 초안과 상세 패널을 같이 배치했습니다."
        action={<ActionButton href="/admin/payments" label="수강료 문의 보기" tone="amber" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="미처리 3건" tone="rose" />
          <StatusBadge label="처리중 2건" tone="amber" />
          <StatusBadge label="완료 15건" tone="emerald" />
          <StatusBadge label="전체 20건" tone="slate" />
        </div>
      </SurfaceCard>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <SurfaceCard key={complaint.title}>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-2xl bg-slate-950 p-3 text-white">
                    <MessageSquareWarning className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">{complaint.title}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      학부모 {complaint.parent} · {complaint.group} · 2026-04-07
                    </p>
                  </div>
                </div>
                <StatusBadge label={complaint.status} tone={complaint.tone} />
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  "아이가 다른 학원 시간과 겹쳐서 현재 반 시간을 변경할 수 있을지 문의드립니다. 가능한 대안 반과 시간대를 함께 확인하고 싶습니다."
                </p>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">AI 응답 초안</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    안녕하세요. 문의 주셔서 감사합니다. 현재 유사 시간대 대체 가능한 반을 함께 검토해 보고, 운영 가능한 옵션을 정리해 연락드리겠습니다.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <ActionButton href="/admin/complaints" label="AI 초안 사용" tone="indigo" />
                <ActionButton href="/admin/complaints" label="직접 작성" tone="slate" />
                <ActionButton href="/admin/students/kim-minsu" label="학생 상세" tone="violet" />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  )
}
