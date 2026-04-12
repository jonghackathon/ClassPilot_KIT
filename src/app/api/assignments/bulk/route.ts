import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { assignmentCreateSchema } from '@/lib/validations/assignments'

const bulkSchema = z.object({
  assignments: z.array(assignmentCreateSchema),
})

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const body = await request.json().catch(() => null)

  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = bulkSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse(
      'VALIDATION',
      '과제 일괄 생성 데이터가 올바르지 않습니다.',
      400,
      parsed.error.flatten(),
    )
  }

  if (session.user.role === 'TEACHER') {
    const allowed = await Promise.all(
      parsed.data.assignments.map((item) =>
        teacherHasClassAccess(session.user.id, item.classId),
      ),
    )

    if (allowed.some((item) => !item)) {
      return errorResponse('FORBIDDEN', '담당 반에만 과제를 생성할 수 있습니다.', 403)
    }
  }

  const items = await Promise.all(
    parsed.data.assignments.map((item) =>
      prisma.assignment.create({
        data: {
          classId: item.classId,
          teacherId: session.user.role === 'TEACHER' ? session.user.id : item.teacherId,
          title: item.title,
          content: item.content ?? null,
          type: item.type,
          dueDate: item.dueDate ? new Date(item.dueDate) : null,
          teacherNote: item.teacherNote ?? null,
          imageUrls: item.imageUrls ?? [],
        },
      }),
    ),
  )

  return successResponse({ items, count: items.length }, 201)
}
