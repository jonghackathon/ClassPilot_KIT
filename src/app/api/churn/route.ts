import { errorResponse, paginatedResponse } from '@/lib/api-response'
import { getTeacherStudentIds } from '@/lib/access-scope'
import { prisma } from '@/lib/db'
import { searchContains } from '@/lib/route-helpers'
import { getPageParams, withAuth } from '@/lib/with-auth'

const churnLevels = new Set(['SAFE', 'WARNING', 'DANGER'] as const)

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error) {
    return error
  }

  if (!session?.user) {
    return errorResponse('UNAUTHORIZED', '로그인이 필요합니다.', 401)
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const level = searchParams.get('level')
  const studentId = searchParams.get('studentId')
  const keyword = searchParams.get('q')
  let accessibleStudentIds: string[] | undefined

  if (session.user.role === 'TEACHER') {
    const teacherStudentIds = await getTeacherStudentIds(session.user.id)

    if (teacherStudentIds.length === 0) {
      return paginatedResponse([], 0, page, limit)
    }

    accessibleStudentIds = studentId
      ? teacherStudentIds.filter((item) => item === studentId)
      : teacherStudentIds

    if (accessibleStudentIds.length === 0) {
      return paginatedResponse([], 0, page, limit)
    }
  }

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
    ...(accessibleStudentIds ? { studentId: { in: accessibleStudentIds } } : {}),
    ...(level && churnLevels.has(level as 'SAFE' | 'WARNING' | 'DANGER')
      ? { level: level as 'SAFE' | 'WARNING' | 'DANGER' }
      : {}),
    ...(session.user.role === 'ADMIN' && studentId ? { studentId } : {}),
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
            studentProfile: {
              select: {
                grade: true,
              },
            },
            enrollments: {
              where: {
                active: true,
              },
              select: {
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
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
