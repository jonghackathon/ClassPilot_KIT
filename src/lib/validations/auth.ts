import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  phone: z.string().optional(),
  academyId: z.string().cuid().optional(),
  studentProfile: z
    .object({
      grade: z.string().optional(),
      school: z.string().optional(),
      birthDate: z.string().datetime().optional(),
      memo: z.string().optional(),
      parentName: z.string().optional(),
      parentPhone: z.string().optional(),
    })
    .optional(),
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(4),
  newPassword: z.string().min(4),
})
