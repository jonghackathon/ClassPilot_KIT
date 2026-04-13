import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { getRouteId } from '@/lib/route-helpers'
import { withAuth } from '@/lib/with-auth'

// POST /api/users/[id]/reset-pin
// ADMIN만 호출 가능 — 수강생 PIN을 임시 PIN(0000)으로 초기화
export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, error } = await withAuth(['ADMIN'])
  if (error) return error

  const id = await getRouteId(context)

  const user = await prisma.user.findFirst({
    where: {
      id,
      academyId: session.user.academyId,
      role: 'STUDENT',
    },
    select: { id: true, name: true },
  })

  if (!user) {
    return errorResponse('NOT_FOUND', '수강생을 찾을 수 없어요.', 404)
  }

  const hashedPin = await bcrypt.hash('0000', 10)

  await prisma.user.update({
    where: { id },
    data: { password: hashedPin },
  })

  return successResponse({ message: `${user.name} 학생의 PIN이 0000으로 초기화됐어요.` })
}
