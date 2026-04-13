# 08 · Teacher 페이지들

심각도: 🟡 Medium  
영향 범위: `/teacher/attendance`, 각종 Teacher 페이지

---

## 문제 1 — `/teacher/attendance`가 프론트엔드 래퍼를 통해 실제 컴포넌트로 연결됨

**파일:** `src/app/teacher/attendance/page.tsx`

```tsx
import { TeacherAttendancePage } from '@/components/frontend/teacher-pages'
```

`frontend/teacher-pages.tsx`의 `TeacherAttendancePage`는:
```tsx
export function TeacherAttendancePage() {
  return <TeacherAttendanceManager />  // 실제 API 컴포넌트로 위임
}
```

실제 기능은 정상 동작하지만, **불필요한 래퍼 레이어**가 존재함.  
직접 `TeacherAttendanceManager`를 import하는 것이 코드 명확성에 좋음.

**수정:**
```tsx
// teacher/attendance/page.tsx
import { TeacherAttendanceManager } from '@/components/attendance/teacher-attendance-manager'

export default function Page() {
  return <TeacherAttendanceManager />
}
```

---

## 문제 2 — Teacher 대시보드에서 수업 카드 클릭 후 코파일럿 세션 이동 확인

**파일:** `src/components/teacher/teacher-dashboard-manager.tsx`

대시보드에 오늘 수업 목록이 있고, 각 수업 카드는 `/teacher/copilot/[lessonId]`로 링크됨.  
`lessonId`가 실제 DB의 lesson ID인지 확인 필요.  
스케줄(ScheduleItem)에서 lessonId를 직접 구하기 어려울 수 있음.

**확인 항목:**
- 수업 카드의 href가 실제 `/teacher/copilot/[lessonId]` 형식으로 생성되는지
- `teacher/copilot/[lessonId]/page.tsx`가 해당 ID를 사용해 데이터 fetch하는지

---

## 문제 3 — Teacher 페이지 네비에서 "진도"와 "보고서" 시각적 구분 불가

`src/app/teacher/layout.tsx:34-35`에서 두 항목이 같은 `BookOpenText` 아이콘.  
(→ `04_teacher_layout_nav.md`에서 상세 다룸)

---

## 문제 4 — `frontend/teacher-pages.tsx`의 하드코딩 데이터

`frontend/teacher-pages.tsx`에는 아래 하드코딩 데이터가 있음:
```tsx
const teacherLessons: Lesson[] = [
  { time: '14:00 - 15:30', title: '중급 A반', topic: 'Python 반복문...', href: '/teacher/copilot/lesson-1', id: 'lesson-1' },
  ...
]
```

이 파일에서 export되는 컴포넌트 중 teacher/attendance/page.tsx가 사용하는  
`TeacherAttendancePage`는 실제 컴포넌트로 위임하지만,  
`TeacherDashboardPage`, `TeacherRecordingListPage`, `TeacherBotPage` 등이  
혹시 이 하드코딩 데이터를 쓰는지 확인 필요.

**실제 앱에서 사용되는 컴포넌트 확인:**
- `/teacher/dashboard` → `TeacherDashboardManager` (real SWR) ✓
- `/teacher/attendance` → `TeacherAttendancePage` → `TeacherAttendanceManager` ✓
- `/teacher/assignments` → 확인 필요
- `/teacher/recording` → `TeacherRecordingPage` (별도 컴포넌트) ✓
- `/teacher/bot` → `TeacherBotManager` ✓
- `/teacher/churn` → `TeacherChurnManager` ✓
- `/teacher/progress` → `TeacherProgressManager` ✓
- `/teacher/reports` → `TeacherReportsPage` ✓
- `/teacher/memo` → `TeacherMemoManager` ✓
- `/teacher/copilot` → `TeacherCopilotLandingPage` ✓

→ `frontend/teacher-pages.tsx`는 `/teacher/attendance/page.tsx`에서만 사용됨.  
위 수정(문제 1) 적용 후 `TeacherAttendancePage` export가 사용되지 않게 됨.

---

## 체크리스트

- [ ] `teacher/attendance/page.tsx`에서 `frontend/teacher-pages.tsx` 래퍼 제거하고 직접 import
- [ ] 코파일럿 세션 링크 lessonId 매핑 확인
- [ ] `frontend/teacher-pages.tsx` unused export 정리 (삭제 or archive)
