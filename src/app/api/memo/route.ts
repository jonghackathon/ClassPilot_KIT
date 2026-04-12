import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { withAuth, getPageParams } from '@/lib/with-auth'
import { memoCreateSchema } from '@/lib/validations/memo'

export async function GET(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const { searchParams, page, limit, skip } = getPageParams(request)
  const classId = searchParams.get('classId') ?? undefined
  const archived = searchParams.get('archived')
  const category = searchParams.get('category') ?? undefined

  const where = {
    teacher: { academyId: session.user.academyId },
    ...(session.user.role === 'TEACHER' ? { teacherId: session.user.id } : {}),
    ...(classId ? { classId } : {}),
    ...(category ? { category } : {}),
    ...(archived !== null ? { archived: archived === 'true' } : {}),
  }

  const [total, items] = await Promise.all([
    prisma.memo.count({ where }),
    prisma.memo.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true, email: true } },
      },
    }),
  ])

  return successResponse({
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  })
}

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error || !session) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = memoCreateSchema.safeParse({
    ...body,
    teacherId:
      session.user.role === 'TEACHER'
        ? session.user.id
        : body.teacherId ?? session.user.id,
  })
  if (!parsed.success) {
    return errorResponse('VALIDATION', '메모 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const created = await prisma.memo.create({
    data: {
      ...data,
      title: data.title ?? null,
      classId: data.classId ?? null,
      targetName: data.targetName ?? null,
      archived: data.archived ?? false,
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  })

  return successResponse(created, 201)
}
