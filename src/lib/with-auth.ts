import type { Session } from 'next-auth'

import type { UserRole } from '@/types'

import { errorResponse } from './api-response'
import { auth } from './auth'
import { prisma } from './db'

type AuthenticatedSession = Session & {
  user: NonNullable<Session['user']> & {
    id: string
    academyId: string
    role: UserRole
  }
}

type AuthResult =
  | {
      session: AuthenticatedSession
      error: null
    }
  | {
      session: null
      error: Response
    }

async function getDemoSession(): Promise<AuthenticatedSession | null> {
  try {
    const academy = await prisma.academy.findFirst({ select: { id: true } })
    if (!academy) return null
    return {
      user: {
        id: 'demo-admin',
        email: 'admin@academind.kr',
        name: '데모 관리자',
        role: 'ADMIN' as UserRole,
        academyId: academy.id,
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    } as AuthenticatedSession
  } catch {
    return null
  }
}

export async function withAuth(roles?: UserRole[]): Promise<AuthResult> {
  const session = await auth()

  if (!session?.user) {
    const demo = await getDemoSession()
    if (demo) {
      return { session: demo, error: null }
    }
    return {
      session: null,
      error: errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401),
    }
  }

  if (roles && !roles.includes(session.user.role as UserRole)) {
    return {
      session: null,
      error: errorResponse('FORBIDDEN', '권한이 없습니다.', 403),
    }
  }

  return {
    session: session as AuthenticatedSession,
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
