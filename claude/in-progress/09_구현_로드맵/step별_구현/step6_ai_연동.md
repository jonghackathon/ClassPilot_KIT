# Step 6: AI 연동 (코파일럿 SSE, 에세이 피드백, 성장보고서, Whisper, 이탈예측 배치)

**선행 조건:** Step 5 완료 (과제/출석/복습 데이터가 존재해야 AI가 분석 가능)
**작업 항목 수:** 12개
**예상 소요:** 3일

---

## 목표

AcadeMind의 핵심 차별화 기능. Claude API + Whisper API 연동으로 AI 기능 전체를 완성한다.

---

## 기능별 작업

### 6-1. AI Copilot (SSE 스트리밍)

**모델:** Claude Sonnet

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/copilot/session/route.ts` | POST — 세션 생성 |
| 2 | `src/app/api/ai/copilot/ask/route.ts` | POST (SSE) — 질문 → 4카드 생성 |
| 3 | `src/app/api/ai/copilot/questions/[id]/use/route.ts` | PATCH — 카드 사용 기록 |
| 4 | `src/hooks/useCopilot.ts` | SSE EventSource 관리 |
| 5 | `src/components/ai/CopilotPanel.tsx` | 입력 바 + SSE 스트리밍 + 복사 기능 |

**화면 연결:** `teacher/copilot/[lessonId]`

**인터랙션:**
- 코파일럿 질문 입력 + SSE 전송
- `[복사]` 버튼 → `navigator.clipboard.writeText`

### 6-2. 에세이 피드백

**모델:** Claude Sonnet

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/essay-feedback/route.ts` | POST — Claude API 호출 |
| 2 | `src/components/ai/EssayFeedback.tsx` | 피드백 UI |

**화면 연결:** `teacher/assignments/[id]` — 피드백 모달 내 AI 초안

### 6-3. 성장 리포트 자동 생성

**모델:** Claude Sonnet

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/growth-report/route.ts` | POST — 성장 리포트 생성 |

**화면 연결:** `admin/students/[id]` — 리포트 탭

### 6-4. 녹음 파일 Whisper 변환

**모델:** OpenAI Whisper

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/recording/upload/route.ts` | POST — 파일 업로드 + 변환 |
| 2 | `src/app/api/ai/recording/[id]/route.ts` | GET — 요약 결과 조회 |

**화면 연결:** `teacher/recording`

**인터랙션:** File input + FormData + 프로그레스 바

### 6-5. 복습 문제 자동 생성

**모델:** Claude Sonnet

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/review/generate/route.ts` | POST — 복습 요약 생성 |

**화면 연결:** `student/review` — AI 생성 복습 카드

### 6-6. 이탈 예측 배치 (Churn Prediction)

**모델:** 규칙 기반 + Claude 해석

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/churn/calculate/route.ts` | POST — 일일 배치 계산 (Vercel Cron) |
| 2 | `src/app/api/ai/churn/events/route.ts` | POST — 이탈 처리 이벤트 |

**화면 연결:** `admin/churn`, `teacher/churn`

### 6-7. 민원 AI 초안

**모델:** Claude Sonnet

| # | 파일 | 작업 |
|---|------|------|
| 1 | 민원 응답 API에 AI 초안 필드 추가 | `src/app/api/ai/complaint/route.ts` 확장 |

**화면 연결:** `admin/complaints` — 응답 작성 모달 내 AI 초안

---

## 공통 인프라

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/lib/ai/claude.ts` | Claude API 클라이언트 |
| 2 | `src/lib/ai/openai.ts` | Whisper API 클라이언트 |
| 3 | `src/lib/ai/prompts.ts` | 프롬프트 템플릿 |

---

## 연관 모달 (1건)

| # | 모달 | 화면 | 설계서 ID |
|---|------|------|----------|
| 1 | 코파일럿 종료 확인 | teacher/copilot/[lessonId] | M-T05 |

---

## 환경변수 필요

```env
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

---

## 결과물

- AI Copilot 실시간 대화 (SSE 스트리밍)
- 에세이 자동 피드백
- 성장 리포트 화면 생성
- 음성 녹음 텍스트 변환
- 복습 문제 자동 출제
- 이탈 위험 학생 알림 (일일 배치)
- 민원 응답 AI 초안
