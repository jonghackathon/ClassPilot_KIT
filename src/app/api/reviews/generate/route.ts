import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { buildReviewGenerationPrompt } from '@/lib/ai/prompts'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { getClaudeClient, getClaudeModel } from '@/lib/ai/claude'
import { withAuth } from '@/lib/with-auth'

const reviewGenerateSchema = z.object({
  studentId: z.string().cuid(),
  lessonId: z.string().cuid(),
})

function extractTextFromClaudeResponse(response: Awaited<ReturnType<ReturnType<typeof getClaudeClient>['messages']['create']>>) {
  return response.content
    .filter((block): block is Extract<(typeof response.content)[number], { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}

function fallbackQuiz(topic: string) {
  return [
    {
      question: `${topic}에서 가장 먼저 확인해야 하는 핵심 개념은 무엇인가요?`,
      answer: '핵심 개념을 한 문장으로 설명할 수 있어야 합니다.',
    },
    {
      question: `${topic}를 실제 문제에 적용할 때 주의할 점은 무엇인가요?`,
      answer: '조건과 예외 상황을 먼저 확인해야 합니다.',
    },
    {
      question: `오늘 수업 내용을 다음 시간과 연결하려면 무엇을 복습해야 하나요?`,
      answer: '수업에서 다룬 대표 예제와 용어를 다시 정리합니다.',
    },
  ]
}

function parseQuiz(text: string, topic: string) {
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    return fallbackQuiz(topic)
  }

  return fallbackQuiz(topic)
}

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = reviewGenerateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '복습 생성 요청이 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const { studentId, lessonId } = parsed.data
  const teacherStudentIds =
    session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []

  if (session.user.role === 'TEACHER' && !teacherStudentIds.includes(studentId)) {
    return errorResponse('FORBIDDEN', '담당 수강생 복습만 생성할 수 있습니다.', 403)
  }

  const [student, lesson, weekNote] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        academyId: true,
      },
    }),
    prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        class: {
          select: {
            id: true,
            academyId: true,
            name: true,
          },
        },
      },
    }),
    prisma.weekNote.findFirst({
      where: { lessonId },
      orderBy: { updatedAt: 'desc' },
      select: {
        content: true,
        studentReaction: true,
      },
    }),
  ])

  if (!student || student.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수강생을 찾을 수 없습니다.', 404)
  }

  if (!lesson || lesson.class.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '수업을 찾을 수 없습니다.', 404)
  }

  const lessonSummary = [lesson.topic, weekNote?.content, weekNote?.studentReaction]
    .filter(Boolean)
    .join('\n')
    .trim() || '이번 수업 핵심 내용을 요약해 주세요.'

  const prompt = buildReviewGenerationPrompt({
    studentName: student.name,
    lessonTopic: lesson.topic,
    lessonSummary,
  })

  let summary = `${student.name} 학생이 ${lesson.topic ?? '이번 수업'}에서 다룬 핵심을 다시 읽고 정리할 수 있도록 복습 요약을 생성했습니다.`
  let preview = weekNote?.studentReaction ?? lesson.topic ?? '오늘 수업 핵심을 다시 정리해 보세요.'
  let quiz = fallbackQuiz(lesson.topic ?? '오늘 수업')

  try {
    const client = getClaudeClient()
    const summaryResponse = await client.messages.create({
      model: getClaudeModel(),
      max_tokens: 700,
      temperature: 0.3,
      system: '한국어 학원 복습 자료를 만드는 조교처럼 간결하고 친절하게 답합니다.',
      messages: [{ role: 'user', content: prompt }],
    })
    const text = extractTextFromClaudeResponse(summaryResponse)
    if (text) {
      summary = text
      preview = text.slice(0, 120)
    }

    const quizResponse = await client.messages.create({
      model: getClaudeModel(),
      max_tokens: 500,
      temperature: 0.2,
      system:
        '반드시 JSON 배열만 출력합니다. 각 항목은 question, answer 두 필드를 가진 한국어 객체여야 합니다.',
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\n위 내용을 바탕으로 복습 퀴즈 3문항을 JSON 배열로만 작성하세요.`,
        },
      ],
    })
    quiz = parseQuiz(extractTextFromClaudeResponse(quizResponse), lesson.topic ?? '오늘 수업')
  } catch {
    // 환경변수 미설정 또는 외부 호출 실패 시에도 수업 흐름이 끊기지 않도록 기본 초안을 반환한다.
  }

  const review = await prisma.reviewSummary.upsert({
    where: {
      lessonId_studentId: {
        lessonId,
        studentId,
      },
    },
    create: {
      lessonId,
      studentId,
      summary,
      preview,
      quiz,
    },
    update: {
      summary,
      preview,
      quiz,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      lesson: { select: { id: true, date: true, topic: true } },
    },
  })

  return successResponse(review, 201)
}
