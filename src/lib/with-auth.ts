import type { Session } from 'next-auth'

import type { UserRole } from '@/types'

import { errorResponse } from './api-response'
import { auth } from './auth'

export async function withAuth(roles?: UserRole[]) {
  const session = await auth()

  if (!session?.user) {
    return {
      session: null as Session | null,
      error: errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401),
    }
  }

  if (roles && !roles.includes(session.user.role as UserRole)) {
    return {
      session: null as Session | null,
      error: errorResponse('FORBIDDEN', '권한이 없습니다.', 403),
    }
  }

  return {
    session,
    error: null,
  }
}

export function getPageParams(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? '20')))

  return {
    searchParams,
    page,
    limit,
    skip: (page - 1) * limit,
  }
}
