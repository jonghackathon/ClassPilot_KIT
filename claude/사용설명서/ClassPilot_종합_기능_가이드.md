# ClassPilot 종합 기능 가이드

> ClassPilot 전체 시스템 기능, 아키텍처, 데이터 흐름을 정리한 종합 문서
> 최종 작성일: 2026-04-13

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [기술 스택](#2-기술-스택)
3. [전체 시스템 아키텍처](#3-전체-시스템-아키텍처)
4. [인증 및 역할 시스템](#4-인증-및-역할-시스템)
5. [역할별 기능 매트릭스](#5-역할별-기능-매트릭스)
6. [전체 데이터 모델](#6-전체-데이터-모델)
7. [주요 기능별 흐름도](#7-주요-기능별-흐름도)
8. [API 엔드포인트 목록](#8-api-엔드포인트-목록)
9. [테스트 계정 및 시드 데이터](#9-테스트-계정-및-시드-데이터)
10. [페이지 라우트 구조](#10-페이지-라우트-구조)
11. [AI 기능 상세](#11-ai-기능-상세)
12. [환경 설정](#12-환경-설정)
13. [claude 폴더 구조 안내](#13-claude-폴더-구조-안내)

---

## 1. 서비스 개요

**ClassPilot**은 초중고 학원을 위한 종합 학원 관리 SaaS 플랫폼입니다.

### 핵심 가치
- 학원관리자, 강사, 학생 세 역할을 위한 맞춤형 인터페이스
- AI를 활용한 수업 코파일럿, 자동 복습 자료 생성, 이탈 예측
- 출석, 과제, 결제, 커리큘럼까지 학원 운영 전반 통합 관리

### 주요 사용자
| 역할 | 영문 | 주요 업무 |
|------|------|-----------|
| 학원관리자 | ADMIN | 학원 전체 운영 관리, 학생/강사 관리, 결제/민원 처리 |
| 강사 | TEACHER | 수업 진행, 출석 기록, 과제 출제/첨삭, AI 코파일럿 활용 |
| 학생 | STUDENT | 과제 제출, 복습 자료 확인, Q&A, 출석 확인 |

---

## 2. 기술 스택

### 프론트엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.2.2 | App Router 기반 풀스택 프레임워크 |
| React | 19.2.4 | UI 라이브러리 |
| TypeScript | 5 | 타입 안전성 |
| Tailwind CSS | 4 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 라이브러리 |
| React Hook Form | - | 폼 관리 |
| Zod | - | 스키마 검증 |
| SWR | - | 데이터 페칭 및 캐싱 |
| Zustand | - | 전역 상태 관리 |
| Lucide React | - | 아이콘 |
| Sonner | - | 토스트 알림 |

### 백엔드
| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js API Routes | - | 서버 API |
| NextAuth | v5 | 인증 |
| Prisma ORM | 7.7.0 | 데이터베이스 ORM |
| PostgreSQL | - | 관계형 데이터베이스 |
| Bcryptjs | - | 비밀번호 해싱 |

### AI
| 기술 | 버전 | 용도 |
|------|------|------|
| Anthropic Claude SDK | 0.88.0 | AI 코파일럿, 에세이 첨삭, 민원 답변 초안 |
| OpenAI SDK | 6.34.0 | 추가 AI 기능 |

### 인프라
| 기술 | 용도 |
|------|------|
| Vercel | 배포 |
| Supabase | PostgreSQL 호스팅 |

---

## 3. 전체 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   클라이언트 (브라우저)                 │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  관리자   │  │  강사    │  │      학생         │  │
│  │  /admin  │  │/teacher  │  │    /student      │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
└───────┼─────────────┼─────────────────┼────────────┘
        │             │                 │
        └─────────────┼─────────────────┘
                      │ HTTP / API 호출
                      ▼
┌─────────────────────────────────────────────────────┐
│               Next.js 서버 (App Router)               │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │              Next.js API Routes                │ │
│  │  /api/auth  /api/classes  /api/students  ...   │ │
│  └────────────────┬───────────────────────────────┘ │
│                   │                                 │
│  ┌────────────────┴───────────────────────────────┐ │
│  │           NextAuth (JWT 인증)                  │ │
│  │  Credentials Provider (이메일/PIN)             │ │
│  └────────────────┬───────────────────────────────┘ │
│                   │                                 │
│  ┌────────────────┴───────────────────────────────┐ │
│  │             Prisma ORM                         │ │
│  └────────────────┬───────────────────────────────┘ │
└───────────────────┼─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           PostgreSQL (Supabase)                     │
│                                                     │
│  Academy / User / Class / Student / ...             │
└─────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│              AI 서비스                               │
│  Anthropic Claude API  /  OpenAI API               │
└─────────────────────────────────────────────────────┘
```

---

## 4. 인증 및 역할 시스템

### 인증 방식
NextAuth v5 기반 JWT 세션 인증을 사용합니다.

### 로그인 타입

#### 직원 로그인 (관리자 / 강사)
```
URL: /login → /login/staff
방식: 이메일 + 비밀번호
검증: Bcrypt 비밀번호 비교
조건: active=true 계정만 허용
```

#### 학생 로그인
```
URL: /login → /login/student
방식: 학원코드 + 학생코드 + PIN
검증:
  1. 학원코드로 학원 조회
  2. 학생코드(userId)와 academyId로 학생 확인
  3. PIN Bcrypt 비교
조건: STUDENT 역할만 허용
```

### 역할별 라우트 접근 권한
| 경로 | 접근 가능 역할 |
|------|--------------|
| `/admin/*` | ADMIN |
| `/teacher/*` | TEACHER |
| `/student/*` | STUDENT |
| `/login` | 비로그인 사용자 |

### JWT 토큰 구조
```typescript
{
  id: string,        // 사용자 ID
  role: UserRole,    // ADMIN / TEACHER / STUDENT
  academyId: string  // 소속 학원 ID
}
```

---

## 5. 역할별 기능 매트릭스

| 기능 | 관리자 | 강사 | 학생 |
|------|:------:|:----:|:----:|
| 대시보드 | ✅ | - | ✅ (홈) |
| 반 관리 (생성/수정/삭제) | ✅ | - | - |
| 학생 관리 | ✅ | - | - |
| 강사 관리 | ✅ | - | - |
| 시간표 관리 | ✅ | - | - |
| 결제 관리 | ✅ | - | - |
| 민원 관리/처리 | ✅ | - | - |
| 민원 등록 | ✅ | - | ✅ |
| 커리큘럼 관리 | ✅ | - | - |
| 이탈예측 대시보드 | ✅ | - | - |
| 상담 기록 | ✅ | ✅ | - |
| 출석 기록 | - | ✅ | - |
| 출석 현황 확인 | ✅ | ✅ | ✅ |
| 과제 생성/배포 | - | ✅ | - |
| 과제 제출 | - | - | ✅ |
| 첨삭 작성 | - | ✅ | - |
| 첨삭 확인 | - | - | ✅ |
| AI 코파일럿 | - | ✅ | - |
| 수업 녹음 | - | ✅ | - |
| 복습 자료 생성 | - | ✅ | - |
| 복습 자료 확인 | - | - | ✅ |
| 학생 진도 관리 | ✅ | ✅ | - |
| 월간 보고서 | ✅ (열람) | ✅ (작성) | - |
| 메모 작성 | - | ✅ | - |
| Q&A 질문 | - | - | ✅ |
| Q&A 답변 | - | ✅ | - |

---

## 6. 전체 데이터 모델

### 핵심 엔티티 관계도

```
Academy (학원)
  └── User (사용자: ADMIN/TEACHER/STUDENT)
       ├── StudentProfile (학생 상세 정보)
       │    └── ParentContact (부모 연락처)
       ├── ClassTeacher (강사-반 관계)
       └── Enrollment (학생-반 등록)

Class (반)
  ├── ClassTeacher (담당 강사들)
  ├── Enrollment (수강 학생들)
  ├── CurriculumClass (연결된 커리큘럼)
  └── Schedule (수업 시간표)
       └── Lesson (개별 수업)
            ├── Attendance (출석 기록)
            ├── Assignment (과제)
            │    └── Submission (제출물)
            │         └── SubmissionHistory (제출 이력)
            ├── CopilotSession (코파일럿 세션)
            │    └── CopilotQuestion (코파일럿 질문)
            ├── RecordingSummary (녹음 요약)
            └── ReviewSummary (복습 요약)

Payment (결제)
Consultation (상담 기록)
Memo (강사 메모)
WeekNote (주간 수업 노트)
ReportData (월간 보고서)
Complaint (민원)
ChurnPrediction (이탈 예측)
BotQuestion (Q&A 질문)
BotFAQ (FAQ)
AppSetting (학원 설정)
```

### 주요 Enum 타입

| Enum | 값 |
|------|-----|
| UserRole | ADMIN, TEACHER, STUDENT |
| LessonStatus | SCHEDULED, COMPLETED, CANCELLED |
| AttendanceStatus | PRESENT, LATE, EARLY_LEAVE, ABSENT |
| HomeworkStatus | COMPLETE, INCOMPLETE |
| AssignmentType | WORKBOOK, ESSAY, IMAGE |
| SubmissionStatus | DRAFT, SUBMITTED, REVIEWED |
| PaymentStatus | PAID, UNPAID, PARTIAL |
| ConsultationType | PHONE, TEXT, IN_PERSON |
| MemoCategory | NOTICE, NOTABLE, STUDENT_NOTE, OTHER |
| ComplaintStatus | PENDING, IN_PROGRESS, RESOLVED |
| ChurnLevel | SAFE, WARNING, DANGER |
| CopilotSessionStatus | ACTIVE, COMPLETED |
| RecordingStatus | PROCESSING, COMPLETED, FAILED |
| BotQuestionStatus | PENDING, AI_ANSWERED, TEACHER_ANSWERED |

---

## 7. 주요 기능별 흐름도

### 7-1. 수업 진행 전체 흐름

```
[관리자] 반 생성 → 커리큘럼 설정 → 강사 배정 → 학생 등록 → 시간표 설정
    ↓
[시스템] 시간표에 따라 Lesson(수업) 자동 생성
    ↓
[수업 당일]
    ↓
[강사] 코파일럿 세션 시작 → 수업 진행 → 출석 기록 → 코파일럿 세션 종료
    ↓
[수업 후]
    ↓
[강사] 수업 녹음 업로드 → AI 자동 요약 생성
    ↓
[강사] 복습 자료 생성 → 학생에게 공개
    ↓
[학생] 복습 자료 확인 → 퀴즈 풀기
```

### 7-2. 과제 흐름

```
[강사] 과제 생성 (WORKBOOK / ESSAY / IMAGE)
    ↓
[시스템] 해당 반 학생 전원에게 Submission(제출물) 생성 (DRAFT 상태)
    ↓
[학생] 과제 확인 → 제출 (SUBMITTED 상태)
    ↓
[강사] 제출물 확인 → 첨삭 작성 (REVIEWED 상태)
    ↓
  ESSAY 유형은 AI 첨삭 초안 생성 가능 (Claude API)
    ↓
[학생] 첨삭 결과 확인
```

### 7-3. 이탈예측 흐름

```
[시스템 / 관리자] 이탈예측 일괄 계산 실행
    ↓
[시스템] 각 학생의 다음 요소 분석:
  - 출석률 (최근 N회 연속 결석)
  - 과제 제출률
  - 결제 연체 여부
  - 최근 상담 이력
    ↓
[시스템] ChurnLevel 산출: SAFE / WARNING / DANGER
    ↓
[관리자] 이탈예측 대시보드에서 위험 학생 확인
    ↓
[관리자] 학부모 상담 → 상담 기록 등록
```

### 7-4. 민원 처리 흐름

```
[학생 / 학부모] 민원 등록 (ComplaintStatus: PENDING)
    ↓
[관리자] 민원 목록에서 확인
    ↓
[관리자] "AI 답변 초안 생성" 클릭 → Claude AI가 초안 작성
    ↓
[관리자] 초안 수정 후 "답변 전송"
    ↓
[시스템] ComplaintStatus: RESOLVED 로 변경
```

### 7-5. 학생 로그인 흐름

```
[학생] /login 접속 → "학생" 선택
    ↓
학원코드 + 학생코드 + PIN 입력
    ↓
[시스템] 학원코드로 Academy 조회
    ↓
[시스템] 학생코드(userId) + academyId로 User 조회
    ↓
[시스템] PIN Bcrypt 비교
    ↓
성공 → JWT 토큰 발급 → /student/home 이동
실패 → 오류 메시지 표시
```

---

## 8. API 엔드포인트 목록

### 인증
```
POST  /api/auth/[...nextauth]     NextAuth 핸들러
GET   /api/auth/me                현재 사용자 정보
POST  /api/auth/register          사용자 등록
POST  /api/auth/password          비밀번호 변경
POST  /api/auth/logout            로그아웃
```

### 학원
```
GET   /api/academy                학원 정보 조회
GET   /api/auth/academy           인증 기반 학원 정보
```

### 반 관리
```
GET    /api/classes                반 목록
POST   /api/classes                반 생성
GET    /api/classes/[id]           반 상세
PATCH  /api/classes/[id]           반 수정
DELETE /api/classes/[id]           반 삭제
GET    /api/classes/[id]/members   반 구성원
POST   /api/classes/[id]/members   구성원 추가
GET    /api/classes/[id]/teachers  담당 강사 목록
POST   /api/classes/[id]/teachers  강사 배정
```

### 사용자 / 학생
```
GET    /api/users                  사용자 목록
POST   /api/users                  사용자 생성
GET    /api/users/[id]             사용자 상세
PATCH  /api/users/[id]             사용자 수정
DELETE /api/users/[id]             사용자 삭제
POST   /api/users/[id]/reset-pin   PIN 초기화
GET    /api/users/[id]/parents     부모 연락처
POST   /api/users/[id]/parents     부모 연락처 추가
POST   /api/auth/students          학생 계정 생성
```

### 시간표 / 수업
```
GET    /api/schedule               시간표 목록
POST   /api/schedule               시간표 생성
GET    /api/schedule/[id]          시간표 상세
PATCH  /api/schedule/[id]          시간표 수정
DELETE /api/schedule/[id]          시간표 삭제
GET    /api/lessons                수업 목록
POST   /api/lessons                수업 생성
GET    /api/lessons/[id]           수업 상세
PATCH  /api/lessons/[id]           수업 수정
GET    /api/lessons/[id]/progress  수업 진도
```

### 출석
```
GET    /api/attendance             출석 목록
POST   /api/attendance             출석 기록
POST   /api/attendance/bulk        일괄 출석 기록
GET    /api/attendance/[id]        출석 상세
PATCH  /api/attendance/[id]        출석 수정
GET    /api/attendance/stats       출석 통계
```

### 과제 / 제출
```
GET    /api/assignments                              과제 목록
POST   /api/assignments                              과제 생성
POST   /api/assignments/bulk                         일괄 과제 생성
GET    /api/assignments/[id]                         과제 상세
PATCH  /api/assignments/[id]                         과제 수정
DELETE /api/assignments/[id]                         과제 삭제
POST   /api/assignments/[id]/feedback                첨삭 저장
GET    /api/assignments/[id]/submissions             제출 목록
POST   /api/assignments/[id]/submissions             제출 생성
GET    /api/assignments/[id]/submissions/[sid]       제출 상세
PATCH  /api/assignments/[id]/submissions/[sid]       제출 수정
```

### 결제
```
GET    /api/payments               결제 내역 목록
POST   /api/payments               결제 기록
GET    /api/payments/[id]          결제 상세
PATCH  /api/payments/[id]          결제 수정
```

### 민원
```
GET    /api/complaints             민원 목록
POST   /api/complaints             민원 등록
GET    /api/complaints/[id]        민원 상세
PATCH  /api/complaints/[id]        민원 상태 변경
POST   /api/complaints/[id]/ai-draft  AI 답변 초안
POST   /api/complaints/[id]/respond   민원 응답
```

### 커리큘럼
```
GET    /api/curriculum             커리큘럼 목록
POST   /api/curriculum             커리큘럼 생성
GET    /api/curriculum/[id]        커리큘럼 상세
PATCH  /api/curriculum/[id]        커리큘럼 수정
DELETE /api/curriculum/[id]        커리큘럼 삭제
```

### AI 코파일럿
```
GET    /api/copilot/sessions          세션 목록
POST   /api/copilot/sessions          세션 생성
GET    /api/copilot/sessions/[id]     세션 상세
PATCH  /api/copilot/sessions/[id]     세션 수정
GET    /api/copilot/questions         질문 목록
POST   /api/copilot/questions         질문 추가
```

### 수업 녹음
```
GET    /api/recordings             녹음 목록
POST   /api/recordings             녹음 생성
GET    /api/recordings/[id]        녹음 상세
PATCH  /api/recordings/[id]        녹음 수정
```

### 복습 요약
```
GET    /api/reviews                복습 요약 목록
POST   /api/reviews                복습 요약 생성
GET    /api/reviews/[id]           복습 요약 상세
POST   /api/reviews/generate       AI 복습 요약 생성
```

### 보고서
```
GET    /api/reports                보고서 목록
POST   /api/reports                보고서 생성
GET    /api/reports/[id]           보고서 상세
PATCH  /api/reports/[id]           보고서 수정
POST   /api/reports/generate       월간 보고서 생성
```

### Q&A / 봇
```
GET    /api/qna                    Q&A 목록
POST   /api/qna                    질문 등록
GET    /api/qna/[id]               Q&A 상세
DELETE /api/qna/[id]               Q&A 삭제
POST   /api/qna/[id]/answer        답변 제출
GET    /api/bot-faq                FAQ 목록
POST   /api/bot-faq                FAQ 생성
GET    /api/bot-questions          봇 질문 목록
POST   /api/bot-questions          질문 등록
POST   /api/bot-questions/[id]/answer  답변 추가
```

### 상담 / 메모 / 노트
```
GET    /api/consultations          상담 기록 목록
POST   /api/consultations          상담 기록
GET    /api/consultations/[id]     상담 상세
PATCH  /api/consultations/[id]     상담 수정
GET    /api/memo                   메모 목록
POST   /api/memo                   메모 생성
PATCH  /api/memo/[id]              메모 수정
DELETE /api/memo/[id]              메모 삭제
GET    /api/week-notes             주간 노트 목록
POST   /api/week-notes             주간 노트 생성
PATCH  /api/week-notes/[id]        주간 노트 수정
DELETE /api/week-notes/[id]        주간 노트 삭제
```

### 이탈 예측
```
GET    /api/churn                  이탈예측 목록
POST   /api/churn                  이탈예측 생성
GET    /api/churn/[id]             이탈예측 상세
POST   /api/churn/batch            일괄 이탈예측 계산
```

### AI / 알림 / 설정
```
POST   /api/ai/essay-feedback      에세이 AI 첨삭
GET    /api/notifications          알림 목록
GET    /api/settings               설정 조회
PATCH  /api/settings               설정 수정
```

---

## 9. 테스트 계정 및 시드 데이터

### 학원 정보
| 항목 | 값 |
|------|-----|
| 학원명 | ClassPilot |
| 학원코드 | `DEMO-1234` |

### 관리자 계정
| 항목 | 값 |
|------|-----|
| 이메일 | `admin@academind.kr` |
| 비밀번호 | `1234` |
| 이름 | 정태 |

### 강사 계정
| 이름 | 이메일 | 비밀번호 | 담당 반 |
|------|--------|----------|---------|
| 박강사 | `teacher@academind.kr` | `1234` | 논술 중급반 |
| 김강사 | `kim@academind.kr` | `1234` | 수학 A반 |
| 이강사 | `lee@academind.kr` | `1234` | 영어 B반 |
| 정강사 | `jung@academind.kr` | `1234` | 국어 A반 |

### 학생 계정
| 이름 | 학원코드 | 학생코드 | PIN | 학교 | 학년 |
|------|----------|----------|-----|------|------|
| 민수 | `DEMO-1234` | `2025-001` | `1234` | 중앙중 | 중2 |
| 이지은 | `DEMO-1234` | `2025-002` | `1234` | 서초중 | 중2 |
| 정우진 | `DEMO-1234` | `2025-003` | `1234` | 반포중 | 중3 |
| 한소영 | `DEMO-1234` | `2025-004` | `1234` | 잠원중 | 중2 |
| 김태호 | `DEMO-1234` | `2025-005` | `1234` | 서일중 | 중1 |

### 시드 데이터 내용 (prisma/seed.js)
- **반**: 논술 중급반, 수학 A반, 영어 B반, 국어 A반 (총 4개)
- **커리큘럼**: 국어 논술, 수학 내신 (총 2개)
- **수업**: 완료 1개, 예정 3개
- **출석 기록**: 완료된 수업의 학생별 출석
- **과제**: 각 반별 샘플 과제 및 제출물
- **결제 내역**: 학생별 수강료 결제 기록
- **상담 기록**: 샘플 학부모 상담 이력
- **민원**: 샘플 민원 데이터
- **이탈예측**: 일부 학생 위험도 데이터
- **AI 코파일럿 세션**: 샘플 코파일럿 대화
- **녹음 요약**: 샘플 수업 녹음 요약
- **복습 요약**: 샘플 복습 자료

### 시드 데이터 실행 방법
```bash
npm run db:seed
# 또는
npx prisma db seed
```

---

## 10. 페이지 라우트 구조

### 인증
```
/login              로그인 선택 (관리자/강사 vs 학생)
/login/staff        직원 로그인 (이메일 + 비밀번호)
/login/student      학생 로그인 (학원코드 + 학생코드 + PIN)
```

### 학원관리자 (`/admin/`)
```
/admin/dashboard        대시보드
/admin/classes          반 목록
/admin/classes/[id]     반 상세 (강사 배정, 학생 관리)
/admin/students         학생 목록
/admin/students/[id]    학생 상세 (출석, 결제, 상담, 이탈예측)
/admin/teachers         강사 목록
/admin/schedule         시간표 관리
/admin/payments         결제 관리
/admin/complaints       민원 관리
/admin/curriculum       커리큘럼 관리
/admin/churn            이탈예측 대시보드
```

### 강사 (`/teacher/`)
```
/teacher/attendance          출석 기록
/teacher/assignments         과제 목록
/teacher/assignments/[id]    과제 상세 및 제출물 관리
/teacher/progress            학생 진도 현황
/teacher/copilot             AI 코파일럿 세션 목록
/teacher/copilot/[lessonId]  수업별 코파일럿 상세
/teacher/recording           수업 녹음 목록
/teacher/recording/[id]      녹음 상세 및 요약
```

### 학생 (`/student/`)
```
/student/home              홈 (다음 수업, 임박한 과제)
/student/attendance        출석 현황
/student/assignments       과제 목록
/student/assignments/[id]  과제 제출 및 첨삭 확인
/student/review            복습 자료 목록
/student/review/[id]       복습 자료 상세
/student/qna               Q&A 질문/답변
```

---

## 11. AI 기능 상세

### 사용 AI 서비스
- **Anthropic Claude**: 코파일럿, 에세이 첨삭, 민원 답변 초안, 복습 자료 생성
- **OpenAI**: 추가 AI 기능

### 기능별 AI 활용

#### AI 코파일럿 (강사용)
- 수업 중 강사가 입력한 학생 질문에 실시간 AI 답변 생성
- Claude API 스트리밍 응답 지원
- 세션 내 모든 Q&A 자동 저장

#### 에세이 첨삭
- 학생이 제출한 에세이를 Claude가 분석
- 문법, 논리 구조, 표현 개선 사항 자동 제안
- 강사가 AI 초안을 수정하여 최종 첨삭 제공
- 엔드포인트: `POST /api/ai/essay-feedback`

#### 민원 답변 초안
- 접수된 민원 내용을 Claude가 분석
- 적절한 답변 초안 자동 생성
- 관리자가 초안 수정 후 학부모에게 전송
- 엔드포인트: `POST /api/complaints/[id]/ai-draft`

#### 수업 녹음 요약
- 업로드된 수업 녹음을 AI가 자동 분석 및 요약
- 핵심 개념, 다뤄진 문제, 주요 Q&A 정리
- 요약 완료 후 복습 자료 생성의 기반 데이터로 활용

#### 복습 자료 생성
- 녹음 요약 또는 강사 입력 기반으로 AI가 복습 자료 작성
- 핵심 개념 정리, 복습 퀴즈, 다음 수업 준비사항 포함
- 학생 화면에 공개 설정 가능
- 엔드포인트: `POST /api/reviews/generate`

#### 월간 보고서
- 학생의 한 달간 출석, 과제, 진도 데이터를 AI가 분석
- 강사 의견과 결합하여 학부모 전달용 보고서 초안 생성
- 엔드포인트: `POST /api/reports/generate`

---

## 12. 환경 설정

### 필수 환경 변수 (.env)
```env
# 데이터베이스
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[랜덤 시크릿 키]

# AI API
ANTHROPIC_API_KEY=[Anthropic Claude API 키]
OPENAI_API_KEY=[OpenAI API 키]
```

### 개발 서버 실행
```bash
npm install        # 패키지 설치
npm run db:push    # DB 스키마 적용
npm run db:seed    # 시드 데이터 입력
npm run dev        # 개발 서버 시작 (http://localhost:3000)
```

### 데이터베이스 관리
```bash
npm run db:generate    # Prisma Client 재생성
npm run db:push        # 스키마 변경사항 DB 적용
npm run db:seed        # 시드 데이터 초기화
npm run db:studio      # Prisma Studio (DB GUI 열기)
```

---

## 13. claude 폴더 구조 안내

`/ClassPilot/claude/` 폴더는 프로젝트 기획, 설계, 개발 문서와 Claude Code 작업 가이드를 보관하는 폴더입니다.

```
claude/
│
├── README.md                          # claude 폴더 소개 및 전체 목차
│
├── 사용설명서/                         ★ 현재 폴더 (사용자 가이드)
│   ├── 학원관리자_사용가이드.md          관리자 역할 사용법
│   ├── 강사_사용가이드.md               강사 역할 사용법
│   ├── 학생_사용가이드.md               학생 역할 사용법
│   └── ClassPilot_종합_기능_가이드.md   ★ 현재 문서 (전체 기능 종합)
│
├── docs/                              프로젝트 기획 및 설계 문서
│   ├── 01_기획서.md                    서비스 기획서
│   ├── 02_기능_요구사항_정의서.md        기능 요구사항
│   ├── 03_DB_스키마_설계서.md           데이터베이스 설계
│   ├── 04_API_명세서.md                API 상세 명세
│   ├── 05_시스템_아키텍처.md            시스템 구조 설계
│   └── 화면_설계서/                    UI/UX 화면 설계
│       ├── 00_목차.md
│       ├── 01_설계_원칙_및_디자인_시스템.md
│       ├── 02_권한_매트릭스_및_라우팅.md
│       ├── 03_사용자_워크플로우.md
│       ├── 04_와이어프레임_공통_컴포넌트.md
│       ├── 05_와이어프레임_인증.md
│       ├── 06_와이어프레임_운영자.md
│       ├── 07_와이어프레임_강사.md
│       ├── 08_와이어프레임_수강생.md
│       ├── 09_반응형_설계.md
│       ├── 10_상태_및_에러_처리.md
│       ├── 11_모달_다이얼로그_인벤토리.md
│       ├── 12_컴포넌트_명세.md
│       ├── 13_화면별_API_매핑.md
│       └── 14_Figma_디자인_프롬프트.md
│
├── guides/                            Claude Code 및 개발 도구 가이드
│   ├── README.md
│   ├── claude-code/                   Claude Code 사용 가이드
│   │   ├── 01_슬래시_커맨드_스킬.md
│   │   ├── 02_MCP_서버_활용.md
│   │   ├── 03_CLAUDE_MD_작성법.md
│   │   ├── 04_Hooks_설정.md
│   │   ├── 05_고급_워크플로우.md
│   │   └── 06_단축키_팁.md
│   ├── codex/                         OpenAI Codex 작업 방식
│   ├── design-workflow/               AI 디자인 워크플로우
│   ├── git-worktree/                  Git Worktree 병렬 작업
│   ├── orchestra/                     Orchestra 운영 방식
│   └── token-optimization/            토큰 최적화 전략
│
├── done/                              완료된 작업 산출물
│   ├── 09_구현_로드맵/                구현 로드맵 및 진행 로그
│   │   └── step별_구현/               단계별 구현 계획서
│   ├── 10_추가_기능_요구사항/          추가 기능 정의서
│   ├── 11_백엔드_기능_구현_계획/       백엔드 구현 계획
│   ├── 12_Supabase_연동/              Supabase 연동 가이드
│   └── docs_history/                  이전 버전 문서 보관
│
├── in-progress/                       진행 중인 작업
│   └── 13_로그인_UX_개선/             로그인 UX 개선 작업
│       ├── 01_로그인_UX_설계.md
│       └── 02_구현_계획서.md
│
└── templates/                         작업 템플릿
    └── task_template.md               작업 요청서 템플릿
```

### 폴더별 용도 요약

| 폴더 | 용도 |
|------|------|
| `사용설명서/` | 역할별 사용자 가이드 (현재 문서들) |
| `docs/` | 기획서, 요구사항, DB 설계, API 명세, 화면 설계 |
| `guides/` | Claude Code 사용법, 개발 워크플로우 가이드 |
| `done/` | 완료된 구현 계획서 및 작업 산출물 아카이브 |
| `in-progress/` | 현재 진행 중인 작업 문서 |
| `templates/` | 작업 시작 시 사용하는 템플릿 파일 |

---

*ClassPilot — 학원 운영의 모든 것을 하나로*
