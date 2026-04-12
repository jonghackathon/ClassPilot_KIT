# Step 5: Student 기능 (과제제출, 출결조회, 복습, Q&A)

**선행 조건:** Step 4 완료 (과제/커리큘럼 존재해야 학생이 제출/복습 가능)
**작업 항목 수:** 12개
**예상 소요:** 1.5일

---

## 목표

학생이 과제 제출, 출석 확인, 복습 기록, QnA 질문을 할 수 있도록 한다.
강사가 QnA 답변을 할 수 있도록 한다.

---

## 도메인별 작업

### 5-1. 과제 제출 (Assignment Submission)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/assignments/[id]/submit/route.ts` | POST — 과제 제출 |
| 2 | `src/app/api/assignments/[id]/submit/history/route.ts` | POST (자동저장), GET (이력 조회) |
| 3 | `src/lib/validations/submission.ts` | Zod 스키마 |

**화면 연결:** `student/assignments`, `student/assignments/[id]`

### 5-2. 출결 조회 (Attendance View — read-only)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/students/attendance/route.ts` | GET — 본인 출석 (월별) |

**화면 연결:** `student/attendance` — 달력 월 이동

### 5-3. 복습 (Review)

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/review/route.ts` | GET — 복습 목록 |
| 2 | `src/app/api/ai/review/[id]/read/route.ts` | PATCH — 읽음 처리 |
| 3 | `src/hooks/useReview.ts` | SWR wrapper |
| 4 | `src/lib/validations/review.ts` | Zod 스키마 |

**화면 연결:** `student/review`, `student/review/[id]`

### 5-4. Q&A

| # | 파일 | 작업 |
|---|------|------|
| 1 | `src/app/api/ai/bot/questions/route.ts` | GET (목록), POST (질문 전송) |
| 2 | `src/hooks/useQnA.ts` | SWR wrapper |
| 3 | `src/lib/validations/qna.ts` | Zod 스키마 |

**화면 연결:** `student/qna`

---

## 연관 모달 (1건)

| # | 모달 | 화면 | 설계서 ID |
|---|------|------|----------|
| 1 | 과제 제출 확인 | student/assignments/[id] | M-S01 |

---

## 연관 인터랙션 (8건)

| # | 항목 | 화면 | 구현 방법 |
|---|------|------|---------|
| 1 | 탭 필터 (미제출/제출완료) | student/assignments | 상태 → API 재요청 |
| 2 | 과제 자동저장 (5분) | student/assignments/[id] | setInterval + API POST |
| 3 | AI 사용 여부 토글 | student/assignments/[id] | useState + radio |
| 4 | 달력 월 이동 | student/attendance | year/month 상태 + API 재요청 |
| 5 | 복습 읽음 처리 | student/review | 클릭 → API PATCH |
| 6 | 퀴즈 다음 문제 | student/review/[id] | 배열 인덱스 상태 + [다음] 버튼 |
| 7 | 질문 피드백 (도움됐어요/아니요) | student/qna | 클릭 → API PATCH |
| 8 | 검색 + 필터 | student/assignments | debounce + API 쿼리 |

---

## 결과물

- 학생이 과제 제출, 출석 확인, 복습 기록, QnA 질문 가능
- 강사가 QnA 답변 가능
- `student/home` 하드코딩 → 실제 API 연동
