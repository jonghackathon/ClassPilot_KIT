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

  const studentWhere = {
    academyId: session.user.academyId,
    ...(keyword
      ? {
          OR: [
            { name: searchContains(keyword) },
            { email: searchContains(keyword) },
          ],
        }
      : {}),
    ...(accessibleStudentIds ? { id: { in: accessibleStudentIds } } : {}),
    ...(session.user.role === 'ADMIN' && studentId ? { id: studentId } : {}),
  }

  const students = await prisma.user.findMany({
    where: studentWhere,
    select: { id: true },
  })

  if (students.length === 0) {
    return paginatedResponse([], 0, page, limit)
  }

  const studentIds = students.map((item: { id: string }) => item.id)

  const predictions = await prisma.churnPrediction.findMany({
    where: {
      studentId: { in: studentIds },
    },
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
  })

  const latestByStudent = new Map<string, (typeof predictions)[number]>()

  for (const item of predictions) {
    if (!latestByStudent.has(item.studentId)) {
      latestByStudent.set(item.studentId, item)
    }
  }

  const latestItems = Array.from(latestByStudent.values())
    .filter((item) =>
      level && churnLevels.has(level as 'SAFE' | 'WARNING' | 'DANGER')
        ? item.level === (level as 'SAFE' | 'WARNING' | 'DANGER')
        : true,
    )
    .sort((left, right) => {
      const calculatedGap =
        new Date(right.calculatedAt).getTime() - new Date(left.calculatedAt).getTime()

      if (calculatedGap !== 0) {
        return calculatedGap
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })

  const total = latestItems.length
  const items = latestItems.slice(skip, skip + limit)

  return paginatedResponse(items, total, page, limit)
}
