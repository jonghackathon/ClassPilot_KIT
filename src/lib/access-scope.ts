import { prisma } from './db'

export async function getTeacherClassIds(teacherId: string) {
  const items = await prisma.classTeacher.findMany({
    where: { teacherId },
    select: { classId: true },
  })

  return items.map((item) => item.classId)
}

export async function teacherHasClassAccess(teacherId: string, classId: string) {
  const item = await prisma.classTeacher.findFirst({
    where: {
      teacherId,
      classId,
    },
    select: { id: true },
  })

  return Boolean(item)
}

export async function getTeacherStudentIds(teacherId: string) {
  const classIds = await getTeacherClassIds(teacherId)

  if (classIds.length === 0) {
    return []
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      classId: { in: classIds },
      active: true,
    },
    select: { studentId: true },
  })

  return [...new Set(enrollments.map((item) => item.studentId))]
}
