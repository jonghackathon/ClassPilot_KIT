import type { UserRole } from '@/types'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      academyId: string
      role: UserRole
    } & DefaultSession['user']
  }

  interface User {
    academyId: string
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    academyId?: string
    role?: UserRole
    id?: string
  }
}
