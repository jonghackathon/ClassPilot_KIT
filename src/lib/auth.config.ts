import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from '@/types'

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
        token.academyId = user.academyId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.id = token.id as string
        session.user.academyId = token.academyId as string
      }
      return session
    },
  },
}
