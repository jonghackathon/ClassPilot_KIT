# Step 6: AI 연동 (코파일럿, 에세이 피드백, 성장보고서, Whisper, 복습생성, 이탈예측, 민원초안)

**선행 조건:** Step 5 완료
**모델:** Claude Sonnet (`claude-sonnet-4-6`) / OpenAI Whisper (`whisper-1`)
**환경변수:**
```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## 전체 AI 기능 맵

| # | 기능 | 트리거 | 모델 | 저장 위치 | 현재 상태 |
|---|------|--------|------|---------|---------|
| 6-1 | AI Copilot | 교사 수업 중 질문 | Claude (SSE) | `CopilotQuestion` | 골격만 있음, 심각한 버그 |
| 6-2 | 에세이 피드백 | 교사 피드백 작성 시 초안 요청 | Claude | `Submission.teacherFeedback` | route 없음 |
| 6-3 | 성장 리포트 | 어드민/교사 월별 생성 | Claude | `ReportData` | route 있음, AI 미연결 |
| 6-4 | Whisper 녹음 변환 | 교사 음성 파일 업로드 | Whisper | `RecordingSummary` | 골격 있음, 심각한 버그 |
| 6-5 | 복습 자동 생성 | 교사 수업 후 생성 | Claude | `ReviewSummary` | route 있음, AI 미연결 |
| 6-6 | 이탈 예측 배치 | Vercel Cron (일1회) | 규칙 기반 | `ChurnPrediction` | 조회/수정만 있음, 생성 없음 |
| 6-7 | 민원 AI 초안 | 어드민 민원 응답 전 | Claude | `Complaint.aiDraft` | route 없음 |

---

## 0. 공통 인프라 (가장 먼저 작업)

### 0-1. `src/lib/ai/claude.ts` — Claude 클라이언트

**작업:**
```typescript
import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
```

- `npm install @anthropic-ai/sdk` 설치 필요
- 스트리밍(`stream`)과 일반 호출(`messages.create`) 모두 이 인스턴스 재사용
- 환경변수 없으면 서버 시작 시 명확한 에러 발생하도록 guard 추가

### 0-2. `src/lib/ai/openai.ts` — Whisper 클라이언트

**작업:**
```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
```

- `npm install openai` 설치 필요

### 0-3. `src/lib/ai/prompts.ts` — 프롬프트 템플릿

아래 각 기능의 프롬프트를 함수로 관리. 수업 맥락(topic, summary 등)을 파라미터로 받아 조합.

```typescript
export function copilotPrompt(question: string, topic: string | null): string
export function essayFeedbackPrompt(content: string, assignment: string): string
export function reportPrompt(student: string, month: string, data: ReportContext): string
export function recordingSummaryPrompt(transcript: string, topic: string | null): string
export function reviewGenerationPrompt(weekNote: string, topic: string | null): string
export function churnInterpretPrompt(student: string, score: number, factors: ChurnFactors): string
export function complaintDraftPrompt(complaint: string): string
```

---

## 6-1. AI Copilot (SSE 스트리밍)

### 현재 상태 (버그 목록)

#### `src/app/api/copilot/sessions/route.ts`

현재 코드가 Prisma 모델과 완전히 불일치함. **전면 재작성 필요.**

```
현재 저장 시도 필드: classId, title, context, status='READY'
실제 CopilotSession 모델: lessonId(필수), teacherId, topic, status(ACTIVE|COMPLETED)
```

**수정 후 POST body:**
```typescript
{ lessonId: string, topic?: string }
```

**수정 후 create data:**
```typescript
{
  lessonId: body.lessonId,   // 필수
  teacherId: session.user.id,
  topic: body.topic ?? null,
  status: 'ACTIVE',          // enum: ACTIVE | COMPLETED
}
```

**수정 후 GET where 필터:**
- `classId` 필터 제거 → `lessonId` 필터로 교체
- status 타입: `'ACTIVE' | 'COMPLETED'`

#### `src/app/api/copilot/questions/route.ts`

현재 코드가 존재하지 않는 필드를 참조함. **재작성 필요.**

```
현재 버그:
- copilotSession.context 조회 → context 필드 없음 (lessonId로 lesson을 join해야 함)
- prisma.copilotQuestion.create data에 answer, used 필드 → 모델에 없음
- status: 'IN_PROGRESS' → enum에 없음 (ACTIVE | COMPLETED)
- buildCopilotAnswer()는 mock — 실제 Claude SSE 스트리밍으로 교체 필요

실제 CopilotQuestion 모델 필드:
  sessionId, question, beginner, example, advanced, summary, usedCards[]
```

**수정 후 작업 흐름 (SSE 방식):**

```
POST /api/copilot/questions
body: { sessionId, question }

1. CopilotSession 조회 (lesson.topic 포함하여 join)
2. ReadableStream 생성 → Response 반환 (Content-Type: text/event-stream)
3. Claude stream.create() 호출
   - 프롬프트: "질문에 대해 beginner/example/advanced/summary 4개 카드 형태로 JSON 응답"
   - max_tokens: 1500
4. 스트리밍 청크를 SSE 포맷으로 클라이언트로 전달
5. 스트리밍 완료 후 JSON 파싱 → prisma.copilotQuestion.create
   - beginner, example, advanced, summary 각각 저장
6. CopilotSession status 변경은 하지 않음 (ACTIVE 유지, 종료 시 COMPLETED)
```

**Claude 응답 JSON 형식 (structured output):**
```json
{
  "beginner": "초보자를 위한 핵심 설명",
  "example": "구체적인 예시나 코드",
  "advanced": "심화 내용 또는 확장 질문",
  "summary": "한 줄 요약"
}
```

#### `src/app/api/copilot/sessions/[id]/route.ts`

PATCH에서 없는 필드(`title`, `context`) 업데이트 시도. 수정 필요.

```
제거: title, context 업데이트 로직
유지: status 업데이트 (ACTIVE → COMPLETED, 세션 종료 시)
status 타입: 'ACTIVE' | 'COMPLETED'
```

### 신규 작업

#### `src/hooks/useCopilot.ts`

```typescript
// SSE 연결 관리
function useCopilotStream(sessionId: string) {
  // EventSource 또는 fetch + ReadableStream으로 SSE 수신
  // 수신 중 상태(streaming: boolean), 현재 누적 텍스트(buffer: string) 관리
  // 완료 시 CopilotQuestion 데이터 반환
}

// 세션 목록
function useCopilotSessions(lessonId?: string) { ... }

// 세션 상세 (questions 포함)
function useCopilotSession(sessionId?: string) { ... }
```

#### `src/components/ai/CopilotPanel.tsx`

```
- 상단: 수업 주제(lesson.topic) 표시
- 입력창: 질문 textarea + 전송 버튼
- 전송 시: POST /api/copilot/questions → SSE 수신 → 스트리밍 텍스트 표시
- 완료 시: 4개 카드(beginner/example/advanced/summary) 탭 UI 렌더링
- 각 카드 우측 상단: 복사 버튼 (navigator.clipboard.writeText)
- 이전 질문 목록: 스크롤 가능한 히스토리
- 세션 종료 버튼: 클릭 시 확인 모달(M-T05) → PATCH status: 'COMPLETED'
```

**화면 연결:** `teacher/copilot/[lessonId]/page.tsx`

현재 이 페이지는 `TeacherCopilotSessionPage` 컴포넌트를 렌더링하는데, 이 컴포넌트가 하드코딩 상태.
`lessonId`를 URL 파라미터로 받아서 세션 생성/조회에 사용해야 함.

```typescript
// teacher/copilot/[lessonId]/page.tsx 수정
export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  return <TeacherCopilotSessionPage lessonId={lessonId} />
}
```

**teacher/copilot/page.tsx (목록):** 오늘의 수업 목록 → 각 수업 클릭 시 `/teacher/copilot/[lessonId]`로 이동.
현재 하드코딩. `GET /api/lessons?classId=&date=today` 로 실데이터 연결.

---

## 6-2. 에세이 피드백

### 현재 상태

`src/app/api/ai/essay-feedback/route.ts` — **파일 없음.** 완전 신규 작업.

### 작업

**POST `/api/ai/essay-feedback`**

```
body: {
  submissionId: string,   // 대상 제출물
  assignmentTitle: string,
  content: string         // 학생 답안 원문
}

1. Submission 존재 + 교사 담당 반 확인
2. Claude messages.create() 호출
   - 과제 제목 + 학생 답안을 컨텍스트로 제공
   - 응답: { strengths, improvements, score, summary } JSON
   - max_tokens: 800
3. 응답 반환 (DB 저장 안 함 — 교사가 직접 편집 후 확정)
```

**Claude 응답 형식:**
```json
{
  "strengths": "잘된 점 2~3가지",
  "improvements": "개선할 점 2~3가지",
  "score": 85,
  "summary": "종합 한 줄 평"
}
```

**UI 연결:** `teacher/assignments/[id]` 의 피드백 작성 모달(M-T04) 내부.
- "AI 초안 생성" 버튼 → POST 호출 → textarea에 자동 채움
- 교사가 편집 후 "피드백 확정" → 기존 `PATCH /api/assignments/[id]/submissions/[submissionId]`

**새로 만들 파일:**
- `src/app/api/ai/essay-feedback/route.ts`

---

## 6-3. 성장 리포트 자동 생성

### 현재 상태

`src/app/api/reports/generate/route.ts` — **이미 존재**. 데이터 수집 + 텍스트 조합까지 구현되어 있음.

```typescript
// 현재: 단순 문자열 조합 (AI 없음)
const growth = weekNotes.map(...).join(' / ')
const comment = `${student.name} 수강생 월간 리포트 초안`
```

**수정 방향:** 수집된 데이터를 Claude에 넘겨 자연스러운 서술형 텍스트 생성으로 교체.

### 수정 내용 (`src/app/api/reports/generate/route.ts`)

```
현재 하드코딩 로직을 Claude API로 교체:

입력 데이터 (이미 수집됨):
- attendances: 출결 현황 (PRESENT/LATE/ABSENT/EARLY_LEAVE 카운트)
- submissions: 과제 제출 현황 (상태별 카운트, 피드백 완료 수)
- weekNotes: 최근 6회 수업 내용 + 학생 반응

Claude 호출:
- 위 데이터를 구조화하여 프롬프트 생성
- 응답: { comment, growth } — 자연어 서술
- max_tokens: 600

저장:
- ReportData.comment ← Claude 생성 종합 코멘트
- ReportData.growth ← Claude 생성 성장 서술
- ReportData.attendanceSummary ← 기존 로직 유지 (단순 집계)
- ReportData.assignmentSummary ← 기존 로직 유지 (단순 집계)
```

**UI 연결:** `admin/students/[id]` 리포트 탭 또는 `teacher/reports` 페이지.

현재 `ReportsPage`는 하드코딩. 실데이터 연결 필요:
- `GET /api/reports?studentId=&monthStr=` — 목록 (현재 route 없음, 신규)
- `POST /api/reports/generate` — 생성 버튼 클릭 시

**새로 만들 파일:**
- `src/app/api/reports/route.ts` — GET (목록 조회, 필요시)

---

## 6-4. Whisper 녹음 변환

### 현재 상태

`src/app/api/recordings/route.ts` — **존재하나 Prisma 모델과 심각한 불일치.** 전면 재작성 필요.

```
현재 버그:
- 저장 필드: classId, teacherId, title, originalFileName, keyPhrases, actionItems → 모두 없음
- status: 'COMPLETED' (즉시) → 실제로는 PROCESSING → COMPLETED 흐름이어야 함
- GET 필터에 'UPLOADED' status → enum에 없음 (PROCESSING|COMPLETED|FAILED)
- Whisper API 호출 없음 (transcript를 body로 받음 — 임시 mock)

실제 RecordingSummary 필드:
  id, lessonId(필수), audioUrl, transcript, summary, questions, nextPoints,
  status(PROCESSING|COMPLETED|FAILED), progress(0~100), createdAt, updatedAt
```

### 수정 내용

#### `src/app/api/recordings/route.ts` — 전면 재작성

**GET:**
```
where 필터:
- lessonId (선택)
- status: 'PROCESSING' | 'COMPLETED' | 'FAILED' (UPLOADED 제거)
- lesson.class.teachers 를 통한 teacher 접근제어
```

**POST (파일 업로드 + Whisper 변환 + Claude 요약):**

```
Content-Type: multipart/form-data
body: {
  lessonId: string,   // 필수
  audio: File         // 음성 파일 (m4a/mp3/wav/webm, max 25MB)
}

흐름:
1. lessonId로 Lesson 조회 (topic 포함), academy 접근 확인
2. RecordingSummary create → status: 'PROCESSING', progress: 0
3. 즉시 201 응답 반환 (레코드 id 포함) — 클라이언트는 polling으로 진행상황 확인
4. 백그라운드 처리 (waitUntil 또는 별도 job):
   a. 파일을 Buffer로 변환
   b. OpenAI Whisper API 호출 → transcript 획득
   c. progress: 50 업데이트
   d. Claude API 호출 (transcript + lesson.topic → summary/questions/nextPoints)
   e. RecordingSummary update:
      - transcript, audioUrl, summary, questions, nextPoints
      - status: 'COMPLETED', progress: 100
   f. 실패 시: status: 'FAILED'
```

**Claude 녹음 요약 응답 형식:**
```json
{
  "summary": "수업 핵심 내용 요약 (3~5문장)",
  "questions": "학생들이 반복적으로 물어본 질문 / 이해가 부족했던 부분",
  "nextPoints": "다음 수업 전 준비사항 또는 심화 포인트"
}
```

#### `src/app/api/recordings/[id]/route.ts` — GET (진행상황 polling)

```
GET /api/recordings/[id]
→ RecordingSummary 단건 조회 (status, progress, summary 등 포함)
클라이언트는 status === 'PROCESSING' 동안 5초마다 polling
```

### UI 연결 (`teacher/recording/page.tsx` → `TeacherRecordingPage`)

현재 전부 하드코딩. 실데이터 연결 필요:

```
목록: GET /api/recordings?lessonId= (또는 전체)
업로드 UI:
  1. 수업 선택 드롭다운 (GET /api/lessons — 최근 수업 목록)
  2. 파일 input (accept=".m4a,.mp3,.wav,.webm", max 25MB)
  3. 업로드 버튼 → multipart POST
  4. 업로드 완료 → 상태 PROCESSING 표시
  5. 5초마다 GET polling → progress 바 업데이트
  6. status COMPLETED → 요약 결과 표시
```

**새로 만들 파일:**
- 없음 (기존 route 재작성)

**주의:** Vercel 무료 플랜은 함수 실행 시간 10초 제한. 긴 음성 파일은 Edge Runtime이나 별도 처리 필요. 초기 구현은 짧은 파일(5분 이하) 기준으로 동기 처리.

---

## 6-5. 복습 자동 생성

### 현재 상태

`src/app/api/reviews/route.ts` — POST가 ADMIN/TEACHER만 허용, 수동으로 summary/quiz 입력.
현재는 AI 없이 수동 생성만 가능한 상태.

### 작업

#### `src/app/api/reviews/generate/route.ts` — 신규 (AI 기반 생성)

```
POST /api/reviews/generate
권한: ADMIN, TEACHER
body: {
  lessonId: string,    // 어느 수업의 복습인지
  studentIds: string[] // 생성 대상 학생 목록 (반 전체 또는 선택)
}

흐름:
1. lessonId로 Lesson 조회 (topic, date)
2. 해당 Lesson의 WeekNote 조회 (content, studentReaction)
3. 데이터 없으면 422 에러 ("수업 내용 기록이 없어 복습 생성 불가")
4. Claude API 호출 (lesson topic + weekNote content 기반)
   - 응답: { summary, quiz[], preview }
   - quiz 형식: [{ question, choices: [A,B,C,D], answer: 'A', explanation }] × 3문제
5. studentIds 각각에 대해 ReviewSummary upsert
   (lessonId + studentId 조합으로 중복 방지)
6. 생성된 ReviewSummary 목록 반환
```

**Claude 복습 응답 형식:**
```json
{
  "summary": "이번 수업 핵심 3줄 요약",
  "quiz": [
    {
      "question": "질문 내용",
      "choices": ["A. 보기1", "B. 보기2", "C. 보기3", "D. 보기4"],
      "answer": "A",
      "explanation": "정답 해설"
    }
  ],
  "preview": "다음 수업 예고 (1~2문장)"
}
```

**저장:** `ReviewSummary.quiz` 는 `Json?` 타입 → quiz 배열 그대로 저장

**UI 연결:** `teacher/progress/page.tsx`
- 수업 행 옆 "복습 생성" 버튼 → POST /api/reviews/generate
- 생성 완료 후 해당 학생의 student/review 에서 확인 가능

---

## 6-6. 이탈 예측 배치

### 현재 상태

`GET /api/churn` — 기존 ChurnPrediction 조회 ✅
`GET/PATCH/DELETE /api/churn/[id]` — 단건 조회/수정 ✅

**없는 것:** ChurnPrediction 레코드를 **새로 계산해서 생성/갱신**하는 POST 배치 route

### 작업

#### `src/app/api/churn/batch/route.ts` — 신규 (배치 생성)

```
POST /api/churn/batch
권한: ADMIN (또는 Vercel Cron 헤더 검증)
body: {} (전체 학원 학생 대상) 또는 { studentIds: string[] } (선택적)

흐름:
1. 대상 학생 목록 조회 (active Enrollment 기준)
2. 학생별 최근 30일 데이터 수집:
   - attendances: 출석률, 지각/결석 횟수
   - submissions: 과제 제출률, 제출 지연 횟수
   - botQuestions: 최근 질문 수 (참여도)
3. 팩터별 점수 계산 (0~100, 높을수록 이탈 위험 높음):
   - attendanceFactor: (결석+지각×0.5) / 총수업 × 100
   - homeworkFactor: 미제출 / 총과제 × 100
   - accessFactor: 최근 2주 출석 없으면 100, 1주 없으면 50
   - questionFactor: 질문 0건이면 40 (참여 부족)
4. score = (attendanceFactor×0.4 + homeworkFactor×0.3 + accessFactor×0.2 + questionFactor×0.1)
5. level 분류:
   - score < 30: SAFE
   - score 30~59: WARNING
   - score >= 60: DANGER
6. ChurnPrediction upsert (studentId 기준)
7. DANGER 학생 목록 반환
```

**Vercel Cron 설정 (`vercel.json`):**
```json
{
  "crons": [{
    "path": "/api/churn/batch",
    "schedule": "0 1 * * *"
  }]
}
```

Cron 요청에는 `Authorization: Bearer ${CRON_SECRET}` 헤더 추가. route에서 이 헤더 검증.

**환경변수 추가:**
```env
CRON_SECRET=랜덤_긴_문자열
```

---

## 6-7. 민원 AI 초안

### 현재 상태

`src/app/api/complaints/[id]/respond/route.ts` — POST 존재.
`Complaint.aiDraft` 필드 존재 ✅
현재 route는 `body.aiDraft`를 받아 그냥 저장하는 구조 — **AI 호출 없음.**

### 작업

#### `src/app/api/complaints/[id]/ai-draft/route.ts` — 신규

```
POST /api/complaints/[id]/ai-draft
권한: ADMIN

흐름:
1. Complaint 조회 (id + academyId 확인)
2. complaint.content를 Claude에 전달
3. Claude 응답: 정중하고 공식적인 민원 답변 초안 (200~400자)
4. Complaint.aiDraft 업데이트 (저장)
5. 응답 반환
```

**Claude 프롬프트 포인트:**
- 학원 운영자 입장에서 작성
- 민원 내용을 인정하고 개선 의지 표현
- 구체적인 조치 계획 포함

**UI 연결:** `admin/complaints` 민원 응답 모달(M-A12)
- "AI 초안 생성" 버튼 → POST /api/complaints/[id]/ai-draft
- 응답으로 받은 aiDraft를 textarea에 자동 채움
- 어드민이 편집 후 "응답 확정" → 기존 `POST /api/complaints/[id]/respond`

---

## 작업 파일 목록 (전체)

### 신규 생성

| 파일 | 내용 |
|------|------|
| `src/lib/ai/claude.ts` | Anthropic SDK 클라이언트 |
| `src/lib/ai/openai.ts` | OpenAI SDK 클라이언트 |
| `src/lib/ai/prompts.ts` | 프롬프트 템플릿 함수 모음 |
| `src/app/api/ai/essay-feedback/route.ts` | 에세이 피드백 초안 생성 |
| `src/app/api/reviews/generate/route.ts` | 복습 자동 생성 |
| `src/app/api/churn/batch/route.ts` | 이탈 예측 배치 |
| `src/app/api/complaints/[id]/ai-draft/route.ts` | 민원 AI 초안 |
| `src/app/api/reports/route.ts` | 리포트 목록 조회 |
| `src/hooks/useCopilot.ts` | Copilot SSE 훅 |
| `src/components/ai/CopilotPanel.tsx` | Copilot UI 컴포넌트 |
| `vercel.json` | Cron Job 설정 |

### 수정 (전면 재작성)

| 파일 | 이유 |
|------|------|
| `src/app/api/copilot/sessions/route.ts` | Prisma 필드 불일치 전체 (classId/title/context → lessonId/topic, status enum) |
| `src/app/api/copilot/questions/route.ts` | context/answer/used 필드 없음, mock 로직, 잘못된 status enum |
| `src/app/api/recordings/route.ts` | Prisma 필드 불일치 전체 (classId/teacherId/title 등 → lessonId), Whisper 연동 |

### 수정 (일부)

| 파일 | 내용 |
|------|------|
| `src/app/api/copilot/sessions/[id]/route.ts` | title/context/잘못된 status enum 제거 |
| `src/app/api/reports/generate/route.ts` | Claude API 호출로 growth/comment 교체 |
| `src/app/api/recordings/[id]/route.ts` | GET 단건 조회 확인 (polling용) |
| `src/app/teacher/copilot/[lessonId]/page.tsx` | lessonId prop 전달 |

### 화면 실데이터 연결 (하드코딩 → API)

| 컴포넌트/페이지 | 연결 API |
|--------------|---------|
| `TeacherCopilotSessionPage` (`teacher/copilot/[lessonId]`) | Copilot sessions/questions API + SSE |
| `TeacherCopilotPage` (`teacher/copilot`) | `GET /api/lessons` (오늘 수업 목록) |
| `TeacherRecordingPage` (`teacher/recording`) | `GET /api/recordings`, `POST /api/recordings` |
| `ReportsPage` (`teacher/reports` 또는 `admin/students/[id]`) | `GET /api/reports`, `POST /api/reports/generate` |

---

---

## 로딩 UI 작업

> AI 기능은 응답 시간이 길기 때문에 로딩 상태 UI가 필수다.
> 아래는 기능별로 **현재 구현 상태**와 **추가해야 할 것**을 정리한다.

### 현재 공통 컴포넌트 현황

| 컴포넌트 | 위치 | 상태 |
|---------|------|------|
| `ProgressBar` | `src/components/frontend/common.tsx` | ✅ 존재, `value` prop (0~100) |
| `Skeleton` | `src/components/ui/skeleton.tsx` | ✅ 존재하나 실사용 거의 없음 |
| `Spinner` | — | ❌ 없음. `LoaderCircle` + `animate-spin` 직접 사용 중 |
| `StatusBadge` | `src/components/frontend/common.tsx` | ✅ 존재 |

**Spinner가 없으므로 공통 컴포넌트 먼저 추가 권장:**
```typescript
// src/components/frontend/common.tsx 에 추가
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[size]
  return <LoaderCircle className={cx(cls, 'animate-spin text-indigo-500')} />
}
```

---

### 6-1. AI Copilot 로딩 UI

**현재 상태:**
- `TeacherCopilotSessionPage` 전부 하드코딩 mock
- 질문 전송 시 즉시 카드 표시 (API 호출 없음)
- 로딩 상태 변수 없음, 버튼 disabled 없음

**추가해야 할 상태:**
```typescript
// TeacherCopilotSessionPage 또는 CopilotPanel 내부
const [isStreaming, setIsStreaming] = useState(false)
const [streamBuffer, setStreamBuffer] = useState('')  // SSE 수신 중 누적 텍스트
const [pendingQuestion, setPendingQuestion] = useState('')  // 전송한 질문 보존
```

**UI 구현 명세:**

1. **전송 버튼:**
   ```
   isStreaming=true → disabled + "생성 중..." 텍스트 + Spinner 아이콘
   isStreaming=false → 활성 + "질문하기" + Send 아이콘
   ```

2. **스트리밍 중 카드 영역:**
   ```
   SSE 수신 시작 → 카드 4개 영역에 Skeleton UI 표시
   스트리밍 텍스트 누적 → streamBuffer를 "생성 중..." 영역에 실시간 렌더
   스트리밍 완료 + JSON 파싱 → 실제 beginner/example/advanced/summary 4카드 전환
   ```

   **Skeleton 카드 예시:**
   ```tsx
   {isStreaming ? (
     <div className="space-y-3">
       <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
       <div className="h-20 animate-pulse rounded-[24px] bg-slate-100" />
     </div>
   ) : (
     <CardContent card={currentQuestion} />
   )}
   ```

3. **스트리밍 실시간 텍스트 표시 (선택):**
   JSON 완성 전 중간 텍스트를 표시하면 체감 속도가 올라감.
   ```tsx
   {isStreaming && streamBuffer && (
     <div className="rounded-[24px] bg-violet-50 px-5 py-4 text-sm text-violet-700">
       <Spinner size="sm" className="mb-2" />
       <p className="font-mono text-xs opacity-60">{streamBuffer}</p>
     </div>
   )}
   ```

4. **질문 전송 후 textarea 클리어:** 질문을 보낸 즉시 입력창 비우되 `pendingQuestion`에 보존.

5. **에러 처리:**
   ```tsx
   {aiError && (
     <div className="rounded-[24px] bg-rose-50 px-5 py-4 text-sm text-rose-700">
       AI 응답 생성에 실패했어요. 다시 시도해 주세요.
     </div>
   )}
   ```

---

### 6-2. 에세이 피드백 로딩 UI

**현재 상태:**
- `teacher/assignments/[id]` 피드백 모달(M-T04)에 "AI 초안 생성" 버튼 자체가 없음
- 버튼 추가 + 로딩 UI 모두 신규 작업

**추가해야 할 상태:**
```typescript
const [isDraftGenerating, setIsDraftGenerating] = useState(false)
const [draftError, setDraftError] = useState<string | null>(null)
```

**UI 구현 명세:**

1. **"AI 초안 생성" 버튼 (피드백 textarea 위):**
   ```
   기본 → "AI 초안 생성" + Sparkles 아이콘, 연보라 색상
   생성 중 → disabled + Spinner + "초안 생성 중..." 텍스트 (약 3~8초 소요 안내)
   완료 → textarea에 자동 채움, 버튼 원상복귀
   실패 → 버튼 원상복귀 + 에러 메시지
   ```

2. **textarea 로딩 상태:**
   ```
   isDraftGenerating=true → textarea placeholder를 "AI가 피드백 초안을 작성 중이에요..."로 변경
   isDraftGenerating=true → textarea disabled + 배경 살짝 어둡게
   ```

3. **소요 시간 안내 문구:**
   ```tsx
   {isDraftGenerating && (
     <p className="text-xs text-slate-400">보통 3~8초 걸려요.</p>
   )}
   ```

---

### 6-3. 성장 리포트 로딩 UI

**현재 상태:**
- `onClick={() => setGrowthReady(true)}` — API 호출 없음, 즉시 처리
- 로딩 상태 없음, 버튼 disabled 없음
- `ReportsPage`는 완전 하드코딩

**추가해야 할 상태:**
```typescript
const [isGenerating, setIsGenerating] = useState(false)
const [generateError, setGenerateError] = useState<string | null>(null)
```

**UI 구현 명세:**

1. **"AI 성장 평가 생성" 버튼:**
   ```
   기본 → "AI 성장 평가 생성" + Sparkles 아이콘
   생성 중 → disabled + Spinner + "리포트 생성 중..."
   생성 완료 → growthReady=true, API 응답 데이터로 growth 필드 교체
   실패 → 에러 메시지 toast 또는 인라인 표시
   ```

2. **성장 평가 영역 Skeleton:**
   ```tsx
   {isGenerating ? (
     <div className="space-y-2">
       <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
       <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
       <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
     </div>
   ) : growthReady ? (
     <p className="text-sm leading-7 text-slate-700">{report.growth}</p>
   ) : (
     <p className="text-sm text-slate-400">버튼을 눌러 AI 성장 평가를 생성하세요.</p>
   )}
   ```

3. **학생/월 선택 후 기존 리포트 있으면 자동 로드:**
   - `GET /api/reports?studentId=&monthStr=` 로 조회
   - 있으면 growth 즉시 표시 (생성 불필요)
   - 없으면 "아직 생성된 리포트가 없어요" + 생성 버튼 활성

---

### 6-4. Whisper 녹음 변환 로딩 UI

**현재 상태:**
- `uploadProgress` 상태와 `ProgressBar` 컴포넌트가 이미 있음 ✅
- 단, 진행률이 `Math.min(current + 40, 100)` mock — 실제 polling으로 교체 필요
- 버튼 disabled 없음, 파일 업로드 실제 구현 없음

**실제 구현 흐름 + UI:**

```
단계 1 — 파일 선택:
  <input type="file" accept=".m4a,.mp3,.wav,.webm" />
  파일 선택 후 파일명 + 크기 표시
  25MB 초과 시 즉시 에러 ("파일이 너무 커요. 25MB 이하만 업로드 가능해요.")

단계 2 — 수업 선택:
  드롭다운으로 최근 수업 목록 (GET /api/lessons)
  미선택 시 업로드 버튼 비활성

단계 3 — 업로드 중 (POST 전송):
  ProgressBar value=10 (업로드 시작)
  파일 전송 완료 → API에서 RecordingSummary id 반환
  ProgressBar value=30

단계 4 — Whisper 변환 중 (polling):
  5초마다 GET /api/recordings/[id]
  status === 'PROCESSING' && progress 값으로 ProgressBar 업데이트
  progress 값: API에서 30(Whisper시작) → 60(Whisper완료) → 80(Claude요약중) → 100(완료)
  ProgressBar 색상: 진행 중 = indigo, 완료 = emerald, 실패 = rose

단계 5 — 완료:
  status === 'COMPLETED' → polling 중단
  ProgressBar value=100, emerald 색상
  summary/questions/nextPoints 렌더링
  "요약 완료" StatusBadge 표시

단계 6 — 실패:
  status === 'FAILED' → polling 중단
  ProgressBar 숨김
  에러 메시지 + "다시 시도" 버튼
```

**추가해야 할 상태:**
```typescript
const [file, setFile] = useState<File | null>(null)
const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)
const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'processing' | 'done' | 'failed'>('idle')
const [progress, setProgress] = useState(0)
const [recordingId, setRecordingId] = useState<string | null>(null)
const [result, setResult] = useState<RecordingSummary | null>(null)
```

**polling 구현:**
```typescript
useEffect(() => {
  if (uploadState !== 'processing' || !recordingId) return
  const interval = setInterval(async () => {
    const res = await fetcher(`/api/recordings/${recordingId}`)
    setProgress(res.data.progress)
    if (res.data.status === 'COMPLETED') {
      setResult(res.data)
      setUploadState('done')
    } else if (res.data.status === 'FAILED') {
      setUploadState('failed')
    }
  }, 5000)
  return () => clearInterval(interval)
}, [uploadState, recordingId])
```

---

### 6-5. 복습 자동 생성 로딩 UI

**현재 상태:**
- `teacher/progress` 페이지에서 수업 목록 표시, "복습 생성" 버튼 없음
- 로딩 UI 전혀 없음

**추가해야 할 상태 (수업 행별 버튼):**
```typescript
const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null)
```

**UI 구현 명세:**

1. **수업 목록 각 행 우측 "복습 생성" 버튼:**
   ```
   기본 → "복습 생성" 버튼
   클릭 시 → 해당 행 버튼만 Spinner + "생성 중..." (다른 행은 정상)
   완료 → "생성 완료" + 체크 아이콘, 2초 후 원상복귀
   실패 → "재시도" 버튼
   ```

2. **생성 소요 안내:**
   - 버튼 클릭 시 툴팁 또는 인라인 문구: "학생 수에 따라 5~15초 걸려요."

3. **생성 완료 후 student/review 에서 확인:**
   - 강사 화면에서 직접 미리보기는 제공 안 해도 됨
   - "생성 완료 — 학생 복습 탭에서 확인하세요." 메시지로 충분

---

### 6-6. 이탈 예측 배치 로딩 UI

**특성:** Vercel Cron이 자동 실행 → 교사/어드민이 직접 트리거하지 않음.
UI는 **결과 표시**에 집중.

**현재 상태:**
- `admin/churn`, `teacher/churn` 페이지가 실데이터 연결되어 있음 (SWR)
- 배치 실행 시각 표시 (`ChurnPrediction.calculatedAt`) 이미 있음

**추가할 것:**

1. **수동 재계산 버튼 (어드민 전용):**
   ```
   POST /api/churn/batch → 수동 트리거 가능
   버튼: "이탈 예측 갱신" → 클릭 시 Spinner + "계산 중..." (10~30초 예상)
   완료 → SWR mutate로 목록 갱신
   ```

2. **마지막 계산 시각 표시:**
   ```tsx
   <p className="text-xs text-slate-400">
     마지막 계산: {formatKoreanDateTime(latestCalculatedAt)}
   </p>
   ```

3. **로딩 중 목록 Skeleton:**
   SWR isLoading=true 동안 테이블 행에 Skeleton 표시 (현재 미구현).
   ```tsx
   {isLoading
     ? Array.from({ length: 5 }).map((_, i) => (
         <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
       ))
     : items.map(...)}
   ```

---

### 6-7. 민원 AI 초안 로딩 UI

**현재 상태:**
- `admin-complaints-manager.tsx`에 `isSaving` 상태와 LoaderCircle 스피너 이미 있음 ✅
- `aiDraft` textarea가 이미 있음 ✅
- 단, "AI 초안 생성" 버튼이 없음 — 수동 입력만 가능

**추가해야 할 상태:**
```typescript
const [isDraftGenerating, setIsDraftGenerating] = useState(false)
```

**UI 구현 명세 (기존 모달에 추가):**

1. **aiDraft textarea 위에 버튼 추가:**
   ```tsx
   <button
     disabled={isDraftGenerating}
     onClick={handleGenerateDraft}
     className="..."
   >
     {isDraftGenerating
       ? <><Spinner size="sm" /> 초안 생성 중...</>
       : <><Sparkles className="h-4 w-4" /> AI 초안 생성</>}
   </button>
   ```

2. **textarea 상태:**
   ```
   isDraftGenerating=true → disabled + placeholder="AI가 초안을 작성 중이에요..."
   완료 → textarea에 aiDraft 자동 채움 + 포커스
   ```

3. **이미 isSaving 패턴이 잘 구현되어 있으므로** isDraftGenerating도 동일 패턴으로 추가.

---

### 로딩 UI 전체 체크리스트

| 기능 | 버튼 disabled | Spinner | Skeleton/Progress | 에러 표시 | 소요시간 안내 |
|------|-------------|---------|------------------|---------|------------|
| Copilot 질문 전송 | [ ] | [ ] | [ ] Skeleton 카드 | [ ] | 불필요 (SSE 실시간) |
| 에세이 피드백 초안 | [ ] | [ ] | [ ] textarea disabled | [ ] | [ ] "3~8초" |
| 성장 리포트 생성 | [ ] | [ ] | [ ] Skeleton 3줄 | [ ] | [ ] "5~10초" |
| Whisper 녹음 업로드 | [ ] | [ ] | [x] ProgressBar 있음 | [ ] | [ ] polling 기반 |
| Whisper polling 갱신 | — | — | [ ] ProgressBar 실연동 | [ ] | 자동 |
| 복습 자동 생성 | [ ] | [ ] | 불필요 | [ ] | [ ] "5~15초" |
| 이탈 예측 수동 갱신 | [ ] | [ ] | [ ] 목록 Skeleton | [ ] | [ ] "10~30초" |
| 민원 AI 초안 | [ ] | [x] 패턴 있음 | [ ] textarea | [ ] | 불필요 (3초 내) |

---

## 구현 순서 (권장)

```
1. 공통 인프라 (claude.ts, openai.ts, prompts.ts)
2. Copilot sessions route 재작성 (필드 수정)
3. Copilot questions route 재작성 (Claude SSE)
4. useCopilot 훅 + CopilotPanel UI
5. 에세이 피드백 route + UI 버튼 연결
6. 성장 리포트 route Claude 연결 + UI 연결
7. 민원 AI 초안 route + UI 버튼 연결
8. 복습 자동 생성 route + UI 버튼 연결
9. Whisper 녹음 route 재작성 + UI 연결
10. 이탈 예측 배치 route + vercel.json Cron
```

---

## 결과물

- AI Copilot 실시간 대화 (Claude SSE, 4카드 응답)
- 에세이 자동 피드백 초안 (교사 확정)
- 성장 리포트 자연어 생성 (Claude)
- 음성 수업 녹음 텍스트 변환 + 요약 (Whisper + Claude)
- 수업별 복습 자동 출제 (Claude, 4지선다 3문제)
- 이탈 위험 학생 자동 계산 (일일 Cron)
- 민원 AI 응답 초안 (Claude, 어드민 확정)
