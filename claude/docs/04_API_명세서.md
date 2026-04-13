# API 명세서

**프로젝트명:** AcadeMind (가칭)
**작성일:** 2026.04.08
**버전:** v1.0
**연관 문서:** 02_기능_요구사항_정의서.md / 03_DB_스키마_설계서.md
**기반:** Next.js 14 App Router — Route Handlers (`app/api/...`)

---

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [인증](#2-인증)
3. [사용자 · 학원](#3-사용자--학원)
4. [반 · 시간표 · 수업](#4-반--시간표--수업)
5. [출결](#5-출결)
6. [과제 · 제출](#6-과제--제출)
7. [수업 진도](#7-수업-진도)
8. [수강료](#8-수강료)
9. [상담 · 보강](#9-상담--보강)
10. [AI — 수업 코파일럿](#10-ai--수업-코파일럿)
11. [AI — 수업 녹음 정리](#11-ai--수업-녹음-정리)
12. [AI — 질문봇](#12-ai--질문봇)
13. [AI — 복습 요약](#13-ai--복습-요약)
14. [AI — 이탈 예측](#14-ai--이탈-예측)
15. [AI — 민원 코파일럿](#15-ai--민원-코파일럿)
16. [에러 코드 정의](#16-에러-코드-정의)

---

## 1. 공통 규칙

### 1.1 Base URL

```
개발: http://localhost:3000/api
프로덕션: https://academind.vercel.app/api
```

### 1.2 인증 방식

모든 API는 NextAuth.js 세션 쿠키 기반 인증.
서버 사이드에서 `getServerSession()`으로 세션 검증 후 처리.

```
요청 헤더에 별도 토큰 불필요 — 쿠키 자동 전송
```

### 1.3 공통 응답 구조

**성공**
```json
{
  "success": true,
  "data": { ... }
}
```

**실패**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다."
  }
}
```

### 1.4 HTTP 상태 코드

| 코드 | 의미 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (유효성 검사 실패) |
| 401 | 인증 필요 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 충돌 (중복 데이터) |
| 500 | 서버 오류 |

### 1.5 역할별 접근 표기

| 표기 | 의미 |
|------|------|
| 🔴 ADMIN | 운영자만 |
| 🟡 TEACHER | 강사만 |
| 🟢 STUDENT | 수강생만 |
| 🔵 ALL | 로그인한 모든 역할 |
| 🔴🟡 | ADMIN + TEACHER |

### 1.6 페이지네이션 (목록 API 공통)

```
GET /api/...?page=1&limit=20

응답:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "totalPages": 5
  }
}
```

---

## 2. 인증

### POST /api/auth/register
운영자가 강사·수강생 계정을 생성한다.

- **권한:** 🔴 ADMIN
- **파일:** `app/api/auth/register/route.ts`

**Request Body**
```json
{
  "email": "teacher@example.com",
  "password": "plaintext123",
  "name": "김강사",
  "role": "TEACHER"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "email": "teacher@example.com",
    "name": "김강사",
    "role": "TEACHER"
  }
}
```

**에러**
| 상황 | 코드 | 상태 |
|------|------|------|
| 이메일 중복 | EMAIL_DUPLICATE | 409 |
| 필드 누락 | VALIDATION_ERROR | 400 |

---

### POST /api/auth/login
NextAuth signIn 래퍼. credentials provider 사용.

- **권한:** 없음 (공개)
- **파일:** `app/api/auth/[...nextauth]/route.ts`

> NextAuth 기본 엔드포인트 사용. 직접 구현 불필요.
> 로그인 성공 시 세션 쿠키 자동 발급, 역할별 페이지로 redirect.

---

### GET /api/auth/me
현재 로그인 사용자 정보 조회.

- **권한:** 🔵 ALL
- **파일:** `app/api/auth/me/route.ts`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "김강사",
    "role": "TEACHER",
    "academyId": "clx..."
  }
}
```

---

### PATCH /api/auth/password
비밀번호 변경.

- **권한:** 🔵 ALL (본인만)
- **파일:** `app/api/auth/password/route.ts`

**Request Body**
```json
{
  "currentPassword": "old123",
  "newPassword": "new456"
}
```

---

## 3. 사용자 · 학원

### GET /api/users
학원 내 사용자 목록 조회.

- **권한:** 🔴 ADMIN
- **파일:** `app/api/users/route.ts`

**Query Parameters**
```
?role=TEACHER          // 역할 필터
?isActive=true         // 활성 여부
?page=1&limit=20
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "김강사",
      "email": "kim@example.com",
      "role": "TEACHER",
      "isActive": true
    }
  ],
  "pagination": { ... }
}
```

---

### GET /api/users/[id]
특정 사용자 상세 조회.

- **권한:** 🔴 ADMIN, 🔵 본인
- **파일:** `app/api/users/[id]/route.ts`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "김민준",
    "email": "minjun@example.com",
    "role": "STUDENT",
    "studentProfile": {
      "grade": "초등 4학년",
      "school": "서울초등학교",
      "memo": ""
    },
    "parentContacts": [
      {
        "id": "clx...",
        "name": "김철수",
        "phone": "010-****-5678",
        "relation": "부",
        "isMain": true
      }
    ]
  }
}
```

---

### PATCH /api/users/[id]
사용자 정보 수정.

- **권한:** 🔴 ADMIN, 🔵 본인 (name만)
- **파일:** `app/api/users/[id]/route.ts`

**Request Body**
```json
{
  "name": "김민준",
  "isActive": true,
  "studentProfile": {
    "grade": "초등 5학년",
    "memo": "수학 약함"
  }
}
```

---

### POST /api/users/[id]/parents
학부모 연락처 추가.

- **권한:** 🔴 ADMIN
- **파일:** `app/api/users/[id]/parents/route.ts`

**Request Body**
```json
{
  "name": "김철수",
  "phone": "010-1234-5678",
  "relation": "부",
  "isMain": true
}
```

---

## 4. 반 · 시간표 · 수업

### GET /api/classes
반 목록 조회.

- **권한:** 🔴🟡 ADMIN, TEACHER
- **파일:** `app/api/classes/route.ts`

**Query Parameters**
```
?isActive=true
?subject=Java
?teacherId=clx...     // 담당 강사 필터 (TEACHER 본인은 자동 적용)
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "name": "(화-초4) 친절한 설명",
      "subject": "독서논술",
      "level": "기초",
      "capacity": 8,
      "enrollmentCount": 6,
      "teachers": [
        { "id": "clx...", "name": "박강사", "isPrimary": true }
      ]
    }
  ]
}
```

---

### POST /api/classes
반 생성.

- **권한:** 🔴 ADMIN
- **파일:** `app/api/classes/route.ts`

**Request Body**
```json
{
  "name": "(화-초4) 친절한 설명",
  "subject": "독서논술",
  "level": "기초",
  "capacity": 8,
  "curriculumId": "clx...",
  "teacherIds": ["clx..."],
  "primaryTeacherId": "clx..."
}
```

---

### GET /api/classes/[id]
반 상세 조회 (학생 목록 포함).

- **권한:** 🔴🟡
- **파일:** `app/api/classes/[id]/route.ts`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "(화-초4) 친절한 설명",
    "subject": "독서논술",
    "capacity": 8,
    "enrollments": [
      {
        "id": "clx...",
        "student": {
          "id": "clx...",
          "name": "김민준",
          "studentProfile": { "grade": "초등 4학년" }
        },
        "enrolledAt": "2026-03-01T00:00:00Z"
      }
    ],
    "schedules": [
      {
        "id": "clx...",
        "dayOfWeek": 1,
        "startTime": "15:00",
        "endTime": "17:00",
        "room": "A강의실"
      }
    ]
  }
}
```

---

### POST /api/classes/[id]/enroll
학생 반 배정.

- **권한:** 🔴 ADMIN
- **파일:** `app/api/classes/[id]/enroll/route.ts`

**Request Body**
```json
{
  "studentId": "clx..."
}
```

**에러**
| 상황 | 코드 | 상태 |
|------|------|------|
| 정원 초과 | CLASS_FULL | 409 |
| 이미 수강 중 | ALREADY_ENROLLED | 409 |

---

### DELETE /api/classes/[id]/enroll/[studentId]
학생 퇴반 처리 (soft delete).

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "leaveReason": "레벨 이동"
}
```

---

### GET /api/classes/[id]/schedules
반 시간표 조회.

- **권한:** 🔴🟡🟢
- **파일:** `app/api/classes/[id]/schedules/route.ts`

---

### POST /api/classes/[id]/schedules
시간표 등록.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "dayOfWeek": 1,
  "startTime": "15:00",
  "endTime": "17:00",
  "room": "A강의실"
}
```

**에러**
| 상황 | 코드 | 상태 |
|------|------|------|
| 강사 시간 충돌 | TEACHER_CONFLICT | 409 |
| 강의실 시간 충돌 | ROOM_CONFLICT | 409 |

---

### GET /api/lessons
수업 목록 조회.

- **권한:** 🔴🟡
- **파일:** `app/api/lessons/route.ts`

**Query Parameters**
```
?classId=clx...
?date=2026-04-07        // 특정 날짜
?startDate=2026-04-01&endDate=2026-04-30
?status=SCHEDULED
```

---

### POST /api/lessons
수업 인스턴스 생성 (스케줄 기반 자동 or 수동).

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "classId": "clx...",
  "scheduleId": "clx...",
  "date": "2026-04-08",
  "topic": "예외처리 try-catch-finally"
}
```

---

### PATCH /api/lessons/[id]
수업 정보 수정 (주제, 메모, 상태).

- **권한:** 🔴🟡

**Request Body**
```json
{
  "topic": "예외처리 심화",
  "note": "finally 개념 추가 설명 필요",
  "status": "COMPLETED"
}
```

---

## 5. 출결

### GET /api/attendance
출결 목록 조회.

- **권한:** 🔴🟡 (담당 반), 🟢 (본인만)
- **파일:** `app/api/attendance/route.ts`

**Query Parameters**
```
?lessonId=clx...        // 특정 수업
?classId=clx...         // 반 전체
?studentId=clx...       // 학생 개인
?date=2026-04-07
?startDate=...&endDate=...
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "lessonId": "clx...",
      "student": {
        "id": "clx...",
        "name": "김민준",
        "studentProfile": { "grade": "초등 4학년" }
      },
      "status": "PRESENT",
      "note": null,
      "createdAt": "2026-04-07T15:05:00Z"
    }
  ]
}
```

---

### POST /api/attendance
출결 입력 (단건).

- **권한:** 🔴🟡
- **파일:** `app/api/attendance/route.ts`

**Request Body**
```json
{
  "lessonId": "clx...",
  "studentId": "clx...",
  "status": "PRESENT",
  "note": ""
}
```

---

### POST /api/attendance/bulk
출결 일괄 입력 (수업 전체 학생).

- **권한:** 🔴🟡
- **파일:** `app/api/attendance/bulk/route.ts`

**Request Body**
```json
{
  "lessonId": "clx...",
  "records": [
    { "studentId": "clx...", "status": "PRESENT" },
    { "studentId": "clx...", "status": "ABSENT", "note": "감기" },
    { "studentId": "clx...", "status": "LATE" }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "updated": 1,
    "total": 3
  }
}
```

---

### PATCH /api/attendance/[id]
출결 수정 (ADMIN만, 수정 이력 자동 기록).

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "status": "LATE",
  "reason": "실수로 결석 처리"
}
```

---

### GET /api/attendance/stats
출결 통계 조회.

- **권한:** 🔴🟡
- **파일:** `app/api/attendance/stats/route.ts`

**Query Parameters**
```
?classId=clx...
?studentId=clx...
?startDate=2026-03-01&endDate=2026-04-30
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "total": 20,
    "present": 16,
    "late": 2,
    "earlyLeave": 1,
    "absent": 1,
    "attendanceRate": 80
  }
}
```

---

## 6. 과제 · 제출

### GET /api/assignments
과제 목록 조회.

- **권한:** 🔴🟡 (반별), 🟢 (본인 수강 반만)
- **파일:** `app/api/assignments/route.ts`

**Query Parameters**
```
?classId=clx...
?studentId=clx...      // STUDENT: 본인 자동 적용
?status=NOT_SUBMITTED  // STUDENT 필터
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "예외처리 실습 과제",
      "description": "try-catch 예제 3가지 작성",
      "dueDate": "2026-04-10T23:59:59Z",
      "class": { "id": "clx...", "name": "(화-초4) 친절한 설명" },
      "submissionStats": {
        "total": 6,
        "submitted": 4,
        "notSubmitted": 2
      }
    }
  ]
}
```

---

### POST /api/assignments
과제 등록.

- **권한:** 🔴🟡
- **파일:** `app/api/assignments/route.ts`

**Request Body**
```json
{
  "classId": "clx...",
  "lessonId": "clx...",
  "title": "예외처리 실습 과제",
  "description": "try-catch 예제 3가지 작성",
  "dueDate": "2026-04-10T23:59:59Z"
}
```

---

### GET /api/assignments/[id]
과제 상세 + 제출 현황.

- **권한:** 🔴🟡, 🟢 (본인 제출만)

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "title": "예외처리 실습 과제",
    "dueDate": "2026-04-10T23:59:59Z",
    "submissions": [
      {
        "id": "clx...",
        "student": { "id": "clx...", "name": "김민준" },
        "status": "SUBMITTED",
        "usedAI": true,
        "submittedAt": "2026-04-09T20:30:00Z",
        "historyCount": 12
      }
    ]
  }
}
```

---

### POST /api/assignments/[id]/submit
과제 제출.

- **권한:** 🟢 STUDENT
- **파일:** `app/api/assignments/[id]/submit/route.ts`

**Request Body**
```json
{
  "content": "과제 내용 텍스트",
  "usedAI": true,
  "aiPromptSummary": "ChatGPT에 예외처리 예시 요청"
}
```

---

### PATCH /api/assignments/[id]/submit
제출 내용 수정 (마감 전).

- **권한:** 🟢 STUDENT

**Request Body**
```json
{
  "content": "수정된 과제 내용"
}
```

---

### POST /api/assignments/[id]/submit/history
과제 작성 이력 저장 (N분 간격 자동 호출).

- **권한:** 🟢 STUDENT
- **파일:** `app/api/assignments/[id]/submit/history/route.ts`

**Request Body**
```json
{
  "content": "현재 작성 중인 내용 스냅샷",
  "charCount": 342
}
```

---

### GET /api/assignments/[id]/submit/[studentId]/history
과제 작성 이력 조회 (과정 증빙).

- **권한:** 🔴🟡 (강사·운영자)

**Response 200**
```json
{
  "success": true,
  "data": {
    "submission": {
      "studentName": "김민준",
      "usedAI": true,
      "aiPromptSummary": "예외처리 예시 요청"
    },
    "histories": [
      { "savedAt": "2026-04-09T19:00:00Z", "charCount": 0, "content": "" },
      { "savedAt": "2026-04-09T19:05:00Z", "charCount": 87, "content": "try {..." },
      { "savedAt": "2026-04-09T19:10:00Z", "charCount": 210, "content": "try {..." }
    ]
  }
}
```

---

### PATCH /api/assignments/[id]/feedback/[studentId]
강사 피드백 입력.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "feedback": "finally 블록 위치가 잘못됐습니다. 수정 후 재제출하세요."
}
```

---

## 7. 수업 진도

### GET /api/curricula
커리큘럼 목록.

- **권한:** 🔴🟡
- **파일:** `app/api/curricula/route.ts`

---

### POST /api/curricula
커리큘럼 생성.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "name": "독서논술 기초 과정",
  "subject": "독서논술",
  "description": "초등 3~4학년 대상"
}
```

---

### POST /api/curricula/[id]/units
단원 추가.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "order": 1,
  "title": "1단원 - 글의 구조 이해",
  "estimatedLessons": 3
}
```

---

### GET /api/lessons/[id]/progress
수업별 진도 현황 조회.

- **권한:** 🔴🟡

**Response 200**
```json
{
  "success": true,
  "data": {
    "lessonId": "clx...",
    "curriculum": {
      "name": "독서논술 기초 과정",
      "totalUnits": 12
    },
    "progresses": [
      { "unitId": "clx...", "title": "1단원", "completed": true },
      { "unitId": "clx...", "title": "2단원", "completed": false }
    ],
    "completedCount": 1,
    "progressRate": 8.3
  }
}
```

---

### POST /api/lessons/[id]/progress
진도 체크.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "unitId": "clx...",
  "completed": true,
  "note": "심화 예제까지 완료"
}
```

---

## 8. 수강료

### GET /api/payments
수강료 목록 조회.

- **권한:** 🔴 ADMIN, 🟢 본인만
- **파일:** `app/api/payments/route.ts`

**Query Parameters**
```
?studentId=clx...
?classId=clx...
?year=2026&month=4
?status=UNPAID
```

---

### POST /api/payments
수강료 등록.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "studentId": "clx...",
  "classId": "clx...",
  "year": 2026,
  "month": 4,
  "amount": 150000
}
```

---

### PATCH /api/payments/[id]
납부 처리.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "status": "PAID",
  "paidAt": "2026-04-05T10:00:00Z",
  "note": "계좌이체 확인"
}
```

---

## 9. 상담 · 보강

### GET /api/consultations
상담 이력 조회.

- **권한:** 🔴🟡
- **파일:** `app/api/consultations/route.ts`

**Query Parameters**
```
?studentId=clx...
?startDate=...&endDate=...
```

---

### POST /api/consultations
상담 기록 추가.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "studentId": "clx...",
  "type": "PHONE",
  "content": "학습 의욕 저하 확인, 과제 부담 줄이기로 합의",
  "followUp": "다음 주 재상담 예정",
  "consultedAt": "2026-04-08T14:00:00Z"
}
```

---

### GET /api/makeup
보강 목록 조회.

- **권한:** 🔴🟡
- **파일:** `app/api/makeup/route.ts`

**Query Parameters**
```
?studentId=clx...
?status=REQUESTED
```

---

### POST /api/makeup
보강 신청.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "studentId": "clx...",
  "originalLessonId": "clx..."
}
```

---

### PATCH /api/makeup/[id]
보강 확정.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "makeupLessonId": "clx...",
  "status": "CONFIRMED"
}
```

---

## 10. AI — 수업 코파일럿

### POST /api/ai/copilot/session
코파일럿 세션 시작 (수업 시작 시 1회 호출).

- **권한:** 🟡 TEACHER
- **파일:** `app/api/ai/copilot/session/route.ts`

**Request Body**
```json
{
  "lessonId": "clx...",
  "topic": "예외처리 try-catch-finally",
  "levelConfig": {
    "beginner": 30,
    "mid": 50,
    "advanced": 20
  }
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "sessionId": "clx..."
  }
}
```

---

### POST /api/ai/copilot/ask
질문 입력 → AI 응답 생성 (스트리밍).

- **권한:** 🟡 TEACHER
- **파일:** `app/api/ai/copilot/ask/route.ts`

**Request Body**
```json
{
  "sessionId": "clx...",
  "question": "finally는 항상 실행되나요?",
  "inputMethod": "TEXT"
}
```

**Response: SSE (Server-Sent Events) 스트리밍**

```
Content-Type: text/event-stream

data: {"type":"start","questionId":"clx..."}

data: {"type":"chunk","card":"beginner","text":"finally는 "}
data: {"type":"chunk","card":"beginner","text":"try-catch가 "}
...

data: {"type":"chunk","card":"example","text":"try {"}
...

data: {"type":"done","response":{
  "beginner":  {"content":"finally는 try-catch가 끝나면 반드시 실행되는 블록이에요..."},
  "example":   {"content":"아래 코드를 보세요.","code":"try {\n  int a = 1/0;\n} catch..."},
  "advanced":  {"content":"Q1. System.exit() 호출 시에도 실행될까요?..."},
  "summary":   {"content":"• finally = 반드시 실행\n• 예외 발생 여부 무관\n• 자원 해제에 활용"}
}}
```

**구현 참고 (Route Handler)**
```typescript
// app/api/ai/copilot/ask/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        stream: true,
        system: buildCopilotSystemPrompt(session),
        messages: [{ role: 'user', content: body.question }]
      })

      for await (const chunk of response) {
        if (chunk.type === 'content_block_delta') {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'chunk', text: chunk.delta.text })}\n\n`
          ))
        }
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

---

### PATCH /api/ai/copilot/questions/[id]/use
사용한 카드 기록.

- **권한:** 🟡 TEACHER

**Request Body**
```json
{
  "usedCardType": "beginner"
}
```

---

### GET /api/ai/copilot/sessions/[sessionId]/questions
세션 내 질문 이력 조회.

- **권한:** 🟡 TEACHER

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "question": "finally는 항상 실행되나요?",
      "usedCardType": "beginner",
      "responseMs": 2341,
      "createdAt": "2026-04-08T15:23:00Z"
    }
  ]
}
```

---

## 11. AI — 수업 녹음 정리

### POST /api/ai/recording/upload
녹음 파일 업로드 + 변환 시작.

- **권한:** 🟡 TEACHER
- **파일:** `app/api/ai/recording/upload/route.ts`
- **Content-Type:** `multipart/form-data`

**Request (FormData)**
```
lessonId: "clx..."
file: [audio file]    // mp3, m4a, wav / 최대 100MB
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "summaryId": "clx...",
    "status": "UPLOADING"
  }
}
```

> 처리 흐름: 업로드 → Supabase Storage 저장 → Whisper API 변환 → Claude 요약 → 상태 업데이트
> 클라이언트는 polling 또는 SSE로 상태 확인.

---

### GET /api/ai/recording/[id]/status
처리 상태 폴링.

- **권한:** 🟡 TEACHER

**Response 200**
```json
{
  "success": true,
  "data": {
    "status": "SUMMARIZING",
    "progress": 60
  }
}
```

---

### GET /api/ai/recording/[id]
완료된 요약 조회.

- **권한:** 🟡 TEACHER

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "status": "DONE",
    "summaryTopics": "오늘은 예외처리의 try-catch-finally 구조를 학습했습니다...",
    "summaryQuestions": [
      "finally는 항상 실행되나요?",
      "catch 없이 finally만 쓸 수 있나요?"
    ],
    "summaryNextPoint": "다음 수업: checked vs unchecked 예외 구분",
    "editedSummary": null
  }
}
```

---

### PATCH /api/ai/recording/[id]
요약 내용 수정 저장.

- **권한:** 🟡 TEACHER

**Request Body**
```json
{
  "editedSummary": "강사가 직접 수정한 최종 요약 내용"
}
```

---

## 12. AI — 질문봇

### POST /api/ai/bot/questions
학생 질문 입력.

- **권한:** 🟢 STUDENT
- **파일:** `app/api/ai/bot/questions/route.ts`

**Request Body**
```json
{
  "classId": "clx...",
  "question": "catch 없이 finally만 쓸 수 있나요?"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "questionId": "clx...",
    "aiAnswer": "네, try-finally 구조도 가능합니다. 다만 예외를 잡지 않기 때문에...",
    "aiConfidence": 0.91,
    "isResolved": true
  }
}
```

---

### GET /api/ai/bot/questions
질문 목록 조회.

- **권한:** 🟡 TEACHER (미해결만), 🟢 STUDENT (본인만)

**Query Parameters**
```
?classId=clx...
?isResolved=false       // 미해결 필터 (TEACHER용)
?studentId=clx...       // STUDENT 자동 적용
```

---

### POST /api/ai/bot/questions/[id]/answer
강사 직접 답변.

- **권한:** 🟡 TEACHER

**Request Body**
```json
{
  "teacherAnswer": "try-finally는 가능하지만, 실무에서는 권장하지 않습니다..."
}
```

---

### PATCH /api/ai/bot/questions/[id]/feedback
학생 피드백 (도움 됐는지).

- **권한:** 🟢 STUDENT

**Request Body**
```json
{
  "studentFeedback": "HELPFUL"
}
```

---

### GET /api/ai/bot/faq
FAQ 목록 조회.

- **권한:** 🔴🟡🟢

**Query Parameters**
```
?classId=clx...
```

---

### POST /api/ai/bot/faq/[id]/approve
FAQ 강사 승인.

- **권한:** 🟡 TEACHER

---

## 13. AI — 복습 요약

### POST /api/ai/review/generate
수업 종료 후 복습 요약 생성 및 발송.

- **권한:** 🔴🟡 (수업 종료 시 자동 트리거 or 수동 호출)
- **파일:** `app/api/ai/review/generate/route.ts`

**Request Body**
```json
{
  "lessonId": "clx..."
}
```

**처리 흐름**
```
1. Lesson 정보 + 오늘 CopilotQuestion 목록 조회
2. 출석 학생 목록 조회
3. Claude API → 핵심 요약 + 퀴즈 생성
4. 학생별 ReviewSummary 저장
5. 알림 발송
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "generatedCount": 5,
    "sentCount": 5
  }
}
```

---

### GET /api/ai/review
복습 요약 조회.

- **권한:** 🟢 STUDENT (본인만), 🔴🟡 (반 전체)

**Query Parameters**
```
?lessonId=clx...
?studentId=clx...
```

**Response 200 (STUDENT 기준)**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "summaryText": "오늘 배운 핵심:\n1. finally는 항상 실행됩니다\n2. ...",
    "quizzes": [
      {
        "question": "finally 블록은 언제 실행되나요?",
        "options": ["항상", "예외 시만", "정상 종료 시만", "안 됨"],
        "answer": 0,
        "explanation": "System.exit() 제외 시 항상 실행됩니다."
      }
    ],
    "nextPreview": "다음 수업: checked vs unchecked 예외",
    "sentAt": "2026-04-08T17:05:00Z",
    "readAt": null
  }
}
```

---

### PATCH /api/ai/review/[id]/read
읽음 처리.

- **권한:** 🟢 STUDENT

**Response 200**
```json
{
  "success": true,
  "data": { "readAt": "2026-04-08T19:30:00Z" }
}
```

---

## 14. AI — 이탈 예측

### GET /api/ai/churn
이탈 예측 목록 조회 (최신 날짜 기준).

- **권한:** 🔴 ADMIN, 🟡 TEACHER (담당 반만)
- **파일:** `app/api/ai/churn/route.ts`

**Query Parameters**
```
?classId=clx...
?level=DANGER           // SAFE / WARNING / DANGER
?date=2026-04-08        // 기본: 오늘
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "studentId": "clx...",
      "studentName": "김민준",
      "className": "(화-초4) 친절한 설명",
      "score": 70,
      "level": "DANGER",
      "factors": {
        "attendance": { "score": 25, "detail": "최근 2회 연속 결석" },
        "homework":   { "score": 20, "detail": "최근 3회 미제출" },
        "access":     { "score": 15, "detail": "1주 미접속" },
        "questions":  { "score": 10, "detail": "질문 빈도 급감" }
      },
      "calculatedAt": "2026-04-08"
    }
  ]
}
```

---

### POST /api/ai/churn/calculate
이탈 예측 점수 수동 재계산 (보통 자동 배치로 실행).

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "classId": "clx...",
  "date": "2026-04-08"
}
```

> 배치 구현: `app/api/ai/churn/calculate/route.ts`를 Vercel Cron으로 매일 새벽 실행

**Vercel Cron 설정 (`vercel.json`)**
```json
{
  "crons": [
    {
      "path": "/api/ai/churn/calculate",
      "schedule": "0 1 * * *"
    }
  ]
}
```

---

### POST /api/ai/churn/events
실제 이탈 등록.

- **권한:** 🔴 ADMIN

**Request Body**
```json
{
  "studentId": "clx...",
  "classId": "clx...",
  "churnedAt": "2026-04-08T00:00:00Z",
  "churnType": "MOTIVATION",
  "adminNote": "학부모 전화 통화, 학습 의욕 저하 확인"
}
```

---

### GET /api/ai/churn/[studentId]/history
학생의 이탈 예측 이력 (추이 그래프용).

- **권한:** 🔴🟡

**Query Parameters**
```
?classId=clx...
?days=30                // 최근 N일
```

**Response 200**
```json
{
  "success": true,
  "data": [
    { "date": "2026-03-10", "score": 10, "level": "SAFE" },
    { "date": "2026-03-20", "score": 35, "level": "WARNING" },
    { "date": "2026-04-01", "score": 55, "level": "WARNING" },
    { "date": "2026-04-08", "score": 70, "level": "DANGER" }
  ]
}
```

---

## 15. AI — 민원 코파일럿

### POST /api/ai/complaint
민원 상황 입력 → AI 초안 생성.

- **권한:** 🔴🟡
- **파일:** `app/api/ai/complaint/route.ts`

**Request Body**
```json
{
  "studentId": "clx...",
  "situation": "학부모가 아이 성적이 안 오른다고 환불 요청. 목소리 높임."
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "complaintId": "clx...",
    "aiDraftResponse": "안녕하세요, 어머니. 먼저 걱정을 끼쳐드려 죄송합니다. 아이의 학습 상황을 구체적으로 말씀드리겠습니다...",
    "warnings": []
  }
}
```

---

### GET /api/ai/complaint
민원 목록 조회.

- **권한:** 🔴🟡

**Query Parameters**
```
?status=OPEN
?studentId=clx...
```

---

### PATCH /api/ai/complaint/[id]
민원 처리 결과 업데이트.

- **권한:** 🔴🟡

**Request Body**
```json
{
  "finalResponse": "실제 사용한 답변 내용",
  "followUp": "다음 달 무료 수업 1회 제공 합의",
  "status": "RESOLVED"
}
```

---

## 16. 에러 코드 정의

| 코드 | HTTP | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 로그인 필요 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `VALIDATION_ERROR` | 400 | 입력값 유효성 오류. `fields` 배열 포함 |
| `EMAIL_DUPLICATE` | 409 | 이메일 중복 |
| `ALREADY_ENROLLED` | 409 | 이미 수강 중인 학생 |
| `CLASS_FULL` | 409 | 정원 초과 |
| `TEACHER_CONFLICT` | 409 | 강사 시간 충돌 |
| `ROOM_CONFLICT` | 409 | 강의실 시간 충돌 |
| `FILE_TOO_LARGE` | 400 | 파일 크기 초과 |
| `AI_ERROR` | 500 | AI API 오류 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

**VALIDATION_ERROR 응답 예시**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력값을 확인해주세요.",
    "fields": [
      { "field": "email", "message": "올바른 이메일 형식이 아닙니다." },
      { "field": "dueDate", "message": "마감일은 현재 시간 이후여야 합니다." }
    ]
  }
}
```
