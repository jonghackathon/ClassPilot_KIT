import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// TODO: DB 연동 시 PrismaAdapter + bcrypt 검증 활성화
// import { PrismaAdapter } from '@auth/prisma-adapter'
// import bcrypt from 'bcryptjs'
// import { prisma } from './db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // TODO: DB 연동 시 실제 검증으로 교체
        // 개발용 데모 계정
        const demoAccounts: Record<string, { name: string; role: string }> = {
          'admin@academind.kr': { name: '정태', role: 'ADMIN' },
          'teacher@academind.kr': { name: '김민수', role: 'TEACHER' },
          'student@academind.kr': { name: '민수', role: 'STUDENT' },
        }

        const email = credentials.email as string
        const account = demoAccounts[email]

        if (!account || credentials.password !== '1234') return null

        return {
          id: email,
          email,
          name: account.name,
          role: account.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
  },
})
