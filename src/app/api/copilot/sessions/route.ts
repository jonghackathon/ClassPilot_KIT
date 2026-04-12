import { prisma } from '@/lib/db'
import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const { searchParams, page, limit, skip } = getPageParams(request)
    const classId = searchParams.get('classId')
    const status = searchParams.get('status')

    const where = {
      teacherId: session.user.role === 'ADMIN' ? undefined : session.user.id,
      ...(classId ? { classId } : {}),
      ...(status
        ? {
            status: status as 'READY' | 'IN_PROGRESS' | 'COMPLETED',
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      prisma.copilotSession.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.copilotSession.count({ where }),
    ])

    return paginatedResponse(items, total, page, limit)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 불러오지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session?.user) {
    return error
  }

  try {
    const body = (await request.json()) as {
      classId?: string | null
      title?: string | null
      context?: string | null
    }

    const created = await prisma.copilotSession.create({
      data: {
        classId: body.classId ?? null,
        teacherId: session.user.id,
        title: body.title ?? '새 코파일럿 세션',
        context: body.context ?? null,
        status: 'READY',
      },
    })

    return successResponse(created, 201)
  } catch (caught) {
    const message =
      caught instanceof Error ? caught.message : '코파일럿 세션을 생성하지 못했습니다.'
    return errorResponse('INTERNAL', message, 500)
  }
}
