import bcrypt from 'bcryptjs'

import { errorResponse, paginatedResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, searchContains, toDate } from '@/lib/route-helpers'
import { userCreateSchema } from '@/lib/validations/users'
import { getPageParams, withAuth } from '@/lib/with-auth'

export async function GET(request: Request) {
  const { session, error } = await withAuth(['ADMIN', 'TEACHER'])

  if (error || !session) {
    return error
  }

  const { searchParams, page, limit, skip } = getPageParams(request)
  const role = searchParams.get('role')
  const classId = searchParams.get('classId')
  const active = searchParams.get('active')
  const keyword = searchParams.get('q')

  const adminWhere = {
    academyId: session.user.academyId,
    ...(role ? { role: role as 'ADMIN' | 'TEACHER' | 'STUDENT' } : {}),
    ...(classId ? { enrollments: { some: { classId } } } : {}),
    ...(active ? { active: active === 'true' } : {}),
    ...(keyword
      ? {
          OR: [
            { name: searchContains(keyword) },
            { email: searchContains(keyword) },
            { phone: searchContains(keyword) },
          ],
        }
      : {}),
  }

  const teacherWhere = {
    academyId: session.user.academyId,
    role: 'STUDENT' as const,
    ...(classId
      ? {
          enrollments: {
            some: {
              classId,
              class: {
                teachers: {
                  some: { teacherId: session.user.id },
                },
              },
            },
          },
        }
      : {
          enrollments: {
            some: {
              class: {
                teachers: {
                  some: { teacherId: session.user.id },
                },
              },
            },
          },
        }),
    ...(active ? { active: active === 'true' } : {}),
    ...(keyword
      ? {
          OR: [
            { name: searchContains(keyword) },
            { email: searchContains(keyword) },
            { phone: searchContains(keyword) },
          ],
        }
      : {}),
  }

  const where = session.user.role === 'ADMIN' ? adminWhere : teacherWhere

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      include: {
        studentProfile: {
          include: {
            parents: true,
          },
        },
        enrollments: {
          where: { active: true },
          include: {
            class: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return paginatedResponse(items, total, page, limit)
}

export async function POST(request: Request) {
  const { session, error } = await withAuth(['ADMIN'])

  if (error || !session) {
    return error
  }

  const { data, error: validationError } = await parseRequestBody(request, userCreateSchema)

  if (validationError || !data) {
    return validationError
  }

  const exists = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (exists) {
    return errorResponse('CONFLICT', '이미 사용 중인 이메일입니다.', 409)
  }

  const password = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      academyId: session.user.academyId,
      email: data.email,
      password,
      name: data.name,
      phone: data.phone ?? null,
      role: data.role,
      studentProfile:
        data.role === 'STUDENT'
          ? {
              create: {
                grade: data.grade ?? null,
                school: data.school ?? null,
                birthDate: toDate(data.birthDate),
                memo: data.memo ?? null,
                parents:
                  data.parentName && data.parentPhone
                    ? {
                        create: [
                          {
                            name: data.parentName,
                            phone: data.parentPhone,
                          },
                        ],
                      }
                    : undefined,
              },
            }
          : undefined,
    },
    include: {
      studentProfile: {
        include: {
          parents: true,
        },
      },
    },
  })

  return successResponse(user, 201)
}
