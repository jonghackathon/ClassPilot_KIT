import { qnaCreateSchema } from '@/lib/validations/qna'
import { prisma } from '@/lib/db'
import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getPageParams, withAuth } from '@/lib/with-auth'

function buildAnswer(question: string) {
  return [
    '자동 응답 초안',
    `질문: ${question.trim()}`,
    '',
    '1. 오늘 수업 범위에서 핵심 개념을 다시 확인해 보세요.',
    '2. 예시 문제를 한 번 더 풀어보고 막힌 지점을 표시해 주세요.',
    '3. 필요하면 강사에게 추가 질문을 남겨 주세요.',
  ].join('\n')
}

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error) {
    return error
  }

  try {
    const { searchParams, page, limit, skip } = getPageParams(request)
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')

    const where = {
      ...(session.user.role === 'STUDENT' ? { studentId: session.user.id } : {}),
      ...(classId ? { classId } : {}),
      ...(status
        ? {
            status: status as 'PENDING' | 'AI_ANSWERED' | 'TEACHER_ANSWERED',
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.botQuestion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.botQuestion.count({ where }),
    ])

    return paginatedResponse(items, total, page, limit)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '질문 목록을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'STUDENT'])

  if (error) {
    return error
  }

  try {
    const json = await request.json()
    const parsed = qnaCreateSchema.safeParse({
      ...json,
      studentId: session.user.role === 'STUDENT' ? session.user.id : json.studentId,
    })

    if (!parsed.success) {
      return errorResponse('VALIDATION', '질문 데이터를 다시 확인해 주세요.', 400, parsed.error.flatten())
    }

    const created = await prisma.botQuestion.create({
      data: {
        studentId: parsed.data.studentId,
        classId: parsed.data.classId ?? null,
        question: parsed.data.question,
        aiAnswer: buildAnswer(parsed.data.question),
        status: 'AI_ANSWERED',
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '질문을 등록하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
