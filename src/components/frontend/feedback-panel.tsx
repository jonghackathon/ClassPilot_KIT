'use client'

import { useState } from 'react'
import { CheckCircle2, FileImage, Sparkles, X } from 'lucide-react'

import { StatusBadge, SurfaceCard, cx } from '@/components/frontend/common'

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-[-1px]'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:text-slate-900'

type SectionKey = '문제 이해' | '구성' | '표현' | '다음 액션'

export function FeedbackPanel({
  open,
  onClose,
  studentName,
  assignmentTitle,
}: {
  open: boolean
  onClose: () => void
  studentName: string
  assignmentTitle: string
}) {
  const [generated, setGenerated] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [sections, setSections] = useState<Record<SectionKey, string>>({
    '문제 이해': '제출물을 분석하면 이 영역에 문제 이해 수준이 정리됩니다.',
    구성: '문단 구조와 논리 흐름을 이 영역에서 바로 수정할 수 있어요.',
    표현: '표현 교정, 문장 다듬기, 용어 통일이 여기에 표시됩니다.',
    '다음 액션': '다음 시간 전까지 해볼 보강 과제가 여기에 정리됩니다.',
  })
  const [teacherComment, setTeacherComment] = useState(
    '핵심 개념은 잘 잡혀 있어요. 예시 하나만 더 직접 만들어 보면 완성도가 더 올라갑니다.',
  )

  const previewImages = [
    '작성 이미지 1',
    '작성 이미지 2',
  ]

  function handleGenerate() {
    setGenerated(true)
    setSections({
      '문제 이해': '반복문을 활용하는 이유와 예외 상황 설명은 좋지만, while문을 선택해야 하는 이유가 조금 더 분명하면 좋아요.',
      구성: '도입-예시-정리 흐름은 안정적이에요. 두 번째 단락과 세 번째 단락 사이 연결 문장을 한 줄 보강해 보세요.',
      표현: '용어는 대체로 정확합니다. "계속 돈다" 같은 표현은 "조건이 참인 동안 반복된다"로 바꾸면 더 명확해져요.',
      '다음 액션': '리스트 컴프리헨션 예시 1개를 추가하고, while문이 더 적합한 상황을 한 문장으로 정리해 보세요.',
    })
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-[36px] border border-white/60 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm font-medium text-violet-600">AI 첨삭 패널</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">{studentName} 제출물 분석</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {assignmentTitle} 기준으로 이미지/텍스트를 함께 보고 강사 피드백 문안을 바로 다듬을 수 있게 구성했습니다.
            </p>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-[0.9fr_1.1fr] sm:px-6">
          <div className="space-y-4">
            <SurfaceCard className="rounded-[28px]">
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="이미지 2장" tone="sky" />
                <StatusBadge label="텍스트 추출 완료" tone="emerald" />
                <StatusBadge label={generated ? 'AI 초안 생성됨' : 'AI 대기'} tone={generated ? 'violet' : 'slate'} />
              </div>
              <div className="mt-5 rounded-[28px] bg-gradient-to-br from-violet-600 via-indigo-600 to-slate-900 p-6 text-white">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-violet-100">{previewImages[activeImage]}</p>
                  <FileImage className="h-5 w-5 text-violet-100" />
                </div>
                <p className="mt-12 text-lg font-semibold">손글씨/이미지 제출물 미리보기 영역</p>
                <p className="mt-2 text-sm leading-6 text-violet-100">
                  실제 연동 단계에서는 업로드한 에세이 이미지와 OCR 텍스트가 여기에 연결됩니다.
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                {previewImages.map((image, index) => (
                  <button
                    key={image}
                    className={cx(
                      'rounded-2xl px-4 py-3 text-sm font-medium transition',
                      activeImage === index ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600',
                    )}
                    onClick={() => setActiveImage(index)}
                    type="button"
                  >
                    {image}
                  </button>
                ))}
              </div>
              <button
                className={cx(primaryButton, 'mt-5 w-full bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')}
                onClick={handleGenerate}
                type="button"
              >
                <Sparkles className="h-4 w-4" />
                AI 첨삭 초안 생성
              </button>
            </SurfaceCard>
          </div>

          <div className="space-y-4">
            {(Object.entries(sections) as Array<[SectionKey, string]>).map(([title, value]) => (
              <label key={title} className="block space-y-2">
                <span className="text-sm font-semibold text-slate-800">{title}</span>
                <textarea
                  className="min-h-[110px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
                  onChange={(event) =>
                    setSections((current) => ({
                      ...current,
                      [title]: event.target.value,
                    }))
                  }
                  value={value}
                />
              </label>
            ))}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-800">강사 최종 코멘트</span>
              <textarea
                className="min-h-[120px] w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 outline-none"
                onChange={(event) => setTeacherComment(event.target.value)}
                value={teacherComment}
              />
            </label>

            <div className="rounded-[28px] bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                최종 피드백 문안은 강사가 마지막으로 수정할 수 있어요.
              </div>
              <p className="mt-2">
                이미지 기반 제출물도 동일한 톤으로 첨삭되도록 패널 안에서 문장과 후속 과제를 함께 다듬게 했습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          <button className={secondaryButton} onClick={onClose} type="button">닫기</button>
          <button className={cx(primaryButton, 'bg-gradient-to-r from-violet-600 to-indigo-500 shadow-violet-500/20')} onClick={onClose} type="button">피드백 저장</button>
        </div>
      </div>
    </div>
  )
}
