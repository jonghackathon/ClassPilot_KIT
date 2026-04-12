import { paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains } from '@/lib/route-helpers'
import { curriculumCreateSchema } from '@/lib/validations/curriculum'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const keyword = searchParams.get('q')
  const subject = searchParams.get('subject')
  const level = searchParams.get('level')

  const where = {
    academyId: session.user.academyId,
    ...(subject ? { subject } : {}),
    ...(level ? { level } : {}),
    ...(keyword
      ? {
          OR: [
            { name: searchContains(keyword) },
            { subject: searchContains(keyword) },
            { level: searchContains(keyword) },
          ],
        }
      : {}),
  }

  const [items, total] = await prisma.$transaction([
    prisma.curriculumClass.findMany({
      where,
      include: {
        classes: {
          select: {
            id: true,
            name: true,
            subject: true,
            level: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.curriculumClass.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, curriculumCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const created = await prisma.curriculumClass.create({
    data: {
      academyId: session.user.academyId,
      name: data.name,
      subject: data.subject ?? null,
      level: data.level ?? null,
      stages: data.stages,
      sortOrder: data.sortOrder ?? 0,
    },
  })

  return successResponse(created, 201)
}
