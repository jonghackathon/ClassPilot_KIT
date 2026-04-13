import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { getClaudeClient, getClaudeModel } from '@/lib/ai/claude'
import { buildCopilotAnswerPrompt } from '@/lib/ai/prompts'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
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
    throw new Error('Claude 응답에서 JSON을 파싱할 수 없습니다.')
  }

  const parsed = answerSchema.safeParse(JSON.parse(jsonMatch[0]))
  if (!parsed.success) {
    throw new Error('Claude 응답 형식이 올바르지 않습니다.')
  }

  return {
    ...parsed.data,
    usedCards: ['beginner', 'example', 'advanced', 'summary'],
  }
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
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
    const answer = await generateCopilotAnswer(data.question, topic)

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
