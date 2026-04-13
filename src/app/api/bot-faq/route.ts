import { prisma } from '@/lib/db'
import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { error } = await withAuth(['ADMIN', 'TEACHER', 'STUDENT'])

  if (error) {
    return error
  }

  try {
    const { searchParams, page, limit, skip } = getPageParams(request)
    const classId = searchParams.get('classId')
    const q = searchParams.get('q')

    const where = {
      ...(classId ? { classId } : {}),
      ...(q
        ? {
            OR: [
              { question: { contains: q, mode: 'insensitive' as const } },
              { answer: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.botFAQ.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.botFAQ.count({ where }),
    ])

    return paginatedResponse(items, total, page, limit)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : 'FAQ 목록을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function POST(request: Request) {
  const { error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  try {
    const body = (await request.json()) as {
      classId?: string | null
      question?: string
      answer?: string
    }

    if (!body.question?.trim() || !body.answer?.trim()) {
      return errorResponse('VALIDATION', 'question과 answer는 필수입니다.', 400)
    }

    const created = await prisma.botFAQ.create({
      data: {
        classId: body.classId ?? null,
        question: body.question.trim(),
        answer: body.answer.trim(),
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'FAQ를 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
