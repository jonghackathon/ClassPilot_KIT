import { successResponse, errorResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'

// GET /api/academy — 현재 로그인한 사용자의 학원 정보 반환 (ADMIN/TEACHER)
export async function GET() {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])
  if (error) return error

  const academy = await prisma.academy.findUnique({
    where: { id: session.user.academyId },
    select: { id: true, name: true, code: true },
  })

  if (!academy) {
    return errorResponse('NOT_FOUND', '학원 정보를 찾을 수 없어요.', 404)
  }

  return successResponse(academy)
}
