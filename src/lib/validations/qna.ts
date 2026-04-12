import { z } from 'zod'

export const qnaCreateSchema = z.object({
  studentId: z.string().cuid(),
  classId: z.string().cuid().optional().nullable(),
  question: z.string().min(1),
})

export const qnaUpdateSchema = z.object({
  helpful: z.boolean().optional(),
  status: z.enum(['PENDING', 'AI_ANSWERED', 'TEACHER_ANSWERED']).optional(),
})

export const qnaAnswerSchema = z.object({
  teacherAnswer: z.string().min(1),
})
