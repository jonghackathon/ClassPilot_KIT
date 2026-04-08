import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const publicPaths = ['/login']

const roleHomePaths: Record<string, string> = {
  ADMIN: '/dashboard',
  TEACHER: '/dashboard',
  STUDENT: '/home',
}

const roleRoutePrefixes: Record<string, string> = {
  ADMIN: '/(admin)',
  TEACHER: '/(teacher)',
  STUDENT: '/(student)',
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role as string | undefined

  // Public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    if (isLoggedIn && role) {
      return NextResponse.redirect(
        new URL(roleHomePaths[role] || '/login', req.url),
      )
    }
    return NextResponse.next()
  }

  // Not logged in → redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Root path → redirect to role home
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(roleHomePaths[role!] || '/login', req.url),
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
