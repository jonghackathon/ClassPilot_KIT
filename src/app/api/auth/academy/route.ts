import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET /api/auth/academy?code=ACAD-3F8K
// 학원 코드로 학원 존재 여부 확인 — 인증 불필요 (수강생 로그인 Step 1)
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase()

  if (!code) {
    return errorResponse('VALIDATION', '학원 코드를 입력해 주세요.', 400)
  }

  const academy = await prisma.academy.findUnique({
    where: { code },
    select: { id: true, name: true },
  })

  if (!academy) {
    return errorResponse('NOT_FOUND', '학원 코드를 찾을 수 없어요.', 404)
  }

  return successResponse({ id: academy.id, name: academy.name })
}
