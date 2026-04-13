# Step 6: AI 연동 (코파일럿, 에세이 피드백, 성장보고서, Whisper, 복습생성, 이탈예측, 민원초안)

**선행 조건:** Step 5 완료
**모델:** Claude Sonnet (`claude-sonnet-4-6`) / OpenAI Whisper (`whisper-1`)
**환경변수:**
```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
CRON_SECRET=     # 이탈 예측 배치 Cron 인증용
```

---

## 0. 사전 결정 사항 (작업 전 먼저 확정)

### 0-1. API 네임스페이스 확정

현재 `/src/app/api/ai/` 하위에 `bot`, `churn`, `complaint`, `copilot`, `recording`, `review` 6개 빈 디렉토리가 존재한다.
실제 라우트는 `/api/copilot`, `/api/recordings`, `/api/reports/generate` 등 canonical 경로에 이미 있다.
**두 경로를 혼용하면 API 계층이 중복된다.**

**결정: canonical 경로로 통일한다.**

| 기능 | 사용할 경로 | 이유 |
|------|-----------|------|
| Copilot | `/api/copilot/*` | 기존 route 파일 있음 (재작성) |
| 녹음 변환 | `/api/recordings/*` | 기존 route 파일 있음 (재작성) |
| 성장 리포트 | `/api/reports/generate` | 기존 route 파일 있음 (AI 연결) |
| 복습 생성 | `/api/reviews/generate` | 신규, reviews 네임스페이스 통일 |
| 이탈 예측 배치 | `/api/churn/batch` | 신규, churn 네임스페이스 통일 |
| 민원 AI 초안 | `/api/complaints/[id]/ai-draft` | 신규, complaints 네임스페이스 통일 |
| 에세이 피드백 | `/api/ai/essay-feedback` | 신규, 순수 AI 기능이라 /api/ai 사용 |

**후속 조치:** `/api/ai/` 하위 빈 디렉토리 6개(bot/churn/complaint/copilot/recording/review) 삭제.

### 0-2. SDK 설치 (현재 미설치)

`package.json`에 AI SDK가 없다. 작업 전 반드시 설치.

```bash
npm install @anthropic-ai/sdk openai
```

---

## 전체 AI 기능 맵

| # | 기능 | 트리거 | 모델 | 저장 필드 | 현재 route 상태 | 현재 화면 상태 |
|---|------|--------|------|---------|--------------|-------------|
| 6-1 | AI Copilot | 교사 수업 중 질문 | Claude JSON MVP | `CopilotQuestion` | 있음, 전면 재작성 필요 | 하드코딩 |
| 6-2 | 에세이 피드백 | 교사 피드백 초안 요청 | Claude | `Submission.teacherFeedback` | 없음, 신규 | 버튼 없음 |
| 6-3 | 성장 리포트 | 어드민/교사 월별 생성 | Claude | `ReportData` | **있음**, AI 호출만 연결 | 하드코딩 |
| 6-4 | Whisper 녹음 변환 | 교사 음성 파일 업로드 | Whisper+Claude | `RecordingSummary` | 있음, 전면 재작성 필요 | 하드코딩 |
| 6-5 | 복습 자동 생성 | 교사 수업 후 생성 | Claude | `ReviewSummary` | 없음, 신규 | 버튼 없음 |
| 6-6 | 이탈 예측 배치 | Vercel Cron 일1회 | 규칙 기반 | `ChurnPrediction` | 없음, 신규 | 화면 있음 |
| 6-7 | 민원 AI 초안 | 어드민 민원 응답 전 | Claude | `Complaint.aiDraft` | 없음, 신규 | 버튼 없음 |

---

## 1. 공통 인프라 (가장 먼저)

### `src/lib/ai/claude.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'

export const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const CLAUDE_MODEL = 'claude-sonnet-4-6'
```

### `src/lib/ai/openai.ts`

```typescript
import OpenAI from 'openai'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
```

### `src/lib/ai/prompts.ts`

각 기능의 프롬프트를 함수로 관리. 수업 맥락(topic, summary 등)을 파라미터로 받아 조합.

```typescript
export function copilotPrompt(question: string, topic: string | null): string
export function essayFeedbackPrompt(assignmentTitle: string, content: string): string
export function reportPrompt(studentName: string, month: string, context: ReportContext): string
export function recordingSummaryPrompt(transcript: string, topic: string | null): string
export function reviewGenerationPrompt(weekNoteContent: string, topic: string | null): string
export function complaintDraftPrompt(complaintContent: string): string
```

---

## 2. 화면 구조 분리 (broken skeleton 수선과 동시 진행)

> `src/components/frontend/teacher-pages.tsx` (1150줄)에 Copilot, Recording 등이 하드코딩으로 묶여 있다.
> API를 붙이기 전에 전용 컴포넌트 파일로 분리해야 한다.
> `src/components/frontend/reports-page.tsx`도 하드코딩 상태다.
> **이 분리 작업을 6-1, 6-3, 6-4 API 작업과 동시에 진행한다.**

### 분리 대상

| 현재 위치 | 이동할 파일 | 대상 컴포넌트 |
|----------|-----------|-------------|
| `teacher-pages.tsx:455` | `src/components/teacher/copilot/teacher-copilot-landing-page.tsx` | `TeacherCopilotLandingPage` |
| `teacher-pages.tsx:489` | `src/components/teacher/copilot/teacher-copilot-session-page.tsx` | `TeacherCopilotSessionPage` |
| `teacher-pages.tsx:636` | `src/components/teacher/recording/teacher-recording-page.tsx` | `TeacherRecordingPage` |
| `teacher-pages.tsx:729` | `src/components/teacher/recording/teacher-recording-detail-page.tsx` | `TeacherRecordingDetailPage` |
| `reports-page.tsx:88` | `src/components/teacher/reports/reports-manager.tsx` | `ReportsPage` → `ReportsManager` |

분리 후 `teacher-pages.tsx`에서 해당 함수 제거. 각 페이지 파일(`page.tsx`)의 import 경로도 함께 수정.

---

## 6-1. AI Copilot (JSON MVP)

### 현재 route 버그 (전면 재작성)

#### `src/app/api/copilot/sessions/route.ts`

```
현재 버그:
- POST body/create data에 classId, title, context 사용 → 모델에 없음
- status: 'READY' → enum에 없음

실제 CopilotSession 모델: lessonId(필수), teacherId, topic, status(ACTIVE|COMPLETED)

수정 후 POST body: { lessonId: string, topic?: string }
수정 후 create data:
  lessonId: body.lessonId,
  teacherId: session.user.id,
  topic: body.topic ?? null,
  status: 'ACTIVE'

수정 후 GET 필터:
- classId 필터 → lessonId 필터로 교체
- status 타입: 'ACTIVE' | 'COMPLETED'
```

#### `src/app/api/copilot/questions/route.ts`

```
현재 버그:
- copilotSession.context 참조 → context 필드 없음 (lesson.topic으로 교체)
- create data에 answer, used 필드 → 모델에 없음
- status: 'IN_PROGRESS' 업데이트 → enum에 없음
- buildCopilotAnswer() mock → Claude JSON 응답으로 교체

실제 CopilotQuestion 모델: sessionId, question, beginner, example, advanced, summary, usedCards[]

수정 후 흐름:
1. CopilotSession 조회 시 lesson.topic 포함 join
2. Claude 호출 (4카드 JSON 응답)
3. 응답 파싱 후 CopilotQuestion.create (beginner/example/advanced/summary)
4. 세션 화면은 저장된 카드와 히스토리를 다시 조회
```

**Claude 응답 JSON:**
```json
{
  "beginner": "초보자 핵심 설명",
  "example": "구체적 예시나 코드",
  "advanced": "심화 내용 또는 확장 질문",
  "summary": "한 줄 요약"
}
```

#### `src/app/api/copilot/sessions/[id]/route.ts`

```
현재 버그:
- PATCH body에서 title, context 업데이트 시도 → 모델에 없음
- status 타입: 'READY' | 'IN_PROGRESS' | 'COMPLETED' → ACTIVE | COMPLETED

수정: title/context 제거, status를 'ACTIVE' | 'COMPLETED'로 수정
```

### 신규 작업

#### `src/hooks/useCopilot.ts`

```typescript
// 세션 목록 (lessonId 기준)
function useCopilotSessions(lessonId?: string)

// 세션 상세 (questions 포함)
function useCopilotSession(sessionId?: string)
```

#### `src/components/teacher/copilot/teacher-copilot-session-page.tsx`

분리 후 실데이터 연결. 구성:
- 상단: `lesson.topic` 표시 (GET /api/lessons/[lessonId])
- 질문 입력창 + 전송 버튼
- 요청 중: 버튼 disabled + Spinner
- 완료: beginner/example/advanced/summary 탭 카드 UI
- 각 카드 복사 버튼: `navigator.clipboard.writeText`
- 이전 질문 히스토리 스크롤
- 세션 종료 버튼 → 확인 모달(M-T05) → PATCH status: 'COMPLETED'

**화면 연결:** `teacher/copilot/[lessonId]/page.tsx`

```typescript
// lessonId prop 전달하도록 수정
export default async function Page({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  return <TeacherCopilotSessionPage lessonId={lessonId} />
}
```

**`teacher/copilot/page.tsx` (목록):**
현재 하드코딩 → 오늘 수업 목록 실연결.

**lessons API 추가 작업 필요:**

| 필요 기능 | 현재 상태 | 처리 방법 |
|---------|---------|---------|
| 세션 페이지 — lesson.topic 단건 조회 | `GET /api/lessons/[id]` 없음 | `src/app/api/lessons/[id]/route.ts` 신규 추가 |
| 랜딩 페이지 — 오늘 수업 목록 | `GET /api/lessons`에 date 필터 없음 | 기존 route에 `from`, `to` 쿼리 파라미터 추가 |

랜딩 페이지 호출 예시:
```
GET /api/lessons?from=2026-04-13&to=2026-04-13
```
`date=today` 같은 특수 키워드는 사용하지 않는다. `from`/`to`는 ISO date string으로 받아 Prisma `date: { gte, lte }` 필터로 처리.

### 로딩 UI

| 상태 | UI |
|------|-----|
| 전송 버튼 (생성 중) | disabled + Spinner + "생성 중..." |
| 카드 영역 (요청 중) | Skeleton 4개 |
| 완료 | 4카드 탭 렌더링 |
| 실패 | rose 배경 에러 메시지 + 재시도 버튼 |

---

## 6-2. 에세이 피드백

### `src/app/api/ai/essay-feedback/route.ts` — 신규

```
POST /api/ai/essay-feedback
권한: ADMIN, TEACHER
body: { submissionId: string, assignmentTitle: string, content: string }

1. Submission 조회 + 교사 담당 반 확인
2. Claude messages.create() 호출 (max_tokens: 800)
3. 응답 반환 (DB 저장 안 함 — 교사가 편집 후 확정)
```

**Claude 응답 JSON:**
```json
{
  "strengths": "잘된 점 2~3가지",
  "improvements": "개선할 점 2~3가지",
  "score": 85,
  "summary": "종합 한 줄 평"
}
```

**화면 연결:** `teacher/assignments/[id]` 피드백 작성 모달(M-T04)
- "AI 초안 생성" 버튼 → POST → textarea 자동 채움
- 교사 편집 후 "피드백 확정" → 기존 `PATCH /api/assignments/[id]/submissions/[submissionId]`

### 로딩 UI

```typescript
const [isDraftGenerating, setIsDraftGenerating] = useState(false)
```

| 상태 | UI |
|------|-----|
| 버튼 (생성 중) | disabled + Spinner + "초안 생성 중..." |
| textarea (생성 중) | disabled + placeholder "AI가 피드백 초안을 작성 중이에요..." |
| 소요 시간 안내 | "보통 3~8초 걸려요." |
| 완료 | textarea 자동 채움 |
| 실패 | 에러 메시지 인라인 표시 |

---

## 6-3. 성장 리포트 AI 연결

### 현재 상태 (기존 route 확장)

아래 3개 파일이 **이미 존재**한다. 신규 생성 불필요.

| 파일 | 상태 |
|------|------|
| `src/app/api/reports/route.ts` | GET(목록)/POST — **버그 있음, 수정 필요** |
| `src/app/api/reports/[id]/route.ts` | GET/PATCH/DELETE ✅ 완성 |
| `src/app/api/reports/generate/route.ts` | POST ✅ 데이터 수집 완성, **AI 호출만 없음** |

**`reports/route.ts` POST 버그:**
POST 핸들러에서 `teacherStudentIds`를 선언하지 않고 참조한다.
TEACHER가 POST 요청 시 `ReferenceError: teacherStudentIds is not defined` 런타임 에러 발생.
AI 연결 전에 반드시 먼저 수정한다.

```typescript
// 수정: POST 핸들러 내부 상단에 추가
const teacherStudentIds =
  session.user.role === 'TEACHER' ? await getTeacherStudentIds(session.user.id) : []
```

### 수정 내용 (`src/app/api/reports/generate/route.ts`)

현재 코드: 출결/과제/WeekNote 데이터를 수집 후 단순 문자열 조합으로 `growth`, `comment` 생성.

```typescript
// 현재 (단순 조합)
const growth = weekNotes.map(...).join(' / ')
const comment = `${student.name} 수강생 월간 리포트 초안`
```

**수정: 수집된 데이터를 그대로 Claude에 넘겨 자연어 생성으로 교체.**

```
데이터 수집 로직: 기존 유지 (attendances, submissions, weekNotes)
Claude 호출 추가:
  - 입력: 학생명, 월, 출결 집계, 과제 집계, WeekNote 내용
  - 응답: { comment, growth } 자연어 서술
  - max_tokens: 600
저장:
  - ReportData.comment ← Claude 생성 종합 코멘트
  - ReportData.growth ← Claude 생성 성장 서술
  - ReportData.attendanceSummary ← 기존 집계 로직 유지
  - ReportData.assignmentSummary ← 기존 집계 로직 유지
```

### 화면 연결 (`src/components/teacher/reports/reports-manager.tsx`)

`reports-page.tsx`에서 분리 후 실데이터 연결:
- 학생 선택 드롭다운 → `GET /api/reports?studentId=` 기존 리포트 조회
- 기존 리포트 있으면 즉시 표시 (생성 버튼 비활성)
- 없으면 "AI 성장 평가 생성" 버튼 활성 → `POST /api/reports/generate`

### 로딩 UI

```typescript
const [isGenerating, setIsGenerating] = useState(false)
```

| 상태 | UI |
|------|-----|
| 버튼 (생성 중) | disabled + Spinner + "리포트 생성 중..." |
| 성장 평가 영역 (생성 중) | Skeleton 3줄 |
| 소요 시간 안내 | "보통 5~10초 걸려요." |
| 완료 | growth 텍스트 렌더 + "AI 평가 생성됨" StatusBadge |
| 실패 | 에러 메시지 + 재시도 버튼 |

---

## 6-4. Whisper 녹음 변환

### 현재 route 버그 (전면 재작성)

#### `src/app/api/recordings/route.ts`

```
현재 버그:
- POST create data에 classId, teacherId, title, originalFileName → 모델에 없음
- keyPhrases, actionItems → 모델에 없음
- status: 'COMPLETED' 즉시 → 실제는 PROCESSING → COMPLETED 흐름 필요
- GET 필터에 'UPLOADED' → enum에 없음 (PROCESSING|COMPLETED|FAILED)
- Whisper API 호출 없음 (transcript를 body로 받는 mock)

실제 RecordingSummary 모델:
  id, lessonId(필수), audioUrl, transcript, summary, questions,
  nextPoints, status(PROCESSING|COMPLETED|FAILED), progress(0~100)

수정 후 POST body: multipart/form-data { lessonId: string, file: File }

수정 후 흐름:
1. lessonId로 Lesson 조회 (topic 포함, academy 확인)
2. 업로드 파일을 `/public/uploads/recordings`에 저장
3. Whisper 호출 → transcript 생성
4. transcript 기반 summary/questions/nextPoints 생성
5. RecordingSummary.create → status: COMPLETED 또는 FAILED
```

**Claude 녹음 요약 응답 JSON:**
```json
{
  "summary": "수업 핵심 내용 요약 (3~5문장)",
  "questions": "학생들이 자주 물어본 내용 / 이해 부족 부분",
  "nextPoints": "다음 수업 준비사항 또는 심화 포인트"
}
```

#### `src/app/api/recordings/[id]/route.ts`

GET 단건 조회 — 상세 화면 재조회용. `audioUrl`, `transcript`, `summary`, `questions`, `nextPoints`를 반환한다.

### 화면 연결 (`src/components/teacher/recording/teacher-recording-page.tsx`)

분리 후 실데이터 연결. 현재 구현 기준 흐름:

```
1. 수업 선택: GET /api/lessons (최근 수업 드롭다운)
2. 파일 선택: accept=".m4a,.mp3,.wav,.webm", 25MB 제한
3. 업로드: multipart POST → 녹음 레코드 생성
4. Whisper 전사 결과와 요약 저장
5. 상세 화면에서 transcript, summary, questions, nextPoints, audio 재생 확인
```

### 로딩 UI

| 단계 | ProgressBar 값 | 색상 |
|------|--------------|------|
| 업로드 중 | 10~30 | indigo |
| Whisper 전사 중 | 30~70 | indigo |
| 완료 | 100 | emerald |
| 실패 | — | rose 에러 메시지 |

> **메모:** 현재 구현은 업로드 요청 안에서 전사와 요약까지 처리하는 단순한 방식이다.
> queue/background job 기반 비동기 파이프라인은 후속 고도화로 분리한다.

---

## 6-5. 복습 자동 생성

### `src/app/api/reviews/generate/route.ts` — 신규

> `src/app/api/reviews/route.ts`는 수동 CRUD용. 생성 route를 별도 분리.

**스키마 선행 작업 필요:**

현재 `ReviewSummary`에 `@@unique([lessonId, studentId])`가 없다.
같은 수업에 같은 학생 복습이 중복 생성될 수 있어 upsert가 불가능하다.

**결정: `@@unique([lessonId, studentId])` 추가 + migration 실행.**

```prisma
// prisma/schema.prisma 수정
model ReviewSummary {
  // ... 기존 필드 유지 ...

  @@unique([lessonId, studentId])  // 추가
}
```

> 주의: `lessonId`가 `String?`(nullable)이므로 unique 제약은 lessonId가 null이 아닌 경우에만 적용된다.
> generate route는 lessonId를 필수로 받으므로 null 충돌 없음.
> 단, 기존 수동 POST로 lessonId 없이 생성된 레코드가 있다면 migration 전 데이터 확인 필요.

```bash
npx prisma migrate dev --name add_review_summary_unique
```

```
POST /api/reviews/generate
권한: ADMIN, TEACHER
body: { lessonId: string, studentIds: string[] }

1. Lesson 조회 (topic, date)
2. WeekNote 조회 (content, studentReaction)
3. WeekNote 없으면 422 에러 ("수업 내용 기록이 없어 복습 생성 불가")
4. Claude 호출 → { summary, quiz[], preview }
5. studentIds 각각에 ReviewSummary upsert (@@unique([lessonId, studentId]) 기준)
6. 생성 목록 반환
```

**Claude 복습 응답 JSON:**
```json
{
  "summary": "이번 수업 핵심 3줄 요약",
  "quiz": [
    {
      "question": "질문",
      "choices": ["A. 보기1", "B. 보기2", "C. 보기3", "D. 보기4"],
      "answer": "A",
      "explanation": "정답 해설"
    }
  ],
  "preview": "다음 수업 예고 (1~2문장)"
}
```

`ReviewSummary.quiz`는 `Json?` 타입이므로 quiz 배열 그대로 저장.

**화면 연결:** `teacher/progress` 수업 목록 각 행 우측 "복습 생성" 버튼

### 로딩 UI

```typescript
const [generatingLessonId, setGeneratingLessonId] = useState<string | null>(null)
```

| 상태 | UI |
|------|-----|
| 해당 행 버튼 (생성 중) | disabled + Spinner + "생성 중..." (다른 행은 정상) |
| 소요 시간 안내 | "학생 수에 따라 5~15초 걸려요." |
| 완료 | 체크 아이콘 2초 표시 후 원상복귀 |
| 실패 | 해당 행에 에러 메시지 |

---

## 6-6. 이탈 예측 배치

### `src/app/api/churn/batch/route.ts` — 신규

```
POST /api/churn/batch
권한: ADMIN 또는 Cron 헤더 검증

헤더 검증:
  Authorization: Bearer ${CRON_SECRET} → 헤더 있으면 Cron, 없으면 ADMIN 세션 확인

body: {} (전체) 또는 { studentIds: string[] } (선택)

팩터별 점수 계산 (0~100, 높을수록 위험):
  attendanceFactor: (결석 + 지각×0.5) / 총수업 × 100
  homeworkFactor:   미제출 / 총과제 × 100
  accessFactor:     최근 2주 출석 없으면 100, 1주 없으면 50
  questionFactor:   최근 30일 질문 0건이면 40

score = attendanceFactor×0.4 + homeworkFactor×0.3 + accessFactor×0.2 + questionFactor×0.1

level:
  score < 30  → SAFE
  score 30~59 → WARNING
  score ≥ 60  → DANGER

ChurnPrediction.create (이력 누적, upsert 아님)
반환: DANGER 학생 목록
```

**upsert 대신 create를 쓰는 이유:**
`ChurnPrediction`에는 `studentId`에 대한 `@@unique`가 없다.
모델에 `@@index([studentId, calculatedAt])`가 있고 `calculatedAt` 컬럼이 별도로 존재하는 것은
**일별 이력 누적이 설계 의도**임을 뜻한다.
기존 read API도 `orderBy: [{ calculatedAt: 'desc' }]`로 학생별 최신 1건을 읽는 구조다.
스키마 변경 없이 `create`만으로 구현 가능하며, 과거 예측 이력도 자동 보존된다.

```
```

### Vercel Cron 설정 (`vercel.json` 신규)

```json
{
  "crons": [{
    "path": "/api/churn/batch",
    "schedule": "0 1 * * *"
  }]
}
```

### 화면 연결

- `admin/churn`, `teacher/churn` 페이지는 이미 실데이터 연결됨 ✅
- 어드민 전용 "이탈 예측 갱신" 버튼 추가 (수동 트리거)
- 완료 후 SWR mutate로 목록 갱신

### 로딩 UI

| 상태 | UI |
|------|-----|
| 갱신 버튼 (실행 중) | disabled + Spinner + "계산 중..." |
| 소요 시간 안내 | "학생 수에 따라 10~30초 걸려요." |
| 마지막 계산 시각 | `ChurnPrediction.calculatedAt` 포맷 표시 |
| 목록 로딩 (SWR) | 행별 Skeleton |

---

## 6-7. 민원 AI 초안

### `src/app/api/complaints/[id]/ai-draft/route.ts` — 신규

```
POST /api/complaints/[id]/ai-draft
권한: ADMIN

1. Complaint 조회 (id + academyId 확인)
2. Claude 호출 (complaint.content 기반 정중한 답변 초안 생성)
3. Complaint.aiDraft 업데이트
4. 응답 반환
```

> `Complaint.aiDraft` 필드가 스키마에 이미 존재 ✅
> 기존 `complaints/[id]/respond/route.ts`는 aiDraft를 body로 받아 저장하는 구조라
> 위 route에서 AI 생성 후 저장, respond route에서 최종 확정으로 역할 분리.

### 화면 연결 (`admin-complaints-manager.tsx`)

현재 `isSaving` + LoaderCircle 스피너 패턴이 이미 잘 구현되어 있음 ✅
aiDraft textarea도 이미 있음 ✅

**추가할 것:** aiDraft textarea 위에 "AI 초안 생성" 버튼만 추가.

### 로딩 UI

```typescript
const [isDraftGenerating, setIsDraftGenerating] = useState(false)
```

| 상태 | UI |
|------|-----|
| 버튼 (생성 중) | disabled + Spinner + "초안 생성 중..." |
| textarea (생성 중) | disabled + placeholder "AI가 초안을 작성 중이에요..." |
| 완료 | textarea 자동 채움 + 포커스 |

---

## 작업 파일 목록

### SDK 설치

```bash
npm install @anthropic-ai/sdk openai
```

### 신규 생성

| 파일 | 내용 |
|------|------|
| `src/lib/ai/claude.ts` | Anthropic SDK 클라이언트 |
| `src/lib/ai/openai.ts` | OpenAI SDK 클라이언트 |
| `src/lib/ai/prompts.ts` | 프롬프트 템플릿 함수 |
| `src/app/api/ai/essay-feedback/route.ts` | 에세이 피드백 초안 |
| `src/app/api/lessons/[id]/route.ts` | Lesson 단건 조회 (Copilot 세션 페이지용) |
| `src/app/api/reviews/generate/route.ts` | 복습 자동 생성 |
| `src/app/api/churn/batch/route.ts` | 이탈 예측 배치 |
| `src/app/api/complaints/[id]/ai-draft/route.ts` | 민원 AI 초안 |
| `src/hooks/useCopilot.ts` | Copilot 훅 |
| `src/components/teacher/copilot/teacher-copilot-landing-page.tsx` | Copilot 목록 (분리) |
| `src/components/teacher/copilot/teacher-copilot-session-page.tsx` | Copilot 세션 (분리 + 실연결) |
| `src/components/teacher/recording/teacher-recording-page.tsx` | 녹음 목록 (분리 + 실연결) |
| `src/components/teacher/recording/teacher-recording-detail-page.tsx` | 녹음 상세 (분리) |
| `src/components/teacher/reports/reports-manager.tsx` | 리포트 (분리 + 실연결) |
| `vercel.json` | Cron Job 설정 |

### 수정 (전면 재작성)

| 파일 | 이유 |
|------|------|
| `src/app/api/copilot/sessions/route.ts` | Prisma 필드 불일치 (classId/title/context → lessonId/topic), status enum |
| `src/app/api/copilot/questions/route.ts` | context/answer/used 없음, mock 로직, 잘못된 status enum, SSE 미구현 |
| `src/app/api/recordings/route.ts` | Prisma 필드 불일치 전체, Whisper 미연결 |

### 수정 (일부)

| 파일 | 내용 |
|------|------|
| `src/app/api/copilot/sessions/[id]/route.ts` | title/context 제거, status enum 수정 |
| `src/app/api/reports/route.ts` | POST 핸들러 teacherStudentIds 선언 누락 버그 수정 |
| `src/app/api/reports/generate/route.ts` | Claude API 호출 추가 (데이터 수집 로직 유지) |
| `src/app/api/lessons/route.ts` | from/to 쿼리 파라미터 필터 추가 |
| `src/app/teacher/copilot/[lessonId]/page.tsx` | lessonId prop 전달 |
| `src/components/frontend/teacher-pages.tsx` | Copilot/Recording 컴포넌트 제거 (분리 후) |
| `prisma/schema.prisma` | ReviewSummary에 `@@unique([lessonId, studentId])` 추가 |

### 삭제

| 대상 | 이유 |
|------|------|
| `src/app/api/ai/bot/` | 빈 디렉토리 |
| `src/app/api/ai/churn/` | 빈 디렉토리 |
| `src/app/api/ai/complaint/` | 빈 디렉토리 |
| `src/app/api/ai/copilot/` | 빈 디렉토리 |
| `src/app/api/ai/recording/` | 빈 디렉토리 |
| `src/app/api/ai/review/` | 빈 디렉토리 |

---

## 로딩 UI 공통 사항

### Spinner 컴포넌트 추가

현재 `Spinner` 공통 컴포넌트가 없고 `LoaderCircle + animate-spin`을 각 파일에서 직접 사용 중.
`src/components/frontend/common.tsx`에 추가:

```typescript
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[size]
  return <LoaderCircle className={cx(cls, 'animate-spin text-indigo-500')} />
}
```

### 전체 체크리스트

| 기능 | 버튼 disabled | Spinner | Skeleton/Progress | 에러 표시 | 소요시간 안내 |
|------|-------------|---------|------------------|---------|------------|
| Copilot 질문 전송 | [ ] | [ ] | [ ] Skeleton 카드 4개 | [ ] | [ ] |
| 에세이 피드백 초안 | [ ] | [ ] | [ ] textarea disabled | [ ] | [ ] "3~8초" |
| 성장 리포트 생성 | [ ] | [ ] | [ ] Skeleton 3줄 | [ ] | [ ] "5~10초" |
| Whisper 업로드 | [ ] | [ ] | [x] ProgressBar 있음 | [ ] | [ ] |
| 복습 자동 생성 | [ ] | [ ] | 불필요 | [ ] | [ ] "5~15초" |
| 이탈 예측 갱신 | [ ] | [ ] | [ ] 목록 Skeleton | [ ] | [ ] "10~30초" |
| 민원 AI 초안 | [ ] | [x] 패턴 있음 | [ ] textarea | [ ] | 불필요 (3초 내) |

---

## 구현 순서 (권장)

```
1. SDK 설치 + 공통 인프라
   - npm install @anthropic-ai/sdk openai
   - src/lib/ai/claude.ts, openai.ts, prompts.ts 생성
   - 빈 /api/ai/ 하위 디렉토리 6개 삭제

2. 스키마 변경 + migration
   - ReviewSummary에 @@unique([lessonId, studentId]) 추가
   - npx prisma migrate dev --name add_review_summary_unique

3. Copilot route 전면 재작성 + lessons API 보강 + 화면 분리 (묶음)
   - sessions/route.ts, questions/route.ts, sessions/[id]/route.ts 재작성
   - lessons/route.ts에 from/to 필터 추가
   - lessons/[id]/route.ts 신규 추가
   - TeacherCopilotLandingPage, TeacherCopilotSessionPage 분리 + API 연결
   - Spinner 공통 컴포넌트 추가

4. Recording route 전면 재작성 + 화면 분리 (묶음)
   - recordings/route.ts, recordings/[id]/route.ts 재작성
   - TeacherRecordingPage, TeacherRecordingDetailPage 분리 + API 연결

5. Reports 버그 수정 + AI 연결 + 화면 분리 (묶음)
   - reports/route.ts POST 버그 수정 (teacherStudentIds 선언 추가)
   - reports/generate/route.ts Claude 호출 교체
   - ReportsPage → ReportsManager 분리 + API 연결

6. 에세이 피드백
   - api/ai/essay-feedback/route.ts 신규
   - 피드백 모달(M-T04)에 "AI 초안 생성" 버튼 추가

7. 민원 AI 초안
   - complaints/[id]/ai-draft/route.ts 신규
   - admin-complaints-manager.tsx에 버튼 추가

8. 복습 자동 생성
   - reviews/generate/route.ts 신규
   - teacher/progress 페이지에 "복습 생성" 버튼 추가

9. 이탈 예측 배치
   - churn/batch/route.ts 신규
   - vercel.json Cron 설정
   - admin/churn 페이지에 수동 갱신 버튼 추가
```

---

## 결과물

- AI Copilot 질문 응답 (Claude JSON MVP, 4카드 응답)
- 에세이 자동 피드백 초안 (교사 확정)
- 성장 리포트 자연어 생성 (Claude)
- 음성 수업 녹음 업로드 + Whisper 전사 + 요약
- 수업별 복습 자동 출제 (Claude, 4지선다 3문제)
- 이탈 위험 학생 자동 계산 (일일 Cron)
- 민원 응답 AI 초안 (Claude, 어드민 확정)
