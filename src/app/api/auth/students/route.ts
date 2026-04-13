import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { successResponse, errorResponse } from '@/lib/api-response'

// GET /api/auth/students?academyCode=ACAD-3F8K&classId=xxx
// 수강생 로그인 Step 2 — 반 학생 목록 반환 (이름 마스킹)
// 인증 불필요이나 academyCode + classId 조합 없이는 의미 없는 데이터
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const academyCode = searchParams.get('academyCode')?.trim().toUpperCase()
  const classId = searchParams.get('classId')?.trim()

  if (!academyCode) {
    return errorResponse('VALIDATION', '학원 코드를 입력해 주세요.', 400)
  }

  const academy = await prisma.academy.findUnique({
    where: { code: academyCode },
    select: { id: true },
  })

  if (!academy) {
    return errorResponse('NOT_FOUND', '학원 코드를 찾을 수 없어요.', 404)
  }

  // classId가 없으면 해당 학원의 반 목록만 반환
  if (!classId) {
    const classes = await prisma.class.findMany({
      where: { academyId: academy.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    return successResponse({ classes })
  }

  // classId가 있으면 해당 반의 수강생 목록 반환 (이름 끝 한 글자 마스킹)
  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId,
      class: { academyId: academy.id },
      active: true,
    },
    select: {
      student: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      student: { name: 'asc' },
    },
  })

  const students = enrollments.map(({ student }) => ({
    id: student.id,
    maskedName: maskName(student.name),
  }))

  return successResponse({ students })
}

// "김민수" → "김민○", "이수" → "이○", "수" → "○"
function maskName(name: string): string {
  if (name.length <= 1) return '○'
  return name.slice(0, -1) + '○'
}
