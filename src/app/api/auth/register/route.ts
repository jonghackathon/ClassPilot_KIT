import bcrypt from 'bcryptjs'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, toDate } from '@/lib/route-helpers'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  const { data, error } = await parseRequestBody(request, registerSchema)

  if (error || !data) {
    return error
  }

  const exists = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  })

  if (exists) {
    return errorResponse('CONFLICT', '이미 사용 중인 이메일입니다.', 409)
  }

  let academyId = data.academyId

  if (!academyId) {
    const existingAcademy = await prisma.academy.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })

    if (existingAcademy) {
      academyId = existingAcademy.id
    } else {
      const academy = await prisma.academy.create({
        data: {
          name: 'AcadeMind',
        },
        select: { id: true },
      })

      academyId = academy.id
    }
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)

  const user = await prisma.user.create({
    data: {
      academyId,
      email: data.email,
      password: hashedPassword,
      name: data.name,
      phone: data.phone ?? null,
      role: data.role,
      studentProfile:
        data.role === 'STUDENT' && data.studentProfile
          ? {
              create: {
                grade: data.studentProfile.grade ?? null,
                school: data.studentProfile.school ?? null,
                birthDate: toDate(data.studentProfile.birthDate),
                memo: data.studentProfile.memo ?? null,
                parents:
                  data.studentProfile.parentName && data.studentProfile.parentPhone
                    ? {
                        create: [
                          {
                            name: data.studentProfile.parentName,
                            phone: data.studentProfile.parentPhone,
                          },
                        ],
                      }
                    : undefined,
              },
            }
          : undefined,
    },
    select: {
      id: true,
      academyId: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })

  return successResponse(user, 201)
}
