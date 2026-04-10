import { paginatedResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { searchContains } from '@/lib/route-helpers'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const level = searchParams.get('level')
  const studentId = searchParams.get('studentId')
  const keyword = searchParams.get('q')

  const where = {
    student: {
      academyId: session.user.academyId,
      ...(keyword
        ? {
            OR: [
              { name: searchContains(keyword) },
              { email: searchContains(keyword) },
            ],
          }
        : {}),
    },
    ...(level ? { level: level as 'LOW' | 'MEDIUM' | 'HIGH' } : {}),
    ...(studentId ? { studentId } : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.churnPrediction.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ calculatedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.churnPrediction.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}
