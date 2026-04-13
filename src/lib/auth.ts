import NextAuth from 'next-auth'
import type { Adapter } from 'next-auth/adapters'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import { prisma } from './db'
import { authConfig } from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    Credentials({
      credentials: {
        type: { label: 'Type', type: 'text' },
        // staff 로그인
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // student 로그인
        academyCode: { label: 'Academy Code', type: 'text' },
        studentId: { label: 'Student ID', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        const type = credentials?.type as string

        if (type === 'student') {
          return authorizeStudent(credentials)
        }

        return authorizeStaff(credentials)
      },
    }),
  ],
})

async function authorizeStaff(
  credentials: Partial<Record<string, unknown>>,
) {
  const email = credentials?.email as string | undefined
  const password = credentials?.password as string | undefined

  if (!email || !password) return null

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.password || !user.active) return null

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    academyId: user.academyId,
  }
}

async function authorizeStudent(
  credentials: Partial<Record<string, unknown>>,
) {
  const academyCode = credentials?.academyCode as string | undefined
  const studentId = credentials?.studentId as string | undefined
  const pin = credentials?.pin as string | undefined

  if (!academyCode || !studentId || !pin) return null

  // 학원 코드 검증
  const academy = await prisma.academy.findUnique({
    where: { code: academyCode.toUpperCase() },
    select: { id: true },
  })
  if (!academy) return null

  // 수강생 조회 (같은 학원 소속인지 확인)
  const user = await prisma.user.findFirst({
    where: {
      id: studentId,
      academyId: academy.id,
      role: 'STUDENT',
      active: true,
    },
  })
  if (!user?.password) return null

  // PIN 검증 (bcrypt)
  const valid = await bcrypt.compare(pin, user.password)
  if (!valid) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    academyId: user.academyId,
  }
}
