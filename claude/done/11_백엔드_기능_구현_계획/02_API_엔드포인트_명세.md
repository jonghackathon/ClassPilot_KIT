# API 엔드포인트 명세

**프레임워크:** Next.js 16 App Router (Route Handlers)
**ORM:** Prisma
**인증:** NextAuth v5 (`auth()` 서버 함수)
**역할:** `ADMIN` / `TEACHER` / `STUDENT`
**총 엔드포인트:** ~50개

---

## 0. 현재 프로젝트 기준 메모

- Route Handler 인증 확인은 `src/lib/auth.ts`의 `auth()`를 기준으로 정리한다.
- Prisma client import 경로는 `@/lib/db`를 사용한다.
- 학생 본인 범위 조회는 별도 `studentId` 세션 필드가 아니라 `session.user.id`를 사용한다.
- 현재 프로젝트에 없는 `admin/settings`, `teacher/students`, `/unauthorized` 라우트는 1차 구현 범위에서 제외한다.

---

## 공통 규칙

### 응답 포맷

```typescript
// 성공
{
  success: true,
  data: T
}

// 실패
{
  success: false,
  error: {
    code: string,   // "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | "INTERNAL"
    message: string  // 사용자에게 표시 가능한 한국어 메시지
  }
}

// 페이지네이션 포함 목록
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

### 인증/권한 패턴

```typescript
// 모든 Route Handler 최상단
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
    { status: 401 }
  );

  // 역할 체크
  if (session.user.role !== "ADMIN") return NextResponse.json(
    { success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
    { status: 403 }
  );
}
```

### 권한 규칙 요약

| 역할 | 접근 범위 |
|------|----------|
| ADMIN | 모든 데이터 (같은 academyId 범위) |
| TEACHER | 본인이 담당하는 반(ClassTeacher)과 해당 반의 학생 데이터 |
| STUDENT | 본인 데이터만 (session.user.id 기준) |

### 파일 구조 규칙

```
src/app/api/
├── auth/
│   ├── register/route.ts
│   ├── me/route.ts
│   └── password/route.ts
├── users/
│   ├── route.ts              // GET list
│   └── [id]/
│       ├── route.ts          // GET detail, PATCH update
│       └── parents/route.ts  // POST add parent
├── classes/
│   ├── route.ts              // GET list, POST create
│   └── [id]/
│       ├── route.ts          // GET detail, PATCH update
│       └── enroll/route.ts   // POST enroll/unenroll
...
```

---

## 1. Auth (인증)

### 1-1. POST `/api/auth/register`

| 항목 | 내용 |
|------|------|
| **설명** | 신규 사용자 등록 (학생/강사/관리자) |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/students` 학생 등록 모달, `admin/teachers` 강사 등록 |

**Request Body:**

```typescript
{
  email: string;              // 필수, 이메일 형식
  password: string;           // 필수, 최소 8자
  name: string;               // 필수
  role: "ADMIN" | "TEACHER" | "STUDENT";
  phone?: string;             // 선택
  // role === "STUDENT"인 경우 추가 필드
  studentProfile?: {
    grade?: string;           // "중1", "고2" 등
    school?: string;
    birthDate?: string;       // ISO date
    memo?: string;
  };
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    phone: string | null;
    createdAt: string;        // ISO datetime
  }
}
```

**에러 케이스:**
- `400 VALIDATION` — 필수 필드 누락 또는 이메일 형식 오류
- `409 CONFLICT` — 이미 존재하는 이메일

---

### 1-2. GET `/api/auth/me`

| 항목 | 내용 |
|------|------|
| **설명** | 현재 로그인된 사용자 정보 조회 |
| **권한** | 로그인 필수 (역할 무관) |
| **사용 화면** | 전역 레이아웃 (헤더, 사이드바), 로그인 후 리다이렉트 |

**Query Params:** 없음

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    phone: string | null;
    academyId: string;
    academy: {
      id: string;
      name: string;
    };
    // STUDENT인 경우
    studentProfile?: {
      grade: string | null;
      school: string | null;
      birthDate: string | null;
    };
    // TEACHER인 경우
    classTeachers?: {
      classId: string;
      className: string;
    }[];
  }
}
```

---

### 1-3. PATCH `/api/auth/password`

| 항목 | 내용 |
|------|------|
| **설명** | 비밀번호 변경 |
| **권한** | 로그인 필수 (역할 무관) |
| **사용 화면** | 설정 페이지, 프로필 모달 |

**Request Body:**

```typescript
{
  currentPassword: string;    // 현재 비밀번호
  newPassword: string;        // 새 비밀번호, 최소 8자
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    message: "비밀번호가 변경되었습니다."
  }
}
```

**에러 케이스:**
- `400 VALIDATION` — 새 비밀번호 길이 부족
- `401 UNAUTHORIZED` — 현재 비밀번호 불일치

---

## 2. Users (사용자)

### 2-1. GET `/api/users`

| 항목 | 내용 |
|------|------|
| **설명** | 사용자 목록 조회 (필터/검색/페이지네이션) |
| **권한** | `ADMIN` — 전체 조회, `TEACHER` — 담당 반 학생만 |
| **사용 화면** | `admin/students`, `admin/teachers` |

**Query Params:**

```typescript
{
  role?: "ADMIN" | "TEACHER" | "STUDENT";  // 역할 필터
  classId?: string;                         // 특정 반 소속 학생만
  search?: string;                          // 이름 또는 이메일 검색 (LIKE)
  status?: "ACTIVE" | "INACTIVE";           // 활성 상태 필터
  page?: number;                            // 기본값 1
  limit?: number;                           // 기본값 20, 최대 100
  sort?: string;                            // "name" | "createdAt", 기본값 "name"
  order?: "asc" | "desc";                   // 기본값 "asc"
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "TEACHER" | "STUDENT";
      phone: string | null;
      status: "ACTIVE" | "INACTIVE";
      createdAt: string;
      // role === "STUDENT"인 경우 포함
      studentProfile?: {
        grade: string | null;
        school: string | null;
      };
      // 소속 반 요약 (STUDENT: 수강 중인 반, TEACHER: 담당 반)
      classes: {
        id: string;
        name: string;
      }[];
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 2-2. GET `/api/users/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 사용자 상세 조회 (프로필, 학부모, 수강 이력 포함) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 학생, `STUDENT` — 본인만 |
| **사용 화면** | `admin/students/[id]`, `teacher/students/[id]` |

**Path Params:** `id` — User ID

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    email: string;
    name: string;
    role: "ADMIN" | "TEACHER" | "STUDENT";
    phone: string | null;
    status: "ACTIVE" | "INACTIVE";
    createdAt: string;
    updatedAt: string;
    // STUDENT 전용
    studentProfile: {
      grade: string | null;
      school: string | null;
      birthDate: string | null;
      memo: string | null;
    } | null;
    parentContacts: {
      id: string;
      name: string;
      phone: string;          // 복호화된 값
      relation: string;       // "어머니", "아버지" 등
    }[];
    enrollments: {
      id: string;
      classId: string;
      className: string;
      subject: string;
      enrolledAt: string;
      status: "ACTIVE" | "COMPLETED" | "DROPPED";
    }[];
    // 최근 출결 요약
    recentAttendance: {
      present: number;
      absent: number;
      late: number;
      total: number;
    };
    // 최근 상담
    recentConsultations: {
      id: string;
      date: string;
      summary: string;
    }[];
  }
}
```

---

### 2-3. PATCH `/api/users/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 사용자 정보 수정 |
| **권한** | `ADMIN` — 전체 수정, `TEACHER`/`STUDENT` — 본인 제한 필드만 |
| **사용 화면** | `admin/students/[id]` 편집 모달, 프로필 설정 |

**Path Params:** `id` — User ID

**Request Body (전부 optional):**

```typescript
{
  name?: string;
  phone?: string;
  status?: "ACTIVE" | "INACTIVE";        // ADMIN만
  // STUDENT 전용 (studentProfile 업데이트)
  studentProfile?: {
    grade?: string;
    school?: string;
    birthDate?: string;
    memo?: string;
  };
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    phone: string | null;
    status: "ACTIVE" | "INACTIVE";
    updatedAt: string;
    studentProfile: { ... } | null;
  }
}
```

---

### 2-4. POST `/api/users/[id]/parents`

| 항목 | 내용 |
|------|------|
| **설명** | 학부모 연락처 추가 |
| **권한** | `ADMIN`, `TEACHER` (담당 학생만) |
| **사용 화면** | `admin/students/[id]` 학부모 추가 모달 |

**Path Params:** `id` — Student User ID

**Request Body:**

```typescript
{
  name: string;               // 학부모 이름
  phone: string;              // 전화번호 (서버에서 암호화 저장)
  relation: string;           // "어머니" | "아버지" | "기타"
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    phone: string;
    relation: string;
    studentId: string;
    createdAt: string;
  }
}
```

---

## 3. Classes (반)

### 3-1. GET `/api/classes`

| 항목 | 내용 |
|------|------|
| **설명** | 반 목록 조회 (필터) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반만, `STUDENT` — 수강 반만 |
| **사용 화면** | `admin/classes`, `teacher/dashboard`, 각종 드롭다운 필터 |

**Query Params:**

```typescript
{
  subject?: string;             // 과목 필터 ("수학", "영어" 등)
  teacherId?: string;           // 담당 강사 필터
  status?: "ACTIVE" | "INACTIVE";
  search?: string;              // 반 이름 검색
  page?: number;                // 기본값 1
  limit?: number;               // 기본값 20
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      name: string;
      subject: string;
      description: string | null;
      status: "ACTIVE" | "INACTIVE";
      maxStudents: number;
      // 담당 강사
      teachers: {
        id: string;
        name: string;
      }[];
      // 수강생 수
      studentCount: number;
      // 시간표 요약
      schedules: {
        dayOfWeek: number;     // 0(일) ~ 6(토)
        startTime: string;     // "14:00"
        endTime: string;       // "16:00"
      }[];
      createdAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 3-2. POST `/api/classes`

| 항목 | 내용 |
|------|------|
| **설명** | 새 반 생성 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/classes` 반 생성 모달 |

**Request Body:**

```typescript
{
  name: string;                 // 반 이름
  subject: string;              // 과목
  description?: string;
  maxStudents?: number;         // 기본값 30
  teacherIds: string[];         // 담당 강사 ID 배열
  schedules?: {
    dayOfWeek: number;          // 0~6
    startTime: string;          // "14:00"
    endTime: string;            // "16:00"
    room?: string;              // 강의실
  }[];
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subject: string;
    description: string | null;
    maxStudents: number;
    status: "ACTIVE";
    teachers: { id: string; name: string; }[];
    schedules: { dayOfWeek: number; startTime: string; endTime: string; room: string | null; }[];
    createdAt: string;
  }
}
```

---

### 3-3. GET `/api/classes/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 반 상세 조회 (학생 목록, 시간표, 진도 포함) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반만 |
| **사용 화면** | `admin/classes/[id]`, `teacher/classes/[id]` |

**Path Params:** `id` — Class ID

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subject: string;
    description: string | null;
    maxStudents: number;
    status: "ACTIVE" | "INACTIVE";
    teachers: {
      id: string;
      name: string;
      email: string;
    }[];
    students: {
      id: string;
      userId: string;
      name: string;
      grade: string | null;
      enrolledAt: string;
      enrollmentStatus: "ACTIVE" | "COMPLETED" | "DROPPED";
    }[];
    schedules: {
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room: string | null;
      studentIds: string[];    // 해당 시간표에 배정된 학생 ID
    }[];
    // 커리큘럼 진도
    curriculum: {
      id: string;
      name: string;
      totalLessons: number;
      completedLessons: number;
      progressPercent: number;
    } | null;
    // 최근 수업 기록
    recentLessons: {
      id: string;
      date: string;
      topic: string | null;
      attendanceCount: number;
    }[];
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 3-4. PATCH `/api/classes/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 반 정보 수정 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/classes/[id]` 편집 모달 |

**Path Params:** `id` — Class ID

**Request Body (전부 optional):**

```typescript
{
  name?: string;
  subject?: string;
  description?: string;
  maxStudents?: number;
  status?: "ACTIVE" | "INACTIVE";
  teacherIds?: string[];       // 전체 교체 (기존 제거 → 새로 연결)
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subject: string;
    status: "ACTIVE" | "INACTIVE";
    teachers: { id: string; name: string; }[];
    updatedAt: string;
  }
}
```

---

### 3-5. POST `/api/classes/[id]/enroll`

| 항목 | 내용 |
|------|------|
| **설명** | 학생 수강 등록 또는 수강 취소 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/classes/[id]` 학생 등록/해제 모달 |

**Path Params:** `id` — Class ID

**Request Body:**

```typescript
{
  studentId: string;            // Student User ID
  action: "ENROLL" | "UNENROLL";
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    enrollmentId: string;
    classId: string;
    studentId: string;
    status: "ACTIVE" | "DROPPED";
    updatedAt: string;
  }
}
```

**에러 케이스:**
- `400 VALIDATION` — 이미 수강 중 (ENROLL 시) / 수강 중이 아님 (UNENROLL 시)
- `400 VALIDATION` — 정원 초과 (maxStudents 체크)

---

## 4. Schedules (시간표)

### 4-1. GET `/api/schedules`

| 항목 | 내용 |
|------|------|
| **설명** | 주간 시간표 조회 |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반만, `STUDENT` — 수강 반만 |
| **사용 화면** | `admin/schedule`, `teacher/dashboard` 주간 캘린더, `student/dashboard` |

**Query Params:**

```typescript
{
  weekStart: string;           // ISO date, 해당 주의 월요일 날짜
  classId?: string;            // 특정 반 필터
  teacherId?: string;          // 특정 강사 필터
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    weekStart: string;
    weekEnd: string;
    schedules: {
      id: string;
      classId: string;
      className: string;
      subject: string;
      dayOfWeek: number;       // 0~6
      startTime: string;       // "14:00"
      endTime: string;         // "16:00"
      room: string | null;
      teacher: {
        id: string;
        name: string;
      };
      // 해당 시간표에 배정된 학생 목록
      students: {
        id: string;
        name: string;
        grade: string | null;
      }[];
      studentCount: number;
    }[]
  }
}
```

---

### 4-2. POST `/api/schedules`

| 항목 | 내용 |
|------|------|
| **설명** | 시간표 항목 생성 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/schedule` 시간표 추가 모달 |

**Request Body:**

```typescript
{
  classId: string;
  dayOfWeek: number;            // 0~6
  startTime: string;            // "14:00"
  endTime: string;              // "16:00"
  room?: string;
  studentIds?: string[];        // 이 시간표에 배정할 학생 ID 목록
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
    students: { id: string; name: string; }[];
    createdAt: string;
  }
}
```

---

### 4-3. PATCH `/api/schedules/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 시간표 수정 (학생 배정 변경 포함) |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/schedule` 시간표 편집 모달 |

**Path Params:** `id` — Schedule ID

**Request Body (전부 optional):**

```typescript
{
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  room?: string;
  studentIds?: string[];       // 전체 교체 — 기존 배정 제거 후 새로 배정
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    classId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
    students: { id: string; name: string; }[];
    updatedAt: string;
  }
}
```

---

## 5. Lessons (수업)

### 5-1. GET `/api/lessons`

| 항목 | 내용 |
|------|------|
| **설명** | 수업 인스턴스 목록 조회 (날짜별/강사별) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 본인 수업만 |
| **사용 화면** | `teacher/dashboard`, `teacher/progress` |

**Query Params:**

```typescript
{
  date?: string;               // ISO date, 특정 날짜 수업
  startDate?: string;          // 범위 시작
  endDate?: string;            // 범위 끝
  teacherId?: string;          // 강사 필터
  classId?: string;            // 반 필터
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      scheduleId: string;
      classId: string;
      className: string;
      subject: string;
      date: string;            // ISO date
      startTime: string;
      endTime: string;
      teacher: {
        id: string;
        name: string;
      };
      // 수업 상태
      status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
      topic: string | null;
      // 출결 요약
      attendanceSummary: {
        total: number;
        present: number;
        absent: number;
        late: number;
      };
      // 진도 기록 여부
      hasWeekNote: boolean;
    }[]
  }
}
```

---

### 5-2. POST `/api/lessons/[id]/progress`

| 항목 | 내용 |
|------|------|
| **설명** | 수업 진도 기록 (수업 완료 처리) |
| **권한** | `TEACHER` (담당 수업만), `ADMIN` |
| **사용 화면** | `teacher/dashboard` 수업 완료 버튼, `teacher/progress` |

**Path Params:** `id` — Lesson ID

**Request Body:**

```typescript
{
  topic: string;               // 수업 주제
  content?: string;            // 수업 내용 메모
  status: "COMPLETED" | "CANCELLED";
  // 커리큘럼 진도 연동
  curriculumLessonIndex?: number; // 커리큘럼 내 완료된 수업 번호
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    status: "COMPLETED" | "CANCELLED";
    topic: string;
    content: string | null;
    completedAt: string;
    // 커리큘럼 진도 업데이트 결과
    curriculumProgress?: {
      totalLessons: number;
      completedLessons: number;
      progressPercent: number;
    };
  }
}
```

---

## 6. Attendance (출결)

### 6-1. GET `/api/attendance`

| 항목 | 내용 |
|------|------|
| **설명** | 출결 기록 조회 (날짜 + 반 기준, 숙제/사유 포함) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반, `STUDENT` — 본인만 |
| **사용 화면** | `teacher/attendance`, `admin/students/[id]` 출결 탭 |

**Query Params:**

```typescript
{
  date: string;                 // ISO date, 필수
  classId?: string;             // 반 필터
  studentId?: string;           // 학생 필터
  scheduleId?: string;          // 특정 시간표 기준
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    date: string;
    records: {
      id: string;
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
      // 숙제 관련
      homeworkStatus: "DONE" | "PARTIAL" | "NOT_DONE" | null;
      homeworkNote: string | null;
      // 결석/지각 사유
      reason: string | null;
      // 시간
      checkInTime: string | null;  // 실제 출석 시간
      createdAt: string;
      updatedAt: string;
    }[]
  }
}
```

---

### 6-2. POST `/api/attendance`

| 항목 | 내용 |
|------|------|
| **설명** | 출결 기록 생성/수정 (upsert: date + studentId + classId 기준) |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/attendance` 개별 출결 체크 |

**Request Body:**

```typescript
{
  studentId: string;
  classId: string;
  date: string;                 // ISO date
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  homeworkStatus?: "DONE" | "PARTIAL" | "NOT_DONE";
  homeworkNote?: string;
  reason?: string;              // 결석/지각 사유
  checkInTime?: string;         // HH:mm 형식
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    studentId: string;
    classId: string;
    date: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    homeworkStatus: string | null;
    homeworkNote: string | null;
    reason: string | null;
    checkInTime: string | null;
    isNew: boolean;              // 신규 생성이면 true, 업데이트면 false
    updatedAt: string;
  }
}
```

---

### 6-3. POST `/api/attendance/bulk`

| 항목 | 내용 |
|------|------|
| **설명** | 반 전체 일괄 출석 처리 |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/attendance` "전원 출석" 버튼 |

**Request Body:**

```typescript
{
  classId: string;
  date: string;                 // ISO date
  scheduleId?: string;          // 특정 시간표 기준
  status: "PRESENT";            // 일괄 처리는 PRESENT만 허용
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    classId: string;
    date: string;
    createdCount: number;       // 새로 생성된 출결 수
    skippedCount: number;       // 이미 기록 존재하여 건너뛴 수
    totalStudents: number;
  }
}
```

---

### 6-4. PATCH `/api/attendance/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 개별 출결 기록 수정 (상태/숙제/사유) |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/attendance` 개별 행 편집 |

**Path Params:** `id` — Attendance ID

**Request Body (전부 optional):**

```typescript
{
  status?: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  homeworkStatus?: "DONE" | "PARTIAL" | "NOT_DONE";
  homeworkNote?: string;
  reason?: string;
  checkInTime?: string;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
    homeworkStatus: string | null;
    homeworkNote: string | null;
    reason: string | null;
    updatedAt: string;
  }
}
```

---

### 6-5. GET `/api/attendance/stats`

| 항목 | 내용 |
|------|------|
| **설명** | 출결 통계 조회 (학생별 또는 반별, 월 단위) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반, `STUDENT` — 본인만 |
| **사용 화면** | `admin/students/[id]` 출결 차트, `teacher/reports` 통계 |

**Query Params:**

```typescript
{
  month: string;               // "2026-04" 형식, 필수
  studentId?: string;          // 학생별 통계
  classId?: string;            // 반별 통계
  groupBy?: "student" | "class" | "day";  // 기본값 "student"
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    month: string;
    stats: {
      // groupBy === "student"
      studentId?: string;
      studentName?: string;
      // groupBy === "class"
      classId?: string;
      className?: string;
      // 공통 통계
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      attendanceRate: number;  // 퍼센트 (0~100)
      // 숙제 통계
      homeworkDone: number;
      homeworkPartial: number;
      homeworkNotDone: number;
      homeworkRate: number;    // 퍼센트
    }[];
    // 전체 요약
    summary: {
      totalStudents: number;
      averageAttendanceRate: number;
      averageHomeworkRate: number;
    };
  }
}
```

---

## 7. Assignments (과제)

### 7-1. GET `/api/assignments`

| 항목 | 내용 |
|------|------|
| **설명** | 과제 목록 조회 (필터/검색) |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 반, `STUDENT` — 본인 배정만 |
| **사용 화면** | `teacher/assignments`, `student/assignments` |

**Query Params:**

```typescript
{
  classId?: string;
  teacherId?: string;
  studentId?: string;
  type?: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";  // 과제 유형 필터
  status?: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
  dueFrom?: string;            // 마감일 범위 시작
  dueTo?: string;              // 마감일 범위 끝
  search?: string;             // 제목 검색
  page?: number;
  limit?: number;
  sort?: "dueDate" | "createdAt" | "title";
  order?: "asc" | "desc";
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      title: string;
      description: string | null;
      type: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";
      classId: string;
      className: string;
      // 출제자
      teacher: {
        id: string;
        name: string;
      };
      // 배정된 학생
      student: {
        id: string;
        name: string;
      };
      dueDate: string | null;
      status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
      // 제출 요약
      submission: {
        submittedAt: string | null;
        score: number | null;
        hasFeedback: boolean;
      } | null;
      createdAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 7-2. POST `/api/assignments`

| 항목 | 내용 |
|------|------|
| **설명** | 단일 과제 생성 (특정 학생에게 배정) |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/assignments` 과제 생성 모달 |

**Request Body:**

```typescript
{
  title: string;
  description?: string;
  type: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";
  classId: string;
  studentId: string;            // 배정할 학생
  dueDate?: string;             // ISO datetime
  // 과제 내용 (유형별)
  content?: {
    instructions?: string;      // 지시사항
    pages?: string;             // 교재 페이지 ("p.32~35")
    attachmentUrls?: string[];  // 첨부파일 URL
  };
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    classId: string;
    studentId: string;
    dueDate: string | null;
    content: { ... } | null;
    status: "PENDING";
    createdAt: string;
  }
}
```

---

### 7-3. POST `/api/assignments/batch`

| 항목 | 내용 |
|------|------|
| **설명** | 다수 학생에게 일괄 과제 생성 |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/assignments` 일괄 배정 모달, `teacher/progress` 수업 후 자동 배정 |

**Request Body:**

```typescript
{
  title: string;
  description?: string;
  type: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";
  classId: string;
  studentIds: string[];         // 복수 학생
  dueDate?: string;
  content?: {
    instructions?: string;
    pages?: string;
    attachmentUrls?: string[];
  };
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    createdCount: number;
    assignments: {
      id: string;
      studentId: string;
      studentName: string;
      status: "PENDING";
    }[];
  }
}
```

---

### 7-4. GET `/api/assignments/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 과제 상세 조회 (제출 이력, 피드백 포함) |
| **권한** | `TEACHER` (담당 반), `ADMIN`, `STUDENT` (본인 과제만) |
| **사용 화면** | `teacher/assignments/[id]`, `student/assignments/[id]` |

**Path Params:** `id` — Assignment ID

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    description: string | null;
    type: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";
    classId: string;
    className: string;
    teacher: { id: string; name: string; };
    student: { id: string; name: string; };
    dueDate: string | null;
    status: "PENDING" | "IN_PROGRESS" | "SUBMITTED" | "GRADED";
    content: {
      instructions: string | null;
      pages: string | null;
      attachmentUrls: string[];
    } | null;
    // 최신 제출
    submission: {
      id: string;
      content: string;          // 제출 내용 (텍스트/마크다운)
      imageUrls: string[];      // 첨부 이미지
      submittedAt: string;
      score: number | null;     // 0~100
      // 피드백
      feedback: {
        teacherComment: string | null;
        aiComment: string | null;
        rubric: {
          category: string;
          score: number;
          maxScore: number;
          comment: string;
        }[] | null;
        createdAt: string;
      } | null;
    } | null;
    // 자동 저장 이력
    submissionHistory: {
      id: string;
      content: string;
      savedAt: string;
      wordCount: number;
    }[];
    createdAt: string;
    updatedAt: string;
  }
}
```

---

### 7-5. POST `/api/assignments/[id]/submit`

| 항목 | 내용 |
|------|------|
| **설명** | 과제 제출 (자동 저장 이력도 함께 저장) |
| **권한** | `STUDENT` (본인 과제만) |
| **사용 화면** | `student/assignments/[id]` 제출 버튼 |

**Path Params:** `id` — Assignment ID

**Request Body:**

```typescript
{
  content: string;              // 제출 내용 (마크다운/텍스트)
  imageUrls?: string[];         // 첨부 이미지 URL
  isDraft: boolean;             // true면 자동저장 (SubmissionHistory만), false면 최종 제출
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    // isDraft === true
    historyId?: string;
    savedAt?: string;
    wordCount?: number;

    // isDraft === false
    submissionId?: string;
    submittedAt?: string;
    assignmentStatus?: "SUBMITTED";
  }
}
```

---

### 7-6. POST `/api/assignments/[id]/feedback`

| 항목 | 내용 |
|------|------|
| **설명** | 과제 피드백 저장 (강사 직접 또는 AI 생성) |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/assignments/[id]` 피드백 패널 |

**Path Params:** `id` — Assignment ID

**Request Body:**

```typescript
{
  teacherComment?: string;      // 강사 코멘트
  aiComment?: string;           // AI 생성 코멘트
  score?: number;               // 0~100
  rubric?: {
    category: string;           // "논리성", "표현력", "정확성" 등
    score: number;
    maxScore: number;
    comment: string;
  }[];
  status: "GRADED";             // 채점 완료로 상태 변경
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    assignmentId: string;
    feedbackId: string;
    score: number | null;
    status: "GRADED";
    teacherComment: string | null;
    aiComment: string | null;
    rubric: { ... }[] | null;
    updatedAt: string;
  }
}
```

---

## 8. Curriculum (커리큘럼)

### 8-1. GET `/api/curriculum`

| 항목 | 내용 |
|------|------|
| **설명** | 커리큘럼 목록 조회 |
| **권한** | `ADMIN`, `TEACHER` (담당 반 커리큘럼만) |
| **사용 화면** | `admin/curriculum`, `teacher/progress` 커리큘럼 선택 |

**Query Params:**

```typescript
{
  classId?: string;
  subject?: string;
  search?: string;             // 이름 검색
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      name: string;
      subject: string;
      classId: string | null;
      className: string | null;
      description: string | null;
      // 단계 구조
      stages: {
        name: string;           // "1단원: 함수의 극한"
        lessons: {
          index: number;
          title: string;
          completed: boolean;
          completedAt: string | null;
        }[];
      }[];
      totalLessons: number;
      completedLessons: number;
      progressPercent: number;
      createdAt: string;
      updatedAt: string;
    }[]
  }
}
```

---

### 8-2. POST `/api/curriculum`

| 항목 | 내용 |
|------|------|
| **설명** | 커리큘럼 생성 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/curriculum` 커리큘럼 생성 모달 |

**Request Body:**

```typescript
{
  name: string;
  subject: string;
  classId?: string;             // 특정 반에 연결 (선택)
  description?: string;
  stages: {
    name: string;               // 단계 이름
    lessons: {
      title: string;            // 수업 주제
    }[];
  }[];
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    subject: string;
    classId: string | null;
    stages: { ... }[];
    totalLessons: number;
    createdAt: string;
  }
}
```

---

### 8-3. PATCH `/api/curriculum/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 커리큘럼 수정 (단계/수업 JSON 전체 교체) |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/curriculum` 편집 모달 |

**Path Params:** `id` — CurriculumClass ID

**Request Body (전부 optional):**

```typescript
{
  name?: string;
  subject?: string;
  description?: string;
  classId?: string | null;
  stages?: {
    name: string;
    lessons: {
      title: string;
      completed?: boolean;
      completedAt?: string | null;
    }[];
  }[];
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    name: string;
    stages: { ... }[];
    totalLessons: number;
    completedLessons: number;
    progressPercent: number;
    updatedAt: string;
  }
}
```

---

### 8-4. DELETE `/api/curriculum/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 커리큘럼 삭제 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/curriculum` 삭제 버튼 |

**Path Params:** `id` — CurriculumClass ID

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    deleted: true;
  }
}
```

---

## 9. WeekNotes (수업 기록)

### 9-1. GET `/api/week-notes`

| 항목 | 내용 |
|------|------|
| **설명** | 수업 기록 조회 (시간표 + 날짜 범위 기준) |
| **권한** | `ADMIN`, `TEACHER` (담당 반) |
| **사용 화면** | `teacher/progress`, `teacher/reports` |

**Query Params:**

```typescript
{
  scheduleId?: string;
  classId?: string;
  startDate: string;            // ISO date
  endDate: string;              // ISO date
  teacherId?: string;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      scheduleId: string;
      classId: string;
      className: string;
      lessonId: string | null;
      date: string;
      // 수업 기록 내용
      topic: string;             // 수업 주제
      content: string;           // 수업 내용 (마크다운)
      homework: string | null;   // 배정한 숙제 설명
      memo: string | null;       // 강사 메모
      // 연동 정보
      attendanceCount: number;
      assignmentCount: number;
      teacher: { id: string; name: string; };
      createdAt: string;
      updatedAt: string;
    }[]
  }
}
```

---

### 9-2. POST `/api/week-notes`

| 항목 | 내용 |
|------|------|
| **설명** | 수업 기록 저장 (autoAssign=true 시 과제 일괄 생성 연동) |
| **권한** | `TEACHER` (담당 반), `ADMIN` |
| **사용 화면** | `teacher/progress` 수업 기록 작성 폼 |

**Request Body:**

```typescript
{
  scheduleId: string;
  classId: string;
  lessonId?: string;            // 수업 인스턴스 연결 (선택)
  date: string;                 // ISO date
  topic: string;
  content: string;
  homework?: string;            // 숙제 설명
  memo?: string;
  // 과제 자동 배정
  autoAssign: boolean;          // true면 아래 설정으로 과제 일괄 생성
  assignmentConfig?: {
    title: string;
    type: "HOMEWORK" | "ESSAY" | "WORKBOOK" | "REVIEW";
    dueDate?: string;
    studentIds?: string[];      // 비어있으면 반 전체 학생
    content?: {
      instructions?: string;
      pages?: string;
    };
  };
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    weekNote: {
      id: string;
      scheduleId: string;
      date: string;
      topic: string;
      content: string;
      homework: string | null;
      createdAt: string;
    };
    // autoAssign === true인 경우
    assignments?: {
      createdCount: number;
      assignments: {
        id: string;
        studentId: string;
        studentName: string;
      }[];
    };
  }
}
```

---

## 10. Payments (수강료)

### 10-1. GET `/api/payments`

| 항목 | 내용 |
|------|------|
| **설명** | 수강료 결제 내역 조회 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/payments` |

**Query Params:**

```typescript
{
  month?: string;               // "2026-04" 형식
  status?: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE";
  studentId?: string;
  classId?: string;
  search?: string;              // 학생 이름 검색
  page?: number;
  limit?: number;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      month: string;            // "2026-04"
      amount: number;           // 금액 (원)
      paidAmount: number;       // 납입액
      status: "PAID" | "UNPAID" | "PARTIAL" | "OVERDUE";
      paidAt: string | null;    // 결제 일시
      method: string | null;    // "카드" | "계좌이체" | "현금"
      memo: string | null;
      createdAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    // 월별 요약
    summary: {
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
      paidCount: number;
      unpaidCount: number;
      collectionRate: number;   // 수납률 퍼센트
    }
  }
}
```

---

### 10-2. POST `/api/payments`

| 항목 | 내용 |
|------|------|
| **설명** | 수강료 결제 기록 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/payments` 결제 등록 모달 |

**Request Body:**

```typescript
{
  studentId: string;
  classId: string;
  month: string;                // "2026-04"
  amount: number;               // 총 금액
  paidAmount: number;           // 납입액
  method?: string;              // "카드" | "계좌이체" | "현금"
  paidAt?: string;              // ISO datetime, 기본값 now()
  memo?: string;
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    studentId: string;
    classId: string;
    month: string;
    amount: number;
    paidAmount: number;
    status: "PAID" | "PARTIAL" | "UNPAID";  // 서버에서 자동 계산
    method: string | null;
    paidAt: string | null;
    createdAt: string;
  }
}
```

---

## 11. Consultations (상담)

### 11-1. GET `/api/consultations`

| 항목 | 내용 |
|------|------|
| **설명** | 상담 기록 목록 조회 |
| **권한** | `ADMIN` — 전체, `TEACHER` — 담당 학생 |
| **사용 화면** | `admin/students/[id]` 상담 탭, `teacher/students/[id]` |

**Query Params:**

```typescript
{
  studentId: string;            // 필수
  type?: "PHONE" | "VISIT" | "ONLINE" | "OTHER";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      studentId: string;
      studentName: string;
      // 상담 정보
      date: string;
      type: "PHONE" | "VISIT" | "ONLINE" | "OTHER";
      participants: string;     // "어머니", "본인" 등
      summary: string;          // 상담 내용 요약
      result: string | null;    // 상담 결과/조치사항
      nextAction: string | null; // 후속 조치
      // 작성자
      createdBy: {
        id: string;
        name: string;
        role: string;
      };
      createdAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 11-2. POST `/api/consultations`

| 항목 | 내용 |
|------|------|
| **설명** | 상담 기록 생성 |
| **권한** | `ADMIN`, `TEACHER` (담당 학생) |
| **사용 화면** | `admin/students/[id]` 상담 기록 추가 모달 |

**Request Body:**

```typescript
{
  studentId: string;
  date: string;                 // ISO date
  type: "PHONE" | "VISIT" | "ONLINE" | "OTHER";
  participants: string;
  summary: string;
  result?: string;
  nextAction?: string;
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    studentId: string;
    date: string;
    type: string;
    participants: string;
    summary: string;
    result: string | null;
    nextAction: string | null;
    createdBy: { id: string; name: string; };
    createdAt: string;
  }
}
```

---

## 12. Memos (메모)

### 12-1. GET `/api/memos`

| 항목 | 내용 |
|------|------|
| **설명** | 메모 목록 조회 (카테고리/보관/검색) |
| **권한** | 로그인 필수 — 본인 작성 메모만 |
| **사용 화면** | `teacher/memo` |

**Query Params:**

```typescript
{
  category?: string;            // "수업", "학생", "행정", "기타"
  archived?: boolean;           // true면 보관된 메모만
  search?: string;              // 제목+내용 검색
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt" | "title";
  order?: "asc" | "desc";
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      title: string;
      content: string;
      category: string | null;
      color: string | null;      // "#FFE0B2" 등 메모 색상
      pinned: boolean;
      archived: boolean;
      createdAt: string;
      updatedAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 12-2. POST `/api/memos`

| 항목 | 내용 |
|------|------|
| **설명** | 메모 생성 |
| **권한** | 로그인 필수 |
| **사용 화면** | `teacher/memo` 메모 작성 모달 |

**Request Body:**

```typescript
{
  title: string;
  content: string;
  category?: string;
  color?: string;
  pinned?: boolean;             // 기본값 false
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    content: string;
    category: string | null;
    color: string | null;
    pinned: boolean;
    archived: false;
    createdAt: string;
  }
}
```

---

### 12-3. PATCH `/api/memos/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 메모 수정/보관/삭제 (soft delete = archived) |
| **권한** | 본인 메모만 |
| **사용 화면** | `teacher/memo` 메모 편집, 보관 토글, 삭제 |

**Path Params:** `id` — Memo ID

**Request Body (전부 optional):**

```typescript
{
  title?: string;
  content?: string;
  category?: string;
  color?: string;
  pinned?: boolean;
  archived?: boolean;           // true면 보관, false면 복원
  deleted?: boolean;            // true면 영구 삭제
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    title: string;
    pinned: boolean;
    archived: boolean;
    updatedAt: string;
    // deleted === true인 경우
    deleted?: true;
  }
}
```

---

## 13. Reports (월간 보고서)

### 13-1. GET `/api/reports`

| 항목 | 내용 |
|------|------|
| **설명** | 학생별 월간 보고서 데이터 조회 |
| **권한** | `ADMIN`, `TEACHER` (담당 학생), `STUDENT` (본인만) |
| **사용 화면** | `teacher/reports`, `student/reports` |

**Query Params:**

```typescript
{
  studentId: string;            // 필수
  month: string;                // "2026-04" 필수
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    studentId: string;
    studentName: string;
    month: string;
    // 출결 통계
    attendance: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      attendanceRate: number;
    };
    // 숙제 통계
    homework: {
      total: number;
      done: number;
      partial: number;
      notDone: number;
      completionRate: number;
    };
    // 과제 통계
    assignments: {
      total: number;
      submitted: number;
      graded: number;
      averageScore: number | null;
    };
    // 수업별 진도
    classProgress: {
      classId: string;
      className: string;
      subject: string;
      lessonsCompleted: number;
      totalLessons: number;
      progressPercent: number;
    }[];
    // 강사 코멘트
    comment: string | null;
    // AI 생성 성장 보고서
    aiGrowthReport: string | null;
    // 보고서 메타
    reportId: string | null;     // null이면 아직 저장 안 됨
    updatedAt: string | null;
  }
}
```

---

### 13-2. POST `/api/reports/[studentId]`

| 항목 | 내용 |
|------|------|
| **설명** | 월간 보고서 코멘트 저장 |
| **권한** | `TEACHER` (담당 학생), `ADMIN` |
| **사용 화면** | `teacher/reports` 코멘트 작성 |

**Path Params:** `studentId` — Student User ID

**Request Body:**

```typescript
{
  month: string;                // "2026-04"
  comment: string;              // 강사 코멘트
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    reportId: string;
    studentId: string;
    month: string;
    comment: string;
    createdAt: string;
  }
}
```

---

### 13-3. PATCH `/api/reports/[studentId]`

| 항목 | 내용 |
|------|------|
| **설명** | 월간 보고서 코멘트 수정 |
| **권한** | `TEACHER` (담당 학생), `ADMIN` |
| **사용 화면** | `teacher/reports` 코멘트 편집 |

**Path Params:** `studentId` — Student User ID

**Request Body:**

```typescript
{
  month: string;                // "2026-04"
  comment?: string;
  aiGrowthReport?: string;      // AI 생성 보고서 저장
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    reportId: string;
    comment: string | null;
    aiGrowthReport: string | null;
    updatedAt: string;
  }
}
```

---

## 14. Complaints (민원)

### 14-1. GET `/api/complaints`

| 항목 | 내용 |
|------|------|
| **설명** | 민원 목록 조회 (상태 필터) |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/complaints` |

**Query Params:**

```typescript
{
  status?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  search?: string;              // 제목/내용 검색
  page?: number;
  limit?: number;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      title: string;
      content: string;
      category: string;         // "수업", "시설", "교사", "행정", "기타"
      priority: "LOW" | "MEDIUM" | "HIGH";
      status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
      // 민원인
      reporter: {
        name: string;
        phone: string | null;
        relation: string;       // "학부모", "학생"
      };
      // 관련 학생
      student: {
        id: string;
        name: string;
      } | null;
      // 대응
      response: string | null;
      respondedAt: string | null;
      respondedBy: { id: string; name: string; } | null;
      createdAt: string;
      updatedAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### 14-2. PATCH `/api/complaints/[id]`

| 항목 | 내용 |
|------|------|
| **설명** | 민원 대응/상태 업데이트 |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/complaints` 대응 작성 모달 |

**Path Params:** `id` — Complaint ID

**Request Body (전부 optional):**

```typescript
{
  status?: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "MEDIUM" | "HIGH";
  response?: string;            // 대응 내용
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    id: string;
    status: string;
    priority: string;
    response: string | null;
    respondedAt: string | null;
    respondedBy: { id: string; name: string; } | null;
    updatedAt: string;
  }
}
```

---

## 15. Churn (이탈 예측)

### 15-1. GET `/api/churn`

| 항목 | 내용 |
|------|------|
| **설명** | 이탈 예측 목록 조회 (위험도별) |
| **권한** | `ADMIN` only |
| **사용 화면** | `admin/churn` |

**Query Params:**

```typescript
{
  level?: "HIGH" | "MEDIUM" | "LOW";   // 위험도 필터
  classId?: string;
  page?: number;
  limit?: number;
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    items: {
      id: string;
      studentId: string;
      studentName: string;
      grade: string | null;
      // 이탈 예측 정보
      riskLevel: "HIGH" | "MEDIUM" | "LOW";
      riskScore: number;        // 0~100
      // 근거 지표
      factors: {
        attendanceRate: number;   // 출석률
        homeworkRate: number;     // 숙제 수행률
        scoreAverage: number | null;
        absenceStreak: number;    // 연속 결석 일수
        lastAttendance: string | null; // 마지막 출석일
        paymentStatus: string;    // 납부 상태
        consultationDays: number; // 마지막 상담 후 경과일
      };
      // 추천 조치
      recommendation: string;
      calculatedAt: string;
    }[],
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    // 요약
    summary: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
      totalActive: number;
    }
  }
}
```

---

### 15-2. POST `/api/churn/calculate`

| 항목 | 내용 |
|------|------|
| **설명** | 이탈 예측 일괄 계산 (크론잡 또는 수동 실행) |
| **권한** | `ADMIN` only 또는 시스템 (cron) |
| **사용 화면** | `admin/churn` 재계산 버튼 |

**Request Body:**

```typescript
{
  // 빈 바디 가능 — 전체 학생 대상 재계산
  studentIds?: string[];        // 특정 학생만 (선택)
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    calculatedCount: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    calculatedAt: string;
  }
}
```

---

## 16. AI Endpoints (AI 기능)

### 16-1. POST `/api/ai/copilot/session`

| 항목 | 내용 |
|------|------|
| **설명** | AI 코파일럿 세션 생성 |
| **권한** | `TEACHER` |
| **사용 화면** | `teacher/copilot` 새 세션 시작 |
| **외부 API** | — (세션 메타만 저장) |

**Request Body:**

```typescript
{
  classId?: string;             // 관련 반
  subject?: string;             // 교과
  topic?: string;               // 주제
}
```

**Response (201):**

```typescript
{
  success: true,
  data: {
    sessionId: string;
    classId: string | null;
    subject: string | null;
    topic: string | null;
    createdAt: string;
  }
}
```

---

### 16-2. POST `/api/ai/copilot/ask`

| 항목 | 내용 |
|------|------|
| **설명** | AI 코파일럿에 질문 → SSE 스트리밍 4카드 응답 |
| **권한** | `TEACHER` |
| **사용 화면** | `teacher/copilot/[id]` 질문 입력 |
| **외부 API** | Claude API (Anthropic) |
| **응답 형식** | `text/event-stream` (SSE) |

**Request Body:**

```typescript
{
  sessionId: string;
  question: string;
  // 컨텍스트
  context?: {
    classId?: string;
    subject?: string;
    gradeLevel?: string;        // 학생 수준
    previousQuestions?: string[];
  };
}
```

**SSE Response:**

```
event: card
data: {"type": "beginner", "content": "초급 학생용 설명..."}

event: card
data: {"type": "example", "content": "예시 문제: ..."}

event: card
data: {"type": "advanced", "content": "심화 설명 및 확장..."}

event: card
data: {"type": "summary", "content": "핵심 요약: ..."}

event: done
data: {"questionId": "xxx", "sessionId": "xxx"}
```

**저장되는 데이터 (CopilotQuestion):**

```typescript
{
  id: string;
  sessionId: string;
  question: string;
  cards: {
    beginner: string;
    example: string;
    advanced: string;
    summary: string;
  };
  usedCards: string[];          // 강사가 실제 사용(복사)한 카드 목록
}
```

---

### 16-3. PATCH `/api/ai/copilot/questions/[id]/use`

| 항목 | 내용 |
|------|------|
| **설명** | 코파일럿 카드 사용 기록 (강사가 카드를 복사/활용 시) |
| **권한** | `TEACHER` |
| **사용 화면** | `teacher/copilot/[id]` 카드 복사 버튼 클릭 시 |

**Path Params:** `id` — CopilotQuestion ID

**Request Body:**

```typescript
{
  cardType: "beginner" | "example" | "advanced" | "summary";
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    questionId: string;
    usedCards: string[];        // 업데이트된 사용 카드 목록
  }
}
```

---

### 16-4. POST `/api/ai/feedback`

| 항목 | 내용 |
|------|------|
| **설명** | AI 에세이/과제 피드백 생성 (이미지 또는 텍스트 입력) |
| **권한** | `TEACHER`, `ADMIN` |
| **사용 화면** | `teacher/assignments/[id]` AI 피드백 생성 버튼 |
| **외부 API** | Claude API (multimodal — 이미지+텍스트 동시 분석) |

**Request Body:**

```typescript
{
  assignmentId: string;
  // 텍스트 입력
  content?: string;             // 학생 제출 텍스트
  // 이미지 입력 (촬영/업로드된 과제)
  imageUrls?: string[];         // S3/R2 URL
  // 피드백 설정
  options: {
    rubricCategories?: string[];  // ["논리성", "표현력", "문법", "내용"] 등
    language?: "ko" | "en";
    difficulty?: "easy" | "medium" | "hard";
    detailLevel?: "brief" | "detailed";
  };
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    assignmentId: string;
    aiComment: string;           // AI 종합 코멘트
    rubric: {
      category: string;
      score: number;
      maxScore: number;
      comment: string;
    }[];
    overallScore: number;        // 총점
    suggestions: string[];       // 개선 제안 목록
    // 토큰 사용량
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  }
}
```

---

### 16-5. POST `/api/ai/growth-report`

| 항목 | 내용 |
|------|------|
| **설명** | AI 월간 성장 보고서 생성 |
| **권한** | `TEACHER`, `ADMIN` |
| **사용 화면** | `teacher/reports` AI 보고서 생성 버튼 |
| **외부 API** | Claude API |

**Request Body:**

```typescript
{
  studentId: string;
  month: string;                // "2026-04"
  // 아래는 서버에서 자동 수집하지만, 프론트에서 추가 컨텍스트 전달 가능
  additionalContext?: string;   // 강사가 추가로 입력한 참고사항
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    studentId: string;
    month: string;
    report: {
      summary: string;           // 전체 요약 (2~3문장)
      strengths: string[];       // 강점
      improvements: string[];    // 개선점
      recommendations: string[]; // 추천 사항
      detailedAnalysis: string;  // 상세 분석 (마크다운)
    };
    // 근거 데이터 요약
    dataUsed: {
      attendanceRate: number;
      homeworkRate: number;
      assignmentCount: number;
      averageScore: number | null;
      lessonsCompleted: number;
    };
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  }
}
```

---

### 16-6. POST `/api/ai/recording/upload`

| 항목 | 내용 |
|------|------|
| **설명** | 수업 녹음 업로드 → Whisper 전사 → Claude 요약 |
| **권한** | `TEACHER` |
| **사용 화면** | `teacher/recording` 녹음 업로드 |
| **외부 API** | OpenAI Whisper API (전사) + Claude API (요약) |
| **Content-Type** | `multipart/form-data` |

**Request Body (FormData):**

```typescript
{
  audio: File;                  // 오디오 파일 (mp3, wav, m4a, webm)
  classId?: string;
  lessonId?: string;
  date?: string;                // ISO date
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    recordingId: string;
    // Whisper 전사 결과
    transcription: {
      text: string;              // 전체 전사 텍스트
      duration: number;          // 오디오 길이 (초)
      language: string;
    };
    // Claude 요약 결과
    summary: {
      title: string;             // 수업 주제 추출
      keyPoints: string[];       // 핵심 포인트
      studentQuestions: string[]; // 학생 질문 추출
      actionItems: string[];     // 후속 조치 사항
      fullSummary: string;       // 전체 요약 (마크다운)
    };
    // 메타
    audioUrl: string;            // 저장된 오디오 URL
    createdAt: string;
  }
}
```

---

### 16-7. POST `/api/ai/review/generate`

| 항목 | 내용 |
|------|------|
| **설명** | 학생 복습 요약 + 퀴즈 생성 |
| **권한** | `TEACHER`, `ADMIN` |
| **사용 화면** | `teacher/review`, `student/review` |
| **외부 API** | Claude API |

**Request Body:**

```typescript
{
  studentId: string;
  classId: string;
  // 복습 범위
  dateRange: {
    startDate: string;
    endDate: string;
  };
  // 옵션
  options?: {
    quizCount?: number;         // 퀴즈 문항 수 (기본값 5)
    difficulty?: "easy" | "medium" | "hard";
    focusTopics?: string[];     // 집중할 주제
  };
}
```

**Response (200):**

```typescript
{
  success: true,
  data: {
    reviewId: string;
    studentId: string;
    classId: string;
    // 복습 요약
    summary: {
      period: string;            // "2026.03.01 ~ 2026.03.31"
      topicsCovered: string[];   // 다룬 주제 목록
      keyConceptsSummary: string; // 핵심 개념 요약 (마크다운)
      weakPoints: string[];      // 취약 포인트
    };
    // 퀴즈
    quiz: {
      id: string;
      question: string;
      type: "MULTIPLE_CHOICE" | "SHORT_ANSWER" | "TRUE_FALSE";
      options?: string[];        // 객관식 보기
      correctAnswer: string;
      explanation: string;       // 해설
      difficulty: "easy" | "medium" | "hard";
      relatedTopic: string;
    }[];
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
    createdAt: string;
  }
}
```

---

## 엔드포인트 요약 테이블

| # | 카테고리 | 메서드 | 경로 | 권한 | 설명 |
|---|---------|--------|------|------|------|
| 1 | Auth | POST | `/api/auth/register` | ADMIN | 사용자 등록 |
| 2 | Auth | GET | `/api/auth/me` | ALL | 현재 사용자 정보 |
| 3 | Auth | PATCH | `/api/auth/password` | ALL | 비밀번호 변경 |
| 4 | Users | GET | `/api/users` | ADMIN, TEACHER | 사용자 목록 |
| 5 | Users | GET | `/api/users/[id]` | ALL | 사용자 상세 |
| 6 | Users | PATCH | `/api/users/[id]` | ALL | 사용자 수정 |
| 7 | Users | POST | `/api/users/[id]/parents` | ADMIN, TEACHER | 학부모 추가 |
| 8 | Classes | GET | `/api/classes` | ALL | 반 목록 |
| 9 | Classes | POST | `/api/classes` | ADMIN | 반 생성 |
| 10 | Classes | GET | `/api/classes/[id]` | ADMIN, TEACHER | 반 상세 |
| 11 | Classes | PATCH | `/api/classes/[id]` | ADMIN | 반 수정 |
| 12 | Classes | POST | `/api/classes/[id]/enroll` | ADMIN | 수강 등록/해제 |
| 13 | Schedules | GET | `/api/schedules` | ALL | 시간표 조회 |
| 14 | Schedules | POST | `/api/schedules` | ADMIN | 시간표 생성 |
| 15 | Schedules | PATCH | `/api/schedules/[id]` | ADMIN | 시간표 수정 |
| 16 | Lessons | GET | `/api/lessons` | ADMIN, TEACHER | 수업 목록 |
| 17 | Lessons | POST | `/api/lessons/[id]/progress` | ADMIN, TEACHER | 진도 기록 |
| 18 | Attendance | GET | `/api/attendance` | ALL | 출결 조회 |
| 19 | Attendance | POST | `/api/attendance` | ADMIN, TEACHER | 출결 기록 (upsert) |
| 20 | Attendance | POST | `/api/attendance/bulk` | ADMIN, TEACHER | 일괄 출석 |
| 21 | Attendance | PATCH | `/api/attendance/[id]` | ADMIN, TEACHER | 출결 수정 |
| 22 | Attendance | GET | `/api/attendance/stats` | ALL | 출결 통계 |
| 23 | Assignments | GET | `/api/assignments` | ALL | 과제 목록 |
| 24 | Assignments | POST | `/api/assignments` | ADMIN, TEACHER | 과제 생성 |
| 25 | Assignments | POST | `/api/assignments/batch` | ADMIN, TEACHER | 과제 일괄 생성 |
| 26 | Assignments | GET | `/api/assignments/[id]` | ALL | 과제 상세 |
| 27 | Assignments | POST | `/api/assignments/[id]/submit` | STUDENT | 과제 제출 |
| 28 | Assignments | POST | `/api/assignments/[id]/feedback` | ADMIN, TEACHER | 피드백 저장 |
| 29 | Curriculum | GET | `/api/curriculum` | ADMIN, TEACHER | 커리큘럼 목록 |
| 30 | Curriculum | POST | `/api/curriculum` | ADMIN | 커리큘럼 생성 |
| 31 | Curriculum | PATCH | `/api/curriculum/[id]` | ADMIN | 커리큘럼 수정 |
| 32 | Curriculum | DELETE | `/api/curriculum/[id]` | ADMIN | 커리큘럼 삭제 |
| 33 | WeekNotes | GET | `/api/week-notes` | ADMIN, TEACHER | 수업 기록 조회 |
| 34 | WeekNotes | POST | `/api/week-notes` | ADMIN, TEACHER | 수업 기록 저장 |
| 35 | Payments | GET | `/api/payments` | ADMIN | 결제 목록 |
| 36 | Payments | POST | `/api/payments` | ADMIN | 결제 기록 |
| 37 | Consultations | GET | `/api/consultations` | ADMIN, TEACHER | 상담 목록 |
| 38 | Consultations | POST | `/api/consultations` | ADMIN, TEACHER | 상담 기록 |
| 39 | Memos | GET | `/api/memos` | ALL (본인) | 메모 목록 |
| 40 | Memos | POST | `/api/memos` | ALL | 메모 생성 |
| 41 | Memos | PATCH | `/api/memos/[id]` | ALL (본인) | 메모 수정 |
| 42 | Reports | GET | `/api/reports` | ALL | 보고서 조회 |
| 43 | Reports | POST | `/api/reports/[studentId]` | ADMIN, TEACHER | 보고서 저장 |
| 44 | Reports | PATCH | `/api/reports/[studentId]` | ADMIN, TEACHER | 보고서 수정 |
| 45 | Complaints | GET | `/api/complaints` | ADMIN | 민원 목록 |
| 46 | Complaints | PATCH | `/api/complaints/[id]` | ADMIN | 민원 대응 |
| 47 | Churn | GET | `/api/churn` | ADMIN | 이탈 예측 목록 |
| 48 | Churn | POST | `/api/churn/calculate` | ADMIN | 이탈 예측 계산 |
| 49 | AI | POST | `/api/ai/copilot/session` | TEACHER | 코파일럿 세션 |
| 50 | AI | POST | `/api/ai/copilot/ask` | TEACHER | 코파일럿 질문 (SSE) |
| 51 | AI | PATCH | `/api/ai/copilot/questions/[id]/use` | TEACHER | 카드 사용 기록 |
| 52 | AI | POST | `/api/ai/feedback` | ADMIN, TEACHER | AI 피드백 생성 |
| 53 | AI | POST | `/api/ai/growth-report` | ADMIN, TEACHER | AI 성장 보고서 |
| 54 | AI | POST | `/api/ai/recording/upload` | TEACHER | 녹음 업로드/요약 |
| 55 | AI | POST | `/api/ai/review/generate` | ADMIN, TEACHER | 복습 요약/퀴즈 |

---

## 구현 시 공통 패턴

### 1. Route Handler 기본 구조

```typescript
// src/app/api/[domain]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// 입력 검증 스키마
const createSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다."),
  // ...
});

export async function POST(req: NextRequest) {
  try {
    // 1. 인증
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
        { status: 401 }
      );
    }

    // 2. 권한
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "권한이 없습니다." } },
        { status: 403 }
      );
    }

    // 3. 입력 검증
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION", message: parsed.error.errors[0].message } },
        { status: 400 }
      );
    }

    // 4. 비즈니스 로직
    const result = await prisma.xxx.create({
      data: { ...parsed.data, academyId: session.user.academyId },
    });

    // 5. 응답
    return NextResponse.json({ success: true, data: result }, { status: 201 });

  } catch (error) {
    console.error("[API] POST /api/xxx error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL", message: "서버 오류가 발생했습니다." } },
      { status: 500 }
    );
  }
}
```

### 2. 페이지네이션 헬퍼

```typescript
// src/lib/api/pagination.ts
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### 3. TEACHER 권한 체크 헬퍼

```typescript
// src/lib/api/auth-check.ts
export async function checkTeacherAccess(teacherId: string, classId: string) {
  const classTeacher = await prisma.classTeacher.findFirst({
    where: { teacherId, classId },
  });
  return !!classTeacher;
}

export async function getTeacherClassIds(teacherId: string): Promise<string[]> {
  const classTeachers = await prisma.classTeacher.findMany({
    where: { teacherId },
    select: { classId: true },
  });
  return classTeachers.map((ct) => ct.classId);
}
```

### 4. 멀티테넌트 필터

```typescript
// 모든 쿼리에 academyId 조건 추가
const users = await prisma.user.findMany({
  where: {
    academyId: session.user.academyId,  // 항상 포함
    role: role || undefined,
    // ...
  },
});
```

### 5. AI API 호출 패턴

```typescript
// src/lib/ai/claude.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generateFeedback(content: string, imageUrls?: string[]) {
  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: [
      // 이미지가 있으면 멀티모달
      ...(imageUrls || []).map((url) => ({
        type: "image" as const,
        source: { type: "url" as const, url },
      })),
      { type: "text" as const, text: content },
    ],
  }];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: "당신은 학원 강사를 위한 AI 보조입니다. 한국어로 응답하세요.",
    messages,
  });

  return response;
}
```
