import bcrypt from 'bcryptjs'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody } from '@/lib/route-helpers'
import { passwordSchema } from '@/lib/validations/auth'
import { withAuth } from '@/lib/with-auth'

export async function POST(request: Request) {
  const { session, error } = await withAuth()

  if (error || !session) {
    return error
  }

  const parsed = await parseRequestBody(request, passwordSchema)

  if (parsed.error || !parsed.data) {
    return parsed.error
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  })

  if (!user?.password) {
    return errorResponse('NOT_FOUND', '비밀번호 사용자가 아닙니다.', 404)
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)

  if (!valid) {
    return errorResponse('VALIDATION', '현재 비밀번호가 일치하지 않습니다.', 400)
  }

  const password = await bcrypt.hash(parsed.data.newPassword, 10)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password },
  })

  return successResponse({ changed: true })
}
