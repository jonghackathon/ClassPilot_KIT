'use client'

import { useMemo, useState } from 'react'
import { BookOpen, CheckCircle2, GraduationCap, Plus, Target, Users, X } from 'lucide-react'

import {
  MetricCard,
  PageHero,
  SectionHeading,
  StatusBadge,
  SurfaceCard,
  cx,
} from '@/components/frontend/common'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-slate-900'

type LessonItem = {
  id: string
  title: string
  summary: string
}

type StageItem = {
  id: string
  title: string
  objective: string
  lessons: LessonItem[]
}

type CurriculumCourse = {
  id: string
  title: string
  level: string
  teacher: string
  stages: StageItem[]
}

const courses: CurriculumCourse[] = [
  {
    id: 'python-middle',
    title: 'Python 중급 코스',
    level: '중등 심화',
    teacher: '박강사',
    stages: [
      {
        id: 'stage-1',
        title: '1단계 · 반복문 기초',
        objective: 'for와 while의 차이를 이해하고 기본 문법을 익힙니다.',
        lessons: [
          { id: 'lesson-1', title: '1-1 반복문 도입', summary: '반복이 필요한 상황을 예제로 이해합니다.' },
          { id: 'lesson-2', title: '1-2 for문 연습', summary: 'range와 리스트 순회를 중심으로 연습합니다.' },
        ],
      },
      {
        id: 'stage-2',
        title: '2단계 · 반복문 응용',
        objective: '반복문 안 조건 분기와 누적 패턴을 적용합니다.',
        lessons: [
          { id: 'lesson-3', title: '2-1 조건과 반복', summary: 'if와 함께 쓰는 반복문 흐름을 익힙니다.' },
          { id: 'lesson-4', title: '2-2 누적 계산', summary: '합계, 평균, 카운팅 패턴을 다룹니다.' },
          { id: 'lesson-5', title: '2-3 리스트 컴프리헨션', summary: '축약 표현과 가독성 기준을 정리합니다.' },
        ],
      },
    ],
  },
  {
    id: 'web-basic',
    title: '웹 기초 코스',
    level: '초등 고학년',
    teacher: '김강사',
    stages: [
      {
        id: 'stage-3',
        title: '1단계 · HTML 구조',
        objective: '문서 구조와 시맨틱 태그를 익힙니다.',
        lessons: [
          { id: 'lesson-6', title: '1-1 제목과 문단', summary: '콘텐츠를 읽기 좋게 배치합니다.' },
          { id: 'lesson-7', title: '1-2 카드 레이아웃', summary: '정보 카드를 HTML로 구성합니다.' },
        ],
      },
    ],
  },
]

function CurriculumDialog({
  open,
  onClose,
  title,
  fields,
}: {
  open: boolean
  onClose: () => void
  title: string
  fields: Array<{ label: string; defaultValue: string }>
}) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-[560px] rounded-[32px] bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">Admin Curriculum</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">구조를 바꾸더라도 기존 운영자 색감과 카드 리듬을 그대로 유지했습니다.</p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          {fields.map((field) => (
            <label key={field.label} className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">{field.label}</span>
              <input className="h-[52px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none" defaultValue={field.defaultValue} />
            </label>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button className={secondaryButton} onClick={onClose} type="button">취소</button>
            <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={onClose} type="button">저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CurriculumPage() {
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0].id)
  const [selectedStageId, setSelectedStageId] = useState(courses[0].stages[0].id)
  const [dialog, setDialog] = useState<'course' | 'stage' | 'lesson' | null>(null)

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? courses[0]
  const selectedStage = selectedCourse.stages.find((stage) => stage.id === selectedStageId) ?? selectedCourse.stages[0]

  const metrics = useMemo(() => {
    const stageCount = courses.reduce((count, course) => count + course.stages.length, 0)
    const lessonCount = courses.reduce(
      (count, course) => count + course.stages.reduce((inner, stage) => inner + stage.lessons.length, 0),
      0,
    )

    return {
      stageCount,
      lessonCount,
    }
  }, [])

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="커리큘럼"
        title="반별 커리큘럼 구조를 클래스-단계-차시 단위로 관리해요"
        description="운영자가 실제 편성 관점에서 구조를 읽기 쉽도록 트리와 상세 패널을 나눠 배치했고, 추가/수정 동선을 같은 톤으로 묶었습니다."
        backHref="/admin/dashboard"
        backLabel="운영자 홈"
        action={
          <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setDialog('lesson')} type="button">
            <Plus className="h-4 w-4" />
            차시 추가
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="운영 코스" value={`${courses.length}개`} detail="현재 활성화된 커리큘럼" icon={GraduationCap} tone="indigo" />
        <MetricCard label="단계 수" value={`${metrics.stageCount}개`} detail="코스별 단계 구조" icon={Target} tone="sky" />
        <MetricCard label="차시 수" value={`${metrics.lessonCount}개`} detail="강사 진도와 연동 예정" icon={BookOpen} tone="violet" />
        <MetricCard label="연결 반" value="6개" detail="시간표/진도와 통일" icon={Users} tone="emerald" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <SurfaceCard>
          <SectionHeading
            title="커리큘럼 트리"
            subtitle="클래스를 먼저 고르고 단계와 차시를 이어서 관리합니다."
            action={
              <button className={secondaryButton} onClick={() => setDialog('course')} type="button">
                <Plus className="h-4 w-4" />
                코스 추가
              </button>
            }
          />
          <div className="mt-5 space-y-4">
            {courses.map((course) => {
              const active = selectedCourseId === course.id
              return (
                <button
                  key={course.id}
                  className={cx(
                    'w-full rounded-[28px] border px-4 py-4 text-left transition',
                    active ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white',
                  )}
                  onClick={() => {
                    setSelectedCourseId(course.id)
                    setSelectedStageId(course.stages[0].id)
                  }}
                  type="button"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{course.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{course.level} · 담당 {course.teacher}</p>
                    </div>
                    <StatusBadge label={`${course.stages.length}단계`} tone={active ? 'indigo' : 'slate'} />
                  </div>
                  {active ? (
                    <div className="mt-4 space-y-2">
                      {course.stages.map((stage) => (
                        <button
                          key={stage.id}
                          className={cx(
                            'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition',
                            selectedStageId === stage.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200',
                          )}
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedStageId(stage.id)
                          }}
                          type="button"
                        >
                          <span>{stage.title}</span>
                          <span>{stage.lessons.length}차시</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          <SurfaceCard>
            <SectionHeading
              title={selectedStage.title}
              subtitle={`${selectedCourse.title} 안에서 관리되는 단계입니다.`}
              action={
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButton} onClick={() => setDialog('stage')} type="button">단계 수정</button>
                  <button className={cx(primaryButton, 'bg-gradient-to-r from-indigo-600 to-sky-500 shadow-indigo-500/20')} onClick={() => setDialog('lesson')} type="button">차시 추가</button>
                </div>
              }
            />
            <div className="mt-5 rounded-[28px] bg-slate-50 px-5 py-5">
              <p className="text-sm font-medium text-slate-500">학습 목표</p>
              <p className="mt-2 text-base leading-7 text-slate-700">{selectedStage.objective}</p>
            </div>
            <div className="mt-5 grid gap-3">
              {selectedStage.lessons.map((lesson) => (
                <div key={lesson.id} className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{lesson.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{lesson.summary}</p>
                    </div>
                    <StatusBadge label="차시" tone="violet" />
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeading title="운영 연결 포인트" subtitle="다른 역할 화면과 톤을 맞춰 필요한 연결점만 먼저 정리했습니다." />
            <div className="mt-5 space-y-3">
              {[
                '강사 진도 화면에서 같은 차시 이름을 그대로 선택할 수 있도록 구조를 맞춤',
                '시간표와 반 편성 화면에서 코스별 연결 반 수를 읽기 쉽게 유지',
                '과제 자동 생성과 AI 보고서에서 단계/차시명을 그대로 재사용',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[28px] bg-emerald-50 px-5 py-5 text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                운영자와 강사 화면 간 용어를 통일했습니다.
              </div>
              <p className="mt-2 text-sm leading-6">
                코스, 단계, 차시 명칭을 커리큘럼-진도-과제 흐름에서 동일하게 보이도록 맞춰 앞으로 뒤로 가는 동선에서도 맥락이 끊기지 않게 했습니다.
              </p>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <CurriculumDialog
        fields={[
          { label: '코스 이름', defaultValue: '새 Python 코스' },
          { label: '레벨', defaultValue: '중등 심화' },
          { label: '담당 강사', defaultValue: '박강사' },
        ]}
        onClose={() => setDialog(null)}
        open={dialog === 'course'}
        title="코스 추가"
      />
      <CurriculumDialog
        fields={[
          { label: '단계 이름', defaultValue: selectedStage.title },
          { label: '학습 목표', defaultValue: selectedStage.objective },
        ]}
        onClose={() => setDialog(null)}
        open={dialog === 'stage'}
        title="단계 수정"
      />
      <CurriculumDialog
        fields={[
          { label: '차시 이름', defaultValue: `${selectedStage.title} 신규 차시` },
          { label: '수업 요약', defaultValue: '예제와 활동 목표를 간단히 정리합니다.' },
        ]}
        onClose={() => setDialog(null)}
        open={dialog === 'lesson'}
        title="차시 추가"
      />
    </div>
  )
}
