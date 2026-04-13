import { z } from 'zod'

const nullableDateString = z
  .string()
  .optional()
  .nullable()
  .refine((value) => {
    if (!value) {
      return true
    }

    return !Number.isNaN(new Date(value).getTime())
  }, '유효한 날짜를 입력해 주세요.')

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  phone: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  school: z.string().optional().nullable(),
  birthDate: nullableDateString,
  memo: z.string().optional().nullable(),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
})

export const userUpdateSchema = userCreateSchema
  .omit({ password: true })
  .partial()

export const parentCreateSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  relation: z.string().optional().nullable(),
})
