import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import NextAuth from 'next-auth'

import { authConfig } from '@/lib/auth.config'

const { auth } = NextAuth(authConfig)

export default auth((request) => {
  const pathname = request.nextUrl.pathname
  const role = request.auth?.user?.role
  const isLoggedIn = Boolean(request.auth)

  if (pathname === '/login') {
    if (!isLoggedIn) {
      return NextResponse.next()
    }

    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    if (role === 'TEACHER') {
      return NextResponse.redirect(new URL('/teacher/dashboard', request.url))
    }

    return NextResponse.redirect(new URL('/student/home', request.url))
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/admin') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/student') && role !== 'STUDENT' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/login', '/admin/:path*', '/teacher/:path*', '/student/:path*'],
}
