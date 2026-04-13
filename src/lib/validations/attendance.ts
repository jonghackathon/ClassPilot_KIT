import { z } from 'zod'

export const attendanceCreateSchema = z.object({
  classId: z.string().cuid(),
  studentId: z.string().cuid(),
  lessonId: z.string().cuid().optional().nullable(),
  date: z.string().datetime(),
  status: z.enum(['PRESENT', 'LATE', 'EARLY_LEAVE', 'ABSENT']),
  homeworkStatus: z.enum(['COMPLETE', 'INCOMPLETE']).optional().nullable(),
  homeworkNote: z.string().optional().nullable(),
  absenceReason: z.string().optional().nullable(),
})

export const attendanceUpdateSchema = attendanceCreateSchema.partial()
