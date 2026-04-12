import { z } from 'zod'

export const reviewCreateSchema = z.object({
  studentId: z.string().cuid(),
  lessonId: z.string().cuid().optional().nullable(),
  summary: z.string().min(1),
  quiz: z.any().optional(),
  preview: z.string().optional().nullable(),
  readAt: z.string().datetime().optional().nullable(),
})

export const reviewUpdateSchema = reviewCreateSchema.partial()
