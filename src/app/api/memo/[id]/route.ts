import { NextRequest } from 'next/server'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { memoUpdateSchema } from '@/lib/validations/memo'

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const memo = await prisma.memo.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, academyId: true } },
      teacher: { select: { id: true, name: true, email: true, academyId: true } },
    },
  })

  if (!memo || memo.teacher.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '메모를 찾을 수 없습니다.', 404)
  }

  if (session.user.role === 'TEACHER' && memo.teacherId !== session.user.id) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  return successResponse(memo)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.memo.findUnique({
    where: { id },
    include: { teacher: { select: { academyId: true } } },
  })
  if (!current || current.teacher.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '메모를 찾을 수 없습니다.', 404)
  }
  if (session.user.role === 'TEACHER' && current.teacherId !== session.user.id) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = memoUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '메모 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  const data = parsed.data
  const updated = await prisma.memo.update({
    where: { id },
    data: {
      ...(data.teacherId ? { teacherId: data.teacherId } : {}),
      ...(data.classId !== undefined ? { classId: data.classId ?? null } : {}),
      ...(data.title !== undefined ? { title: data.title ?? null } : {}),
      ...(data.content ? { content: data.content } : {}),
      ...(data.category ? { category: data.category } : {}),
      ...(data.targetName !== undefined ? { targetName: data.targetName ?? null } : {}),
      ...(data.archived !== undefined ? { archived: data.archived } : {}),
    },
    include: {
      class: { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true, email: true } },
    },
  })

  return successResponse(updated)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const { id } = await Promise.resolve(context.params)
  const current = await prisma.memo.findUnique({
    where: { id },
    include: { teacher: { select: { academyId: true } } },
  })
  if (!current || current.teacher.academyId !== session.user.academyId) {
    return errorResponse('NOT_FOUND', '메모를 찾을 수 없습니다.', 404)
  }
  if (session.user.role === 'TEACHER' && current.teacherId !== session.user.id) {
    return errorResponse('FORBIDDEN', '권한이 없습니다.', 403)
  }

  await prisma.memo.delete({ where: { id } })
  return successResponse({ id })
}
