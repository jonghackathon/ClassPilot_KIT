import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

const questionCreateSchema = z.object({
  sessionId: z.string().cuid(),
  question: z.string().trim().min(1).max(500),
})

function buildCopilotAnswer(question: string, topic?: string | null) {
  const normalized = question.trim()
  const lessonTopic = topic?.trim() || '현재 수업 주제'

  return {
    beginner: `${lessonTopic}를 처음 듣는 학생에게는 "${normalized}"를 일상적인 예시 하나로 먼저 풀어 설명합니다.`,
    example: `칠판이나 화면에는 ${lessonTopic}와 연결된 짧은 예제 한 개를 보여주고, 질문을 다시 읽게 합니다.`,
    advanced: `"${normalized}"와 비슷하지만 조건이 바뀌면 어떻게 되는지 확장 질문 한 개를 던져 심화 이해를 확인합니다.`,
    summary: `${lessonTopic} 기준으로 핵심 개념, 예제, 확장 질문까지 바로 수업에 쓸 수 있는 답변입니다.`,
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

    const answer = buildCopilotAnswer(data.question, copilotSession.topic ?? copilotSession.lesson.topic)

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
