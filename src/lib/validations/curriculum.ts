import { z } from 'zod'

export const curriculumCreateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  stages: z.any(),
  sortOrder: z.number().int().min(0).optional(),
})

export const curriculumUpdateSchema = curriculumCreateSchema.partial()
