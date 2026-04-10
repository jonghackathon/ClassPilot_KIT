import { z } from 'zod'

export const consultationCreateSchema = z.object({
  studentId: z.string().cuid(),
  ownerId: z.string().cuid(),
  type: z.enum(['PHONE', 'TEXT', 'IN_PERSON']),
  content: z.string().min(1),
})

export const consultationUpdateSchema = consultationCreateSchema.partial()
