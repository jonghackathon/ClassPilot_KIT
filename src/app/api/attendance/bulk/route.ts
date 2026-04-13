import { NextRequest } from 'next/server'
import { z } from 'zod'

import { errorResponse, successResponse } from '@/lib/api-response'
import { teacherHasClassAccess } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'
import { attendanceCreateSchema } from '@/lib/validations/attendance'

const bulkSchema = z.object({
  records: z.array(attendanceCreateSchema),
})

export async function POST(request: NextRequest) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const body = await request.json().catch(() => null)
  if (!body) {
    return errorResponse('VALIDATION', '요청 본문이 올바르지 않습니다.', 400)
  }

  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('VALIDATION', '출결 데이터가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  if (session.user.role === 'TEACHER') {
    const allowed = await Promise.all(
      parsed.data.records.map((record) =>
        teacherHasClassAccess(session.user.id, record.classId),
      ),
    )

    if (allowed.some((item) => !item)) {
      return errorResponse('FORBIDDEN', '담당 반만 일괄 기록할 수 있습니다.', 403)
    }
  }

  const items = await Promise.all(
    parsed.data.records.map((record) =>
      prisma.attendance.upsert({
        where: {
          date_studentId_classId: {
            date: new Date(record.date),
            studentId: record.studentId,
            classId: record.classId,
          },
        },
        create: {
          ...record,
          date: new Date(record.date),
        },
        update: {
          status: record.status,
          homeworkStatus: record.homeworkStatus ?? undefined,
          homeworkNote: record.homeworkNote ?? undefined,
          absenceReason: record.absenceReason ?? undefined,
          lessonId: record.lessonId ?? undefined,
          date: new Date(record.date),
        },
      }),
    ),
  )

  return successResponse({ items, count: items.length }, 201)
}
