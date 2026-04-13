# 화면별 API 매핑

**연관 문서:** 04_API_명세서.md
**대상:** 풀스택 (프론트↔백엔드 연결)

---

## 1. 인증

| 화면 | 액션 | API | 메서드 | 비고 |
|------|------|-----|--------|------|
| 로그인 | 로그인 | `/api/auth/callback/credentials` | POST | NextAuth 처리 |
| 로그인 | 세션 확인 | `/api/auth/session` | GET | 자동 (NextAuth) |
| 공통 | 로그아웃 | `/api/auth/signout` | POST | NextAuth 처리 |

---

## 2. 운영자 (ADMIN)

### 2.1 대시보드

| 섹션 | API | 메서드 | 파라미터 | 갱신 |
|------|-----|--------|---------|------|
| StatCard - 수강생 수 | `/api/users` | GET | `role=STUDENT&count=true` | SWR 5분 |
| StatCard - 오늘 수업 | `/api/lessons` | GET | `date=today` | SWR 5분 |
| StatCard - 미납 수강료 | `/api/payments` | GET | `status=UNPAID&month=current` | SWR 5분 |
| StatCard - 이탈 위험 | `/api/ai/churn` | GET | `level=DANGER&level=WARNING&count=true` | SWR 5분 |
| 이탈 위험 리스트 | `/api/ai/churn` | GET | `level=DANGER&level=WARNING&limit=5` | SWR 5분 |
| 오늘 수업 현황 | `/api/lessons` | GET | `date=today` | SWR 5분 |
| 미제출 과제 | `/api/assignments` | GET | `hasUnsubmitted=true&limit=5` | SWR 5분 |

### 2.2 학생 관리

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/users` | GET | `role=STUDENT&search=&classId=&status=&churnLevel=&page=&pageSize=20` |
| 학생 등록 | `/api/auth/register` | POST | `{ email, password, name, role: 'STUDENT' }` |
| 프로필 등록 | `/api/users/[id]` | PATCH | `{ grade, school, notes }` |
| 학부모 등록 | `/api/users/[id]/parents` | POST | `{ name, phone, relation }` |
| 학생 상세 | `/api/users/[id]` | GET | - |
| 학생 수정 | `/api/users/[id]` | PATCH | `{ name, grade, school, notes }` |
| 출결 통계 | `/api/attendance/stats` | GET | `studentId=[id]&month=` |
| 출결 이력 | `/api/attendance` | GET | `studentId=[id]&year=&month=` |

### 2.3 강사 관리

| 액션 | API | 메서드 |
|------|-----|--------|
| 목록 조회 | `/api/users?role=TEACHER` | GET |
| 강사 등록 | `/api/auth/register` | POST |

### 2.4 반 관리

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/classes` | GET | `subject=&dayOfWeek=&teacherId=` |
| 반 생성 | `/api/classes` | POST | `{ name, subject, level, capacity }` |
| 반 상세 | `/api/classes/[id]` | GET | - |
| 반 수정 | `/api/classes/[id]` | PATCH | `{ name, subject, level, capacity }` |
| 수강 등록 | `/api/classes/[id]/enroll` | POST | `{ studentId }` |
| 수강 해제 | `/api/classes/[id]/enroll` | DELETE | `{ studentId }` |
| 시간표 등록 | `/api/schedules` | POST | `{ classId, dayOfWeek, startTime, endTime }` |

### 2.5 시간표

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 주간 조회 | `/api/schedules` | GET | `weekStart=` |
| 수업 추가 | `/api/schedules` | POST | `{ classId, dayOfWeek, startTime, endTime }` |
| 충돌 확인 | `/api/schedules/conflicts` | GET | `dayOfWeek=&startTime=&endTime=` |

### 2.6 수강료

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 월별 조회 | `/api/payments` | GET | `year=&month=&status=` |
| 납부 처리 | `/api/payments` | POST | `{ studentId, classId, amount, paidAt, status }` |

### 2.7 이탈 예측

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/ai/churn` | GET | `classId=&level=` |
| 학생 이력 | `/api/ai/churn/[studentId]/history` | GET | - |
| 이탈 처리 | `/api/ai/churn/events` | POST | `{ studentId, churnType, reason }` |

### 2.8 민원

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/ai/complaint` | GET | `status=` |
| 민원 등록 | `/api/ai/complaint` | POST | `{ studentId, content }` |
| 응답 작성 | `/api/ai/complaint/[id]` | PATCH | `{ response, status }` |

### 2.9 상담

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 상담 기록 조회 | `/api/consultations` | GET | `studentId=` |
| 상담 기록 등록 | `/api/consultations` | POST | `{ studentId, type, content }` |

---

## 3. 강사 (TEACHER)

### 3.1 강사 홈

| 섹션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 오늘 수업 | `/api/lessons` | GET | `teacherId=me&date=today` |
| 미체크 출결 | `/api/attendance` | GET | `teacherId=me&date=today&unchecked=true&count=true` |
| 미제출 과제 | `/api/assignments` | GET | `teacherId=me&hasUnsubmitted=true&count=true` |
| 미답변 질문 | `/api/ai/bot/questions` | GET | `teacherId=me&status=UNANSWERED&limit=3` |
| 이탈 위험 | `/api/ai/churn` | GET | `teacherId=me&level=DANGER&level=WARNING&limit=3` |

### 3.2 출결 관리

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 날짜별 조회 | `/api/attendance` | GET | `date=[date]&teacherId=me` |
| 출결 입력 | `/api/attendance` | POST | `{ studentId, lessonId, status, date }` |
| 출결 수정 | `/api/attendance/[id]` | PATCH | `{ status, note }` |
| 전체 출석 | `/api/attendance/bulk` | POST | `{ lessonId, studentIds, status: 'PRESENT' }` |
| 일별 통계 | `/api/attendance/stats` | GET | `date=[date]&teacherId=me` |

### 3.3 과제 관리

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/assignments` | GET | `teacherId=me&classId=&sort=dueDate` |
| 과제 등록 | `/api/assignments` | POST | `{ classId, title, content, dueDate }` |
| 과제 상세 | `/api/assignments/[id]` | GET | - |
| 제출 이력 | `/api/assignments/[id]/submit/[studentId]/history` | GET | - |
| 피드백 작성 | `/api/assignments/[id]/feedback` | POST | `{ studentId, content }` |

### 3.4 AI 코파일럿

| 액션 | API | 메서드 | 파라미터 | 비고 |
|------|-----|--------|---------|------|
| 세션 생성 | `/api/ai/copilot/session` | POST | `{ lessonId }` | |
| 질문 전송 | `/api/ai/copilot/ask` | POST | `{ sessionId, question }` | **SSE 스트리밍** |
| 카드 사용 | `/api/ai/copilot/questions/[id]/use` | PATCH | `{ cardType }` | |
| 세션 종료 | `/api/ai/copilot/session/[id]` | PATCH | `{ status: 'COMPLETED' }` | |

### 3.5 수업 녹음

| 액션 | API | 메서드 | 파라미터 | 비고 |
|------|-----|--------|---------|------|
| 파일 업로드 | `/api/ai/recording/upload` | POST | `FormData: file, lessonId` | multipart |
| 상태 확인 | `/api/ai/recording/[id]/status` | GET | - | 폴링 (10초 간격) |
| 결과 조회 | `/api/ai/recording/[id]` | GET | - | |
| 요약 수정 | `/api/ai/recording/[id]` | PATCH | `{ summary, ... }` | |
| 내역 목록 | `/api/ai/recording` | GET | `teacherId=me` | |

### 3.6 질문봇

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 질문 목록 | `/api/ai/bot/questions` | GET | `teacherId=me&status=&classId=` |
| 답변 작성 | `/api/ai/bot/questions/[id]/answer` | POST | `{ answer, addToFAQ }` |
| FAQ 목록 | `/api/ai/bot/faq` | GET | `classId=` |
| FAQ 수정 | `/api/ai/bot/faq/[id]` | PATCH | `{ question, answer }` |
| FAQ 삭제 | `/api/ai/bot/faq/[id]` | DELETE | - |

### 3.7 진도 관리

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 커리큘럼 조회 | `/api/curricula` | GET | `classId=` |
| 진도 기록 | `/api/lessons/[id]/progress` | POST | `{ unitIds }` |

### 3.8 이탈 현황

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/ai/churn` | GET | `teacherId=me&classId=` |

---

## 4. 수강생 (STUDENT)

### 4.1 홈

| 섹션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 오늘 수업 | `/api/lessons` | GET | `studentId=me&date=today` |
| 새 복습 자료 | `/api/ai/review` | GET | `studentId=me&unread=true&limit=1` |
| 미제출 과제 | `/api/assignments` | GET | `studentId=me&status=NOT_SUBMITTED` |
| 출석률 | `/api/attendance/stats` | GET | `studentId=me&month=current` |

### 4.2 내 출결

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 월별 조회 | `/api/attendance` | GET | `studentId=me&year=&month=` |
| 통계 | `/api/attendance/stats` | GET | `studentId=me&year=&month=` |

### 4.3 내 과제

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/assignments` | GET | `studentId=me&status=` |
| 과제 상세 | `/api/assignments/[id]` | GET | - |
| 자동 저장 | `/api/assignments/[id]/submit/history` | POST | `{ content, charCount }` |
| 과제 제출 | `/api/assignments/[id]/submit` | POST | `{ content, aiUsed, aiUsageDetail }` |

### 4.4 복습

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 목록 조회 | `/api/ai/review` | GET | `studentId=me` |
| 상세 조회 | `/api/ai/review/[id]` | GET | - |
| 읽음 처리 | `/api/ai/review/[id]/read` | PATCH | - |

### 4.5 질문하기

| 액션 | API | 메서드 | 파라미터 |
|------|-----|--------|---------|
| 질문 전송 | `/api/ai/bot/questions` | POST | `{ classId, question }` |
| 내 질문 목록 | `/api/ai/bot/questions` | GET | `studentId=me` |
| 피드백 제출 | `/api/ai/bot/questions/[id]/feedback` | POST | `{ helpful: boolean }` |

---

## 5. API 호출 패턴

### 5.1 SWR 기본 설정

```typescript
// lib/fetcher.ts
const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error(res.statusText)
    return res.json()
  })

// 사용 예
const { data, error, isLoading, mutate } = useSWR(
  '/api/attendance?date=2026-04-08',
  fetcher
)
```

### 5.2 낙관적 업데이트 패턴

```typescript
// 출결 입력 예
const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
  // 1. 낙관적 업데이트
  mutate(
    currentData => ({
      ...currentData,
      items: currentData.items.map(item =>
        item.studentId === studentId ? { ...item, status } : item
      )
    }),
    false // revalidate = false
  )

  try {
    // 2. API 호출
    await fetch('/api/attendance', {
      method: 'POST',
      body: JSON.stringify({ studentId, status })
    })
    // 3. 서버 데이터 동기화
    mutate()
  } catch {
    // 4. 실패 시 롤백
    mutate()
    toast.error('저장에 실패했습니다')
  }
}
```

### 5.3 SSE 스트리밍 패턴 (코파일럿)

```typescript
// 코파일럿 질문 전송
const askCopilot = (sessionId: string, question: string) => {
  const eventSource = new EventSource(
    `/api/ai/copilot/ask?sessionId=${sessionId}&question=${encodeURIComponent(question)}`
  )

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    // data.type: 'beginner' | 'example' | 'advanced' | 'summary'
    // data.content: 스트리밍 텍스트 (누적)
    // data.done: boolean
    updateCard(data.type, data.content)
    if (data.done) eventSource.close()
  }

  eventSource.onerror = () => {
    eventSource.close()
    showReconnectUI()
  }
}
```

### 5.4 파일 업로드 패턴 (녹음)

```typescript
const uploadRecording = async (file: File, lessonId: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('lessonId', lessonId)

  const response = await fetch('/api/ai/recording/upload', {
    method: 'POST',
    body: formData,
    // Content-Type 헤더 설정하지 않음 (FormData가 자동 설정)
  })

  const { data } = await response.json()
  return data.recordingId // 이후 상태 폴링에 사용
}

// 상태 폴링
const pollStatus = (recordingId: string) => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/ai/recording/${recordingId}/status`)
    const { data } = await res.json()
    updateProgress(data.progress)
    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      clearInterval(interval)
    }
  }, 10000) // 10초 간격
}
```
