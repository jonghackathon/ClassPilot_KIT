import { NextResponse } from 'next/server'
import NextAuth from 'next-auth'

import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

function roleHome(role: string | undefined) {
  if (role === 'ADMIN') return '/admin/dashboard'
  if (role === 'TEACHER') return '/teacher/dashboard'
  return '/student/home'
}

export default auth((request) => {
  const { pathname } = request.nextUrl
  const role = request.auth?.user?.role as string | undefined
  const isLoggedIn = Boolean(request.auth)

  // 로그인 계열 경로: 인증된 사용자는 역할별 홈으로
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(roleHome(role), request.url))
    }
    return NextResponse.next()
  }

  // 미인증 사용자는 로그인으로
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 역할별 접근 제한
  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  if (pathname.startsWith('/student') && role !== 'STUDENT' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL(roleHome(role), request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/login',
    '/login/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
}
