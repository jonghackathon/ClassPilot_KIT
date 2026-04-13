import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

import { errorResponse, successResponse } from '@/lib/api-response'
import { prisma } from '@/lib/db'
import { parseRequestBody, toDate } from '@/lib/route-helpers'
import { registerSchema } from '@/lib/validations/auth'

// 8자리 대문자 코드 생성 예: "ACAD-3F8K"
function generateAcademyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part1 = Array.from(randomBytes(4)).map((b) => chars[b % chars.length]).join('')
  const part2 = Array.from(randomBytes(4)).map((b) => chars[b % chars.length]).join('')
  return `${part1}-${part2}`
}

export async function POST(request: Request) {
  const { data, error } = await parseRequestBody(request, registerSchema)

  if (error) {
    return error
  }

  if (!data) {
    return errorResponse('VALIDATION', '입력값이 올바르지 않습니다.', 400)
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
          name: 'ClassPilot',
          code: generateAcademyCode(),
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
