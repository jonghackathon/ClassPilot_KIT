import { z } from 'zod'

export const userCreateSchema = z.object({
  academyId: z.string().cuid(),
  email: z.string().email(),
  password: z.string().min(4),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  phone: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  birthDate: z.string().datetime().optional().nullable(),
  memo: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
})

export const userUpdateSchema = userCreateSchema
  .omit({ academyId: true, password: true })
  .partial()

export const parentCreateSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  relation: z.string().optional().nullable(),
})
