import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getClaudeClient, getClaudeModel } from '@/lib/ai/claude'
import { buildCopilotAnswerPrompt } from '@/lib/ai/prompts'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

const questionCreateSchema = z.object({
  sessionId: z.string().cuid(),
  question: z.string().trim().min(1).max(500),
})

const answerSchema = z.object({
  beginner: z.string(),
  example: z.string(),
  advanced: z.string(),
  summary: z.string(),
})

function fallbackAnswer(question: string, topic?: string | null) {
  const normalized = question.trim()
  const lessonTopic = topic?.trim() || '현재 수업 주제'
  return {
    beginner: `${lessonTopic}에서 "${normalized}"는 일상에서 자주 접하는 개념입니다. 간단한 예시를 들어 설명해 보겠습니다.`,
    example: `${lessonTopic}와 연결된 예제: "${normalized}"를 직접 적용해 보는 한 가지 사례를 확인해 보세요.`,
    advanced: `"${normalized}"에서 조건이 바뀌면 어떻게 달라질까요? 비슷한 상황을 떠올려 보세요.`,
    summary: `${lessonTopic} 기준으로 "${normalized}"의 핵심 개념, 예제, 확장 질문을 정리했습니다.`,
    usedCards: ['beginner', 'example', 'advanced', 'summary'],
  }
}

async function generateCopilotAnswer(question: string, topic?: string | null) {
  const client = getClaudeClient()
  const prompt = buildCopilotAnswerPrompt({ question, topic })

  const message = await client.messages.create({
    model: getClaudeModel(),
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const rawText =
    message.content.find((block) => block.type === 'text')?.text?.trim() ?? ''

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return fallbackAnswer(question, topic)
  }

  try {
    const parsed = answerSchema.safeParse(JSON.parse(jsonMatch[0]))
    if (!parsed.success) {
      return fallbackAnswer(question, topic)
    }
    return { ...parsed.data, usedCards: ['beginner', 'example', 'advanced', 'summary'] }
  } catch {
    return fallbackAnswer(question, topic)
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = rateLimit(request, { limit: 20, windowMs: 60_000 })
  if (rateLimitError) return rateLimitError

  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const { data, error: validationError } = await parseRequestBody(request, questionCreateSchema)
    if (validationError || !data) {
      return validationError
    }

    const copilotSession = await prisma.copilotSession.findUnique({
      where: { id: data.sessionId },
      include: {
        lesson: {
          include: {
            class: {
              select: {
                id: true,
                academyId: true,
              },
            },
          },
        },
      },
    })

    if (!copilotSession || copilotSession.lesson.class.academyId !== session.user.academyId) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    if (
      session.user.role === 'TEACHER' &&
      !(await teacherHasClassAccess(session.user.id, copilotSession.lesson.classId))
    ) {
      return errorResponse('FORBIDDEN', '담당 반 코파일럿 세션만 질문할 수 있습니다.', 403)
    }

    const topic = copilotSession.topic ?? copilotSession.lesson.topic
    const answer = await generateCopilotAnswer(data.question, topic).catch(() =>
      fallbackAnswer(data.question, topic),
    )

    const created = await prisma.copilotQuestion.create({
      data: {
        sessionId: data.sessionId,
        question: data.question.trim(),
        beginner: answer.beginner,
        example: answer.example,
        advanced: answer.advanced,
        summary: answer.summary,
        usedCards: answer.usedCards,
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 질문을 저장하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
