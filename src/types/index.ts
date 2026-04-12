export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'EARLY_LEAVE' | 'ABSENT'
export type HomeworkStatus = 'COMPLETE' | 'INCOMPLETE'
export type AssignmentType = 'CODING' | 'ESSAY' | 'IMAGE'

export type SubmissionStatus = 'SUBMITTED' | 'NOT_SUBMITTED' | 'LATE_SUBMIT'

export type ChurnLevel = 'SAFE' | 'WARNING' | 'DANGER'

export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL'

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED'

export type ConsultationType = 'PHONE' | 'TEXT' | 'IN_PERSON'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
  }
}

export interface SessionUser {
  id: string
  academyId: string
  role: UserRole
  email?: string | null
  name?: string | null
}
