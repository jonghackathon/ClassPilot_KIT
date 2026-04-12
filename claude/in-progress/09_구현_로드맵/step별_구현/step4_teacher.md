# Step 4: Teacher 기능 (과제, 커리큘럼, 진도, 메모, 봇)

**선행 조건:** Step 3 완료 (Users, Classes 존재 — 과제는 반/학생에 의존)
**작업 항목 수:** 20개
**예상 소요:** 2.5일

---

## 목표

강사가 과제 출제, 피드백 작성, 커리큘럼 편집, 진도 관리, 메모 작성, FAQ 봇 관리를 할 수 있도록 한다.

---

## 도메인별 작업

### 4-1. 과제 관리 + 피드백 (Assignments)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/assignments/route.ts` | GET (목록), POST (등록) |
| 2 | `src/app/api/assignments/[id]/route.ts` | GET (상세), PATCH (수정), DELETE |
| 3 | `src/app/api/assignments/[id]/feedback/route.ts` | POST — 피드백 작성 |
| 4 | `src/hooks/useAssignments.ts` | SWR wrapper |
| 5 | `src/lib/validations/assignments.ts` | Zod 스키마 |

**화면 연결:** `teacher/assignments`, `teacher/assignments/[id]`

### 4-2. 커리큘럼 (Curriculum)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/curricula/route.ts` | GET (목록), POST (생성) |
| 2 | `src/app/api/curricula/[id]/route.ts` | PATCH (수정), DELETE |
| 3 | `src/hooks/useCurriculum.ts` | SWR wrapper |
| 4 | `src/lib/validations/curriculum.ts` | Zod 스키마 |

**화면 연결:** `teacher/progress` — 커리큘럼 탭

### 4-3. 진도 + 주간 메모 (Progress + WeekNotes)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/lessons/route.ts` | GET — 수업 목록 |
| 2 | `src/app/api/lessons/[id]/progress/route.ts` | POST — 진도 기록 |
| 3 | `src/app/api/week-notes/route.ts` | GET, POST |
| 4 | `src/app/api/week-notes/[id]/route.ts` | PATCH, DELETE |
| 5 | `src/hooks/useProgress.ts` | SWR wrapper |

**화면 연결:** `teacher/progress`

### 4-4. 메모 (Memo)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/memo/route.ts` | GET, POST |
| 2 | `src/app/api/memo/[id]/route.ts` | PATCH, DELETE |
| 3 | `src/hooks/useMemo.ts` | SWR wrapper |

**화면 연결:** `teacher/memo` (4카테고리: STUDENT / CLASS / LESSON / REMINDER)

### 4-5. Bot/FAQ

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/bot/faq/route.ts` | GET, POST |
| 2 | `src/app/api/ai/bot/faq/[id]/route.ts` | PATCH, DELETE |
| 3 | `src/app/api/ai/bot/questions/[id]/answer/route.ts` | POST — 강사 답변 |

**화면 연결:** `teacher/bot` — 질문 목록, 강사 답변 전송, FAQ 등록

---

## 연관 모달 (3건)

| # | 모달 | 화면 | 설계서 ID |
|---|------|------|----------|
| 1 | 과제 등록 | teacher/assignments | M-T02 |
| 2 | 과제 이력 타임라인 | teacher/assignments/[id] | M-T03 |
| 3 | 피드백 작성 | teacher/assignments/[id] | M-T04 |

---

## 연관 인터랙션 (2건)

| # | 항목 | 화면 |
|---|------|------|
| 1 | 검색 + 필터/탭 전환 | teacher/assignments, teacher/bot |
| 2 | 이탈 목록 조회 (담당 반 한정) | teacher/churn |

---

## 결과물

- 강사가 과제 출제, 피드백 작성, 커리큘럼 편집, 진도 관리, 메모 작성 가능
- FAQ 봇 데이터 관리
- `teacher/dashboard` 하드코딩 → 실제 API 연동
