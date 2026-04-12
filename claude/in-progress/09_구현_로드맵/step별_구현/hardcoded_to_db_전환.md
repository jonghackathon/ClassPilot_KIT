# 프론트 데이터 하드코딩 → DB fetch 전환

**현재 상태:** 많은 페이지가 `src/components/frontend/*` 내부 하드코딩 상수와 로컬 상태에 의존
**목표:** 전부 SWR hook을 통해 실제 DB에서 fetch

---

## 전환 대상 페이지 (33 page routes 기준)

### 운영자 (Admin) — 11페이지

| 페이지 | 파일 | 전환 Step | 데이터 소스 |
|--------|------|---------|-----------|
| 대시보드 | `admin/dashboard/page.tsx` | Step 3 | 학생수/매출/출석률 집계 |
| 학생 목록 | `admin/students/page.tsx` | Step 3 | `useUsers({ role: 'STUDENT' })` |
| 학생 상세 | `admin/students/[id]/page.tsx` | Step 3 | `useUser(id)` |
| 강사 목록 | `admin/teachers/page.tsx` | Step 3 | `useUsers({ role: 'TEACHER' })` |
| 반 목록 | `admin/classes/page.tsx` | Step 3 | `useClasses()` |
| 반 상세 | `admin/classes/[id]/page.tsx` | Step 3 | `useClass(id)` |
| 시간표 | `admin/schedule/page.tsx` | Step 3 | `useSchedule({ week })` |
| 수납 관리 | `admin/payments/page.tsx` | Step 3 | `usePayments()` |
| 이탈 관리 | `admin/churn/page.tsx` | Step 3 | `useConsultations()` |
| 민원 관리 | `admin/complaints/page.tsx` | Step 3 | `useComplaints()` |
| 커리큘럼 | `admin/curriculum/page.tsx` | Step 3 | `useCurriculum()` |

### 강사 (Teacher) — 13페이지

| 페이지 | 파일 | 전환 Step | 데이터 소스 |
|--------|------|---------|-----------|
| 홈/대시보드 | `teacher/dashboard/page.tsx` | Step 4 | 오늘 수업/과제 현황 |
| 출결 관리 | `teacher/attendance/page.tsx` | Step 2 | `useAttendance(classId, date)` |
| 코파일럿 목록 | `teacher/copilot/page.tsx` | Step 4 | `useClasses()` (내 반) |
| 코파일럿 세션 | `teacher/copilot/[lessonId]/page.tsx` | Step 6 | `useCopilot(lessonId)` |
| 과제 목록 | `teacher/assignments/page.tsx` | Step 4 | `useAssignments()` |
| 과제 상세 | `teacher/assignments/[id]/page.tsx` | Step 4 | `useAssignment(id)` |
| 녹음 요약 | `teacher/recording/page.tsx` | Step 6 | 업로드 후 Whisper 결과 |
| 녹음 상세 | `teacher/recording/[id]/page.tsx` | Step 6 | 상세 fetch |
| 진도/커리큘럼 | `teacher/progress/page.tsx` | Step 4 | `useCurriculum()`, `useProgress()` |
| 메모 | `teacher/memo/page.tsx` | Step 4 | `useMemo()` |
| Q&A 봇 | `teacher/bot/page.tsx` | Step 4 | 질문 목록 API |
| 이탈 관리 | `teacher/churn/page.tsx` | Step 4 | 담당 반 이탈 예측 |
| 보고서 | `teacher/reports/page.tsx` | Step 6 | 보고서 API |

### 수강생 (Student) — 7페이지

| 페이지 | 파일 | 전환 Step | 데이터 소스 |
|--------|------|---------|-----------|
| 홈 | `student/home/page.tsx` | Step 5 | 오늘 수업/과제 현황 |
| 과제 목록 | `student/assignments/page.tsx` | Step 5 | `useAssignments({ studentId })` |
| 과제 상세 | `student/assignments/[id]/page.tsx` | Step 5 | `useAssignment(id)` |
| 출결 조회 | `student/attendance/page.tsx` | Step 5 | `useAttendance({ studentId, month })` |
| 복습 목록 | `student/review/page.tsx` | Step 5 | `useReview()` |
| 복습 상세 | `student/review/[id]/page.tsx` | Step 5 | `useReview(id)` |
| 질문/Q&A | `student/qna/page.tsx` | Step 5 | `useQnA()` |

---

## 전환 방법

### Before (하드코딩)
```tsx
const students = [
  { id: '1', name: '김민준', grade: '중3', status: 'active' },
  { id: '2', name: '이서연', grade: '중2', status: 'active' },
  // ...
]
```

### After (SWR fetch)
```tsx
const { students, isLoading, isError } = useUsers({ role: 'STUDENT' })

if (isLoading) return <Skeleton />
if (isError) return <ErrorState />
```

---

## 전환 우선순위

1. **즉시 가치 있는 것** — Step 2: 출결 (강사가 매일 사용)
2. **Admin 핵심** — Step 3: 학생/반 목록 (CRUD 빈도 높음)
3. **나머지** — Step 4~6 순서대로

---

## 주의 사항

- 하드코딩 데이터는 전환 후 삭제 (주석 처리 금지)
- 각 페이지 전환 시 `isLoading` 상태로 Skeleton UI 함께 추가
- 데이터 없을 때 `EmptyState` 컴포넌트 노출 (Step 7에서 완성)
- 실제 연동 지점은 `page.tsx`보다 `src/components/frontend/admin-pages.tsx`, `teacher-pages.tsx`, `student-pages.tsx`인 경우가 많음
