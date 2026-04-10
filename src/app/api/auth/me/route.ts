import { successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { withAuth } from '@/lib/with-auth'

export async function GET() {
  const { session, error } = await withAuth()

  if (error || !session) {
    return error
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      studentProfile: {
        include: {
          parents: true,
        },
      },
    },
  })

  return successResponse(user)
}
