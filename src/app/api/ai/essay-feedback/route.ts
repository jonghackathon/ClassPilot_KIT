import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { getClaudeClient, getClaudeModel } from '@/lib/ai/claude'
import { extractClaudeText } from '@/lib/ai/extract-text'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { withAuth } from '@/lib/with-auth'

const essayFeedbackSchema = z.object({
  assignmentId: z.string().cuid(),
  extractedText: z.string().trim().min(1),
  studentName: z.string().trim().optional().nullable(),
  assignmentTitle: z.string().trim().optional().nullable(),
})

type FeedbackPayload = {
  understanding: string
  structure: string
  expression: string
  nextAction: string
  teacherComment: string
}

function fallbackFeedback(input: {
  studentName?: string | null
  assignmentTitle?: string | null
  extractedText: string
}): FeedbackPayload {
  const snippet = input.extractedText.slice(0, 140)
  return {
    understanding: `${input.studentName ?? '학생'}의 초안은 ${input.assignmentTitle ?? '과제'} 핵심 주제를 이해하고 있지만, 근거 설명을 한두 문장 더 보강하면 좋습니다.`,
    structure: '도입-설명-정리 흐름은 유지하되, 문단 연결 문장을 한 줄 더 넣어 자연스럽게 이어지도록 수정해 보세요.',
    expression: `현재 초안에서 "${snippet}"처럼 핵심 문장은 좋습니다. 용어를 조금 더 정확하게 다듬으면 전달력이 올라갑니다.`,
    nextAction: '핵심 개념 예시 1개를 추가하고, 마지막 문단에서 배운 점을 한 문장으로 다시 정리해 보세요.',
    teacherComment: '주요 개념은 잘 잡혀 있습니다. 예시와 연결 문장을 조금만 보강하면 완성도가 더 높아질 것 같아요.',
  }
}

function parseFeedback(text: string, fallback: FeedbackPayload) {
  try {
    const parsed = JSON.parse(text) as Partial<FeedbackPayload>
    return {
      understanding: parsed.understanding ?? fallback.understanding,
      structure: parsed.structure ?? fallback.structure,
      expression: parsed.expression ?? fallback.expression,
      nextAction: parsed.nextAction ?? fallback.nextAction,
      teacherComment: parsed.teacherComment ?? fallback.teacherComment,
    }
  } catch {
    return fallback
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = rateLimit(request, { limit: 10, windowMs: 60_000 })
  if (rateLimitError) return rateLimitError

  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = essayFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '에세이 피드백 요청이 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const { assignmentId, extractedText, studentName, assignmentTitle } = parsed.data

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { class: { select: { academyId: true } } },
  })

  if (!assignment || assignment.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '과제를 찾을 수 없습니다.', 404)
  }

  if (
    session.user.role === 'TEACHER' &&
    !(await teacherHasClassAccess(session.user.id, assignment.classId))
  ) {
    return errorResponse('FORBIDDEN', '담당 반 과제만 피드백을 생성할 수 있습니다.', 403)
  }

  const fallback = fallbackFeedback({
    extractedText,
    studentName,
    assignmentTitle: assignmentTitle ?? assignment.title,
  })

  let feedback = fallback

  try {
    const client = getClaudeClient()
    const response = await client.messages.create({
      model: getClaudeModel(),
      max_tokens: 800,
      temperature: 0.3,
      stream: false,
      system:
        '반드시 JSON 객체만 출력합니다. understanding, structure, expression, nextAction, teacherComment 다섯 필드를 가진 한국어 피드백이어야 합니다.',
      messages: [
        {
          role: 'user',
          content: [
            `학생: ${studentName ?? '학생'}`,
            `과제: ${assignmentTitle ?? assignment.title}`,
            '제출 텍스트:',
            extractedText,
          ].join('\n'),
        },
      ],
    })
    feedback = parseFeedback(extractClaudeText(response), fallback)
  } catch {
    // 외부 AI 호출 실패 시에도 편집 가능한 기본 초안을 반환한다.
  }

  return successResponse(feedback, 201)
}
