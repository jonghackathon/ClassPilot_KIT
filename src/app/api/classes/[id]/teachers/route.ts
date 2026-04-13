import { z } from 'zod'

import { prisma } from '@/lib/db'
import { errorResponse, successResponse } from '@/lib/api-response'
import { withAuth } from '@/lib/with-auth'

const teacherMembersSchema = z.object({
  teacherIds: z.array(z.string().cuid()).default([]),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withAuth(['ADMIN'])
  if (error) return error
  const { id } = await params

  const teachers = await prisma.classTeacher.findMany({
    where: { classId: id },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, role: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return successResponse({ teachers })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await withAuth(['ADMIN'])
  if (error) return error
  const { id } = await params

  const body = await request.json().catch(() => null)
  const parsed = teacherMembersSchema.safeParse(body)

  if (!parsed.success) {
    return errorResponse('VALIDATION', '강사 배정 정보가 올바르지 않습니다.', 400, parsed.error.flatten())
  }

  await prisma.classTeacher.deleteMany({
    where: { classId: id },
  })

  if (parsed.data.teacherIds.length > 0) {
    await prisma.classTeacher.createMany({
      data: parsed.data.teacherIds.map((teacherId) => ({
        classId: id,
        teacherId,
      })),
      skipDuplicates: true,
    })
  }

  const teachers = await prisma.classTeacher.findMany({
    where: { classId: id },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, role: true, phone: true },
      },
    },
  })

  return successResponse({ teachers })
}
