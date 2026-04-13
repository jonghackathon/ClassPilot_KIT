type PromptSection = {
  heading: string
  content?: string | null
}

type MonthlyReportPromptInput = {
  studentName: string
  monthStr: string
  attendanceSummary: string
  assignmentSummary: string
  growth: string
}

type ReviewGenerationPromptInput = {
  studentName: string
  lessonTopic?: string | null
  lessonSummary: string
}

type ComplaintDraftPromptInput = {
  studentName: string
  complaintTitle?: string | null
  complaintContent: string
}

function renderSections(sections: PromptSection[]) {
  return sections
    .filter((section) => section.content)
    .map((section) => `${section.heading}\n${section.content}`)
    .join('\n\n')
}

export function buildMonthlyReportPrompt(input: MonthlyReportPromptInput) {
  return renderSections([
    {
      heading: '역할',
      content: '학원 담임이 학부모에게 보내는 월간 성장 리포트를 한국어로 작성한다.',
    },
    {
      heading: '대상 수강생',
      content: `${input.studentName} / ${input.monthStr}`,
    },
    {
      heading: '출결 요약',
      content: input.attendanceSummary,
    },
    {
      heading: '과제 요약',
      content: input.assignmentSummary,
    },
    {
      heading: '수업 성장 포인트',
      content: input.growth,
    },
    {
      heading: '출력 지침',
      content:
        '학부모가 바로 읽을 수 있는 자연스러운 문장 3~5문단으로 정리하고, 과장 없이 관찰 가능한 내용만 쓴다.',
    },
  ])
}

export function buildReviewGenerationPrompt(input: ReviewGenerationPromptInput) {
  return renderSections([
    {
      heading: '역할',
      content: '학원 수업 내용을 바탕으로 학생용 복습 요약과 짧은 퀴즈를 만든다.',
    },
    {
      heading: '학생',
      content: input.studentName,
    },
    {
      heading: '수업 주제',
      content: input.lessonTopic ?? '주제 미기재',
    },
    {
      heading: '수업 요약',
      content: input.lessonSummary,
    },
    {
      heading: '출력 지침',
      content:
        '먼저 핵심 요약 3~5문장을 쓰고, 이어서 객관식 또는 단답형 퀴즈 3문항을 JSON으로 만들기 쉬운 구조로 정리한다.',
    },
  ])
}

export function buildComplaintDraftPrompt(input: ComplaintDraftPromptInput) {
  return renderSections([
    {
      heading: '역할',
      content: '학원 운영팀이 학부모 민원에 1차 답변 초안을 작성한다.',
    },
    {
      heading: '학생',
      content: input.studentName,
    },
    {
      heading: '민원 제목',
      content: input.complaintTitle ?? '제목 없음',
    },
    {
      heading: '민원 내용',
      content: input.complaintContent,
    },
    {
      heading: '출력 지침',
      content:
        '방어적으로 쓰지 말고, 공감 한 문장과 확인 중인 사실, 후속 조치 약속을 포함한 한국어 답변 초안을 작성한다.',
    },
  ])
}
