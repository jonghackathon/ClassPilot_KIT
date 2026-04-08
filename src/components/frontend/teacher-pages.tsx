import Link from 'next/link'
import {
  ArrowRight,
  BookCheck,
  Bot,
  CalendarClock,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  FileAudio2,
  Mic2,
  NotebookPen,
  PlayCircle,
  Sparkles,
  Target,
  TrendingUp,
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

const teacherLessons = [
  { time: '14:00 - 15:30', title: '중급 A반', topic: 'Python 반복문과 리스트 컴프리헨션', href: '/teacher/copilot/lesson-1' },
  { time: '16:00 - 17:30', title: '초급 B반', topic: 'HTML/CSS 기초 레이아웃', href: '/teacher/copilot/lesson-2' },
]

export function TeacherAttendancePage() {
  const students = [
    ['이지은', '중2', '출석', '제출'],
    ['정우진', '중3', '지각', '미제출'],
    ['한소영', '중2', '출석', '제출'],
    ['김태호', '중1', '결석', '미제출'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="출결 관리"
        title="수업 전중후 흐름을 끊지 않도록 출결과 과제를 한 페이지에 배치했습니다"
        description="요일 선택, 일일 통계, 반별 학생 상태를 함께 보여주고 모바일에서도 버튼이 무너지지 않도록 카드형으로 구성했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/copilot/lesson-1" label="코파일럿 시작" tone="violet" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="요일별" tone="indigo" />
          <StatusBadge label="주별" />
          <StatusBadge label="전체" />
          <StatusBadge label="2026년 4월 1주차" tone="slate" />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="출석" value="18명" detail="정상 출석" icon={CheckCircle2} tone="emerald" />
        <MetricCard label="지각" value="2명" detail="주의 필요" icon={TrendingUp} tone="amber" />
        <MetricCard label="조퇴" value="0명" detail="오늘 없음" icon={ClipboardCheck} tone="sky" />
        <MetricCard label="결석" value="1명" detail="후속 확인" icon={CircleHelp} tone="rose" />
      </div>

      {teacherLessons.map((lesson) => (
        <SurfaceCard key={lesson.title}>
          <SectionHeading
            title={`${lesson.title} · ${lesson.time}`}
            subtitle={lesson.topic}
            action={<ActionButton href={lesson.href} label="AI 코파일럿" tone="violet" />}
          />
          <div className="mt-5 grid gap-3">
            {students.map(([name, grade, attendance, assignment]) => (
              <div key={`${lesson.title}-${name}`} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="mt-1 text-sm text-slate-500">{grade}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['출석', '지각', '조퇴', '결석'].map((status) => (
                      <button
                        key={status}
                        className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                          attendance === status
                            ? status === '출석'
                              ? 'bg-emerald-600 text-white'
                              : status === '지각'
                                ? 'bg-amber-500 text-white'
                                : status === '결석'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-sky-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={assignment} tone={assignment === '제출' ? 'emerald' : 'rose'} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      ))}
    </div>
  )
}

export function TeacherAssignmentsPage() {
  const assignments = [
    { title: 'Python 반복문 실습', group: '중급 A반', due: '마감 D-2', progress: 67, href: '/teacher/assignments/python-loop' },
    { title: 'HTML 포트폴리오 페이지', group: '초급 B반', due: '마감 D-5', progress: 33, href: '/teacher/assignments/html-portfolio' },
    { title: '리스트 컴프리헨션 연습', group: '중급 A반', due: '마감 D-12', progress: 84, href: '/teacher/assignments/list-comprehension' },
  ]

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 관리"
        title="반별 과제 진행 상황과 제출률을 바로 읽을 수 있는 화면"
        description="과제 목록은 카드형으로 구성하고, 상세 보기로 자연스럽게 연결되도록 했습니다. 오른쪽에는 새 과제 등록 흐름을 함께 보여줍니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/assignments/python-loop" label="대표 과제 상세" tone="indigo" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <SurfaceCard key={assignment.title}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">{assignment.due}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950">{assignment.title}</h2>
                  <p className="mt-2 text-sm text-slate-500">{assignment.group}</p>
                </div>
                <Link href={assignment.href} className="text-sm font-semibold text-indigo-600">
                  상세 보기
                </Link>
              </div>
              <div className="mt-5">
                <ProgressBar value={assignment.progress} tone={assignment.progress > 80 ? 'emerald' : assignment.progress > 50 ? 'indigo' : 'amber'} />
              </div>
              <p className="mt-3 text-sm text-slate-500">제출 현황 {Math.round((assignment.progress / 100) * 12)} / 12</p>
            </SurfaceCard>
          ))}
        </div>

        <SurfaceCard className="h-fit">
          <SectionHeading title="새 과제 등록 흐름" subtitle="실제 등록 폼을 구현할 때 필요한 필드" />
          <div className="mt-5 space-y-3">
            {['반 선택', '과제 제목', '과제 내용', '마감일'].map((field) => (
              <div key={field} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-600">
                {field}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
            <p className="font-semibold">작성 중 메모</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              등록 모달 구현 전에도 필요한 입력 흐름을 페이지에 녹여 두어, 나중에 모달로 분리하기 쉽게 정리했습니다.
            </p>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function TeacherAssignmentDetailPage() {
  const rows = [
    ['이지은', '제출', '2회', '4/6 14:32', '3회', '대기'],
    ['정우진', '제출', '0회', '4/7 09:15', '1회', '완료'],
    ['한소영', '제출', '5회', '4/8 11:20', '7회', '대기'],
    ['김태호', '미제출', '-', '-', '-', '-'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="과제 상세"
        title="Python 반복문 실습 과제의 제출 현황과 작성 이력을 확인해요"
        description="학생별 제출 상태, AI 사용 횟수, 작성 이력, 피드백 여부를 한 표에서 읽을 수 있게 구성했습니다."
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
                <th className="pb-3 font-medium text-right">피드백</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row[0]}>
                  <td className="py-4 font-semibold text-slate-900">{row[0]}</td>
                  <td className="py-4">
                    <StatusBadge label={row[1]} tone={row[1] === '제출' ? 'emerald' : 'rose'} />
                  </td>
                  <td className="py-4 text-slate-600">{row[2]}</td>
                  <td className="py-4 text-slate-600">{row[3]}</td>
                  <td className="py-4 text-slate-600">{row[4]}</td>
                  <td className="py-4 text-right">
                    <StatusBadge label={row[5]} tone={row[5] === '완료' ? 'emerald' : 'amber'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard>
          <SectionHeading title="작성 이력 타임라인" subtitle="대표 학생 한소영 기준" />
          <div className="mt-5 space-y-3">
            {[
              '4/5 10:00 · 120자',
              '4/5 14:30 · 340자',
              '4/6 09:00 · 520자 · AI 사용',
              '4/7 11:00 · 810자 · AI 사용',
              '4/8 11:20 · 1,050자',
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="피드백 작성 흐름" subtitle="전송 전에 참고할 요약" />
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <p className="font-semibold text-slate-900">이지은</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              반복문 기본 사용은 잘 이해하고 있습니다. 리스트 컴프리헨션 문법은 예제 2개를 더 연습해 보면 좋겠습니다.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton href="/teacher/assignments" label="목록으로 저장" tone="indigo" />
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function TeacherCopilotLandingPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title="오늘 수업 중 바로 시작할 세션을 선택해 주세요"
        description="코파일럿은 수업별 세션으로 나뉘므로, 강사는 먼저 수업을 선택한 뒤 질문 제안, 예시 코드, 판서용 핵심 정리를 받는 흐름으로 이동합니다."
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
    ['초보자 설명', 'for문은 반복 횟수가 정해져 있을 때 사용하고, while문은 조건이 유지되는 동안 반복할 때 사용합니다.', 'emerald'],
    ['예시 코드', 'for i in range(5): print(i) / while password != "1234": ...', 'sky'],
    ['심화 추가 질문', 'for를 while로 바꿀 수 있는 상황과, while을 for로 바꿀 수 있는 예를 학생에게 던져보세요.', 'violet'],
    ['판서용 핵심 정리', 'for = 횟수 중심, while = 조건 중심. 상황에 맞게 선택.', 'amber'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="AI 수업 코파일럿"
        title="중급 A반 · Python 반복문과 리스트 컴프리헨션"
        description="현재 질문에 맞춘 설명, 예시 코드, 심화 질문, 판서용 핵심 정리를 4카드 형태로 분리했습니다. 이전 질문 흐름도 아래에서 이어집니다."
        backHref="/teacher/copilot"
        backLabel="수업 선택"
        action={<ActionButton href="/teacher/dashboard" label="세션 종료" tone="rose" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="초보 30%" tone="emerald" />
          <StatusBadge label="중간 50%" tone="sky" />
          <StatusBadge label="심화 20%" tone="violet" />
        </div>
        <div className="mt-5 rounded-[28px] bg-slate-950 px-5 py-5 text-white">
          <p className="text-sm font-medium text-slate-300">현재 질문</p>
          <p className="mt-3 text-xl font-semibold">"for문이랑 while문 중에 어떤 걸 써야 하나요?"</p>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map(([title, content, tone]) => (
          <SurfaceCard key={title}>
            <div className="flex items-center justify-between">
              <StatusBadge label={title} tone={tone as 'emerald' | 'sky' | 'violet' | 'amber'} />
              <StatusBadge label="생성 14:23:05" tone="slate" />
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-600">{content}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ActionButton href="/teacher/copilot/lesson-1" label="복사 흐름 보기" tone={tone as 'emerald' | 'sky' | 'violet' | 'amber'} />
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <SectionHeading title="이전 질문" subtitle="최근 2개 질문 히스토리" />
        <div className="mt-5 space-y-3">
          {[
            '14:15 · range(1,10)이면 10은 포함 안 되나요?',
            '14:08 · 파이썬에서 들여쓰기 꼭 해야 하나요?',
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
          <Sparkles className="h-4 w-4 text-violet-500" />
          다음 질문을 입력하거나 음성으로 수집하는 입력 영역이 이 위치에 들어갑니다.
        </div>
      </SurfaceCard>
    </div>
  )
}

export function TeacherRecordingPage() {
  const recordings = [
    ['중급 A반 · 4/7 (화)', '완료', '/teacher/recording/20260407-a'],
    ['초급 B반 · 4/7 (화)', '완료', '/teacher/recording/20260407-b'],
    ['중급 A반 · 4/6 (월)', '변환 중 42%', '/teacher/recording/20260406-a'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="수업 녹음 정리"
        title="업로드부터 요약 상세 확인까지 하나의 흐름으로 정리했습니다"
        description="드래그 앤 드롭 업로드 영역, 진행률, 최근 요약 내역을 같은 화면에 배치해 녹음 정리 흐름이 끊기지 않도록 했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/recording/20260407-a" label="최근 요약 보기" tone="violet" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <SurfaceCard>
          <div className="rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <FileAudio2 className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-4 text-lg font-semibold text-slate-900">파일을 드래그하거나 클릭하여 업로드하세요</p>
            <p className="mt-2 text-sm text-slate-500">mp3 / m4a / wav · 최대 100MB</p>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl bg-white px-4 py-4 ring-1 ring-slate-200">수업 선택: 중급 A반 · 4/8 14:00</div>
            <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
              업로드 중... lesson_20260408.mp3 · 65%
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeading title="최근 정리 내역" subtitle="완료 / 변환 중 상태를 함께 표시합니다." />
          <div className="mt-5 space-y-3">
            {recordings.map(([title, status, href]) => (
              <Link key={title} href={href} className="block rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-violet-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">녹음 요약 상세로 이동</p>
                  </div>
                  <StatusBadge label={status} tone={status === '완료' ? 'emerald' : 'amber'} />
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

export function TeacherRecordingDetailPage() {
  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="수업 녹음 요약"
        title="중급 A반 · 4/7 (화) 14:00 - 15:30"
        description="수업 녹음 정리 결과를 개념, 질문, 강사 답변 요약, 다음 수업 포인트까지 한 흐름으로 보여줍니다."
        backHref="/teacher/recording"
        backLabel="녹음 목록"
        action={<ActionButton href="/teacher/progress" label="진도 관리 연결" tone="indigo" />}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SurfaceCard>
          <SectionHeading title="다룬 개념" />
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>1. for문 기본 문법과 range, enumerate</p>
            <p>2. while문과 break, continue</p>
            <p>3. 중첩 반복문</p>
            <p>4. 리스트 컴프리헨션 기초</p>
          </div>
        </SurfaceCard>
        <SurfaceCard>
          <SectionHeading title="학생 질문" />
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
            <p>Q1. range(1,10)이면 10은 포함 안 되나요?</p>
            <p>Q2. for문이랑 while문 중에 어떤 걸 써야 하나요?</p>
            <p>Q3. 리스트 컴프리헨션이 왜 더 빠른가요?</p>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <SectionHeading title="강사 답변 요약" subtitle="다음 수업 준비와 연결되는 요약" />
        <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
          <p>A1. range는 끝값을 포함하지 않으므로 range(1, 11)을 사용해야 한다고 설명했습니다.</p>
          <p>A2. 횟수가 정해져 있으면 for, 조건 기반이면 while을 사용하는 방식으로 정리했습니다.</p>
          <p>A3. 리스트 컴프리헨션은 간단한 변환에서 유리하지만 복잡한 로직은 일반 for문을 유지하는 편이 좋다고 안내했습니다.</p>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="다음 수업 포인트" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {['조건부 리스트 컴프리헨션', '이중 for 구조', '성능 비교 실습'].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export function TeacherBotPage() {
  const questions = [
    ['range(1,10)이면 10은 포함 안 되나요?', '이지은 · 중급 A반', '도움 안 됨'],
    ['CSS에서 margin과 padding 차이가 뭔가요?', '박준호 · 초급 B반', 'AI 응답 없음'],
    ['변수 이름에 한글을 써도 되나요?', '최서연 · 초급 B반', 'AI 응답 없음'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="질문봇 관리"
        title="미답변 질문, 전체 로그, FAQ 흐름을 한 화면에서 확인합니다"
        description="강사가 AI 답변을 참고해 직접 보완하고, 필요하면 FAQ로 등록하는 흐름을 자연스럽게 이어갈 수 있도록 설계했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/churn" label="이탈 현황 보기" tone="amber" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label="미답변 3건" tone="rose" />
          <StatusBadge label="전체" tone="slate" />
          <StatusBadge label="FAQ" tone="violet" />
          <StatusBadge label="반 전체" />
        </div>
      </SurfaceCard>

      <div className="space-y-4">
        {questions.map(([question, owner, feedback]) => (
          <SurfaceCard key={question}>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold text-slate-950">{question}</h2>
                <p className="mt-2 text-sm text-slate-500">{owner}</p>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">AI 응답</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    range는 반열린구간을 사용하며, margin은 요소 바깥, padding은 요소 안쪽 여백이라는 식으로 핵심만 요약해서 전달합니다.
                  </p>
                </div>
                <div className="mt-4">
                  <StatusBadge label={feedback} tone={feedback === '도움 안 됨' ? 'rose' : 'slate'} />
                </div>
              </div>

              <div className="space-y-3 xl:min-w-[220px]">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-600">
                  강사 추가 답변 입력 영역
                </div>
                <ActionButton href="/teacher/bot" label="답변 전송" tone="indigo" />
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <SectionHeading title="FAQ" subtitle="자주 반복되는 질문은 하단에 누적합니다." />
        <div className="mt-5 grid gap-3">
          {[
            'range() 함수에서 끝값이 포함되지 않는 이유는?',
            'margin과 padding의 차이는?',
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="font-semibold text-slate-900">{item}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                인덱싱 일관성과 학습 설명 편의를 위해 자주 사용하는 FAQ입니다.
              </p>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  )
}

export function TeacherChurnPage() {
  const students = [
    ['김하늘', '초급 B반', 82, '출석률 급감 · 과제 미제출 연속 3회', 'rose'],
    ['이서준', '중급 A반', 72, '결석 2회 연속 · 학습 진도 정체', 'rose'],
    ['정우진', '중급 A반', 54, '질문 빈도 감소 · 최근 지각 2회', 'amber'],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="담당 반 이탈 현황"
        title="강사 관점에서 먼저 확인해야 할 학생을 위험도순으로 정리했습니다"
        description="운영자 전용 연락과 이탈 처리는 숨기고, 강사는 수업 중 관찰해야 할 신호와 학생 상세 이동만 빠르게 할 수 있도록 구성했습니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
      />

      <div className="space-y-4">
        {students.map(([name, group, score, reason, tone]) => (
          <SurfaceCard key={name}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-slate-950">{name}</h2>
                  <StatusBadge label={`${score}%`} tone={tone as 'rose' | 'amber'} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{group}</p>
                <div className="mt-4">
                  <ProgressBar value={score} tone={tone as 'rose' | 'amber'} />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{reason}</p>
              </div>
              <ActionButton href="/admin/students/kim-minsu" label="학생 상세" tone="indigo" />
            </div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <p className="text-sm font-medium text-slate-500">
          연락 및 이탈 처리 기능은 운영자 전용입니다. 강사 화면에서는 학생 상태를 파악하고 수업/과제 흐름을 조정하는 데 집중합니다.
        </p>
      </SurfaceCard>
    </div>
  )
}

export function TeacherProgressPage() {
  const units = [
    ['1. 파이썬 소개 및 설치', '완료', '3/4', ''],
    ['2. 변수와 자료형', '완료', '3/7', ''],
    ['7. 리스트와 튜플', '완료', '4/1', '보충 필요'],
    ['8. 딕셔너리와 세트', '진행중', '4/8', ''],
    ['9. 문자열 처리', '예정', '4/11', ''],
  ] as const

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="진도 관리"
        title="반별 커리큘럼 진행률과 단원 상태를 한눈에 읽을 수 있어요"
        description="완료, 진행중, 예정 상태를 표로 정리하고 진도 기록 모달이 들어갈 위치까지 함께 고려한 화면입니다."
        backHref="/teacher/dashboard"
        backLabel="강사 홈"
        action={<ActionButton href="/teacher/recording" label="녹음 요약 확인" tone="sky" />}
      />

      <SurfaceCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge label="중급 A반" tone="indigo" />
          <ActionButton href="/teacher/progress" label="진도 기록" tone="indigo" />
        </div>
        <div className="mt-5">
          <ProgressBar value={58} tone="indigo" />
        </div>
        <p className="mt-3 text-sm text-slate-500">전체 진행률 58% · 7 / 12 단원</p>
      </SurfaceCard>

      <SurfaceCard>
        <SectionHeading title="단원별 상태" subtitle="커리큘럼: Python 기초 마스터 과정" />
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 font-medium">단원명</th>
                <th className="pb-3 font-medium">상태</th>
                <th className="pb-3 font-medium">수업일</th>
                <th className="pb-3 font-medium">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => (
                <tr key={unit[0]}>
                  <td className="py-4 font-semibold text-slate-900">{unit[0]}</td>
                  <td className="py-4">
                    <StatusBadge
                      label={unit[1]}
                      tone={unit[1] === '완료' ? 'emerald' : unit[1] === '진행중' ? 'sky' : 'slate'}
                    />
                  </td>
                  <td className="py-4 text-slate-600">{unit[2]}</td>
                  <td className="py-4 text-slate-600">{unit[3] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  )
}
