import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

function buildCopilotAnswer(question: string, context?: string | null) {
  const normalized = question.trim()

  return [
    '핵심 요약',
    `- 요청: ${normalized}`,
    context ? `- 수업 맥락: ${context}` : '- 수업 맥락: 기본 수업 흐름 기준',
    '',
    '추천 진행',
    '- 오늘 수업 목표를 한 문장으로 다시 확인합니다.',
    '- 이해가 흔들린 학생을 먼저 짚고, 질문 한 개로 반응을 확인합니다.',
    '- 마무리에서 과제와 복습 포인트를 분명히 남깁니다.',
  ].join('\n')
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const body = (await request.json()) as {
      sessionId?: string
      question?: string
      markAsUsed?: boolean
    }

    if (!body.sessionId || !body.question?.trim()) {
      return errorResponse('VALIDATION', 'sessionId와 question은 필수입니다.', 400)
    }

    const copilotSession = await prisma.copilotSession.findFirst({
      where: {
        id: body.sessionId,
        ...(session.user.role === 'ADMIN' ? {} : { teacherId: session.user.id }),
      },
      select: {
        id: true,
        context: true,
      },
    })

    if (!copilotSession) {
      return errorResponse('NOT_FOUND', '코파일럿 세션을 찾을 수 없습니다.', 404)
    }

    const answer = buildCopilotAnswer(body.question, copilotSession.context)

    const created = await prisma.copilotQuestion.create({
      data: {
        sessionId: body.sessionId,
        question: body.question.trim(),
        answer,
        used: Boolean(body.markAsUsed),
      },
    })

    await prisma.copilotSession.update({
      where: { id: body.sessionId },
      data: {
        status: 'IN_PROGRESS',
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 질문을 저장하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
