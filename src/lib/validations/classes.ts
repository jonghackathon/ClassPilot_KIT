import { z } from 'zod'

export const classCreateSchema = z.object({
  academyId: z.string().cuid(),
  curriculumId: z.string().cuid().optional().nullable(),
  name: z.string().min(1),
  subject: z.string().optional().nullable(),
  level: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  capacity: z.number().int().min(1).max(100),
})

export const classUpdateSchema = classCreateSchema.omit({ academyId: true }).partial()

export const scheduleCreateSchema = z.object({
  classId: z.string().cuid(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().min(4),
  endTime: z.string().min(4),
  room: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
})

export const scheduleUpdateSchema = scheduleCreateSchema.partial()

export const classMemberSchema = z.object({
  addStudentIds: z.array(z.string().cuid()).default([]),
  removeStudentIds: z.array(z.string().cuid()).default([]),
})
