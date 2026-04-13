# 09 · Student 홈 & 학생 페이지들

심각도: 🟢 Low  
파일: `src/components/student/student-home-page.tsx`, `src/components/student/student-qna-page.tsx`  
페이지: `/student/home`, `/student/qna`, `/student/review`, `/student/assignments`

---

## 문제 1 — QnA 페이지에 접근 경로가 없음

`/student/qna`는 `student-qna-page.tsx` 기반의 완전한 기능 페이지이지만,  
하단 탭바에 포함되어 있지 않음. 학생이 QnA 버튼을 찾을 방법이 없음.

→ `05_student_layout_nav.md`에서 상세 수정 계획 참고.  
홈 화면에서 QnA 진입 카드/링크를 임시로 제공할 수도 있음.

---

## 문제 2 — Student 홈 로딩 상태에서 레이아웃 점프 가능성

`student-home-page.tsx`가 SWR로 데이터를 가져올 때 skeleton이 있는지 확인.  
데이터 없이 빈 상태로 렌더됐다가 채워지면 레이아웃이 갑자기 바뀌는 현상 방지 필요.

**확인 항목:**
- isLoading 상태에서 Skeleton 컴포넌트 사용 여부
- 빈 데이터(assignments, schedule 없음) 상태의 EmptyState 처리 여부

---

## 문제 3 — 학생 리뷰 상세 페이지에서 뒤로가기 버튼

**파일:** `src/components/student/student-review-detail-page.tsx`  
**페이지:** `/student/review/[id]`

`router.back()`을 사용하는 뒤로가기가 있다면,  
직접 URL로 접근했을 때 back() 히스토리가 없어서 동작하지 않을 수 있음.

**수정:** `router.back()` 대신 `Link href="/student/review"` 사용.

---

## 문제 4 — 학생 과제 상세 페이지 Close 버튼에 aria-label 없음

**파일:** `src/components/student/student-assignment-detail-page.tsx:91-97`

```tsx
<button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600" onClick={onClose} type="button">
  <X className="h-5 w-5" />
  // aria-label 없음
</button>
```

**수정:** `aria-label="닫기"` 추가.

---

## 문제 5 — `frontend/student-pages.tsx` 하드코딩 데이터 확인

`frontend/student-pages.tsx`의 `StudentAttendancePage`는 하드코딩 데이터를 사용:
```tsx
const monthLabels = ['2026년 3월', '2026년 4월', '2026년 5월']
const monthSummaries = [
  { attendanceRate: 86, ... },
  ...
]
```

그러나 실제 `/student/attendance/page.tsx`는:
```tsx
import { StudentAttendanceManager } from './student-attendance-manager'
```
→ 실제 SWR 컴포넌트 사용 중. `frontend/student-pages.tsx`의 `StudentAttendancePage`는 사용 안 됨.

`frontend/student-pages.tsx`가 어디서도 import되지 않는지 확인 후 dead code 정리.

---

## 체크리스트

- [ ] 홈 화면에 QnA 진입 링크 임시 추가 (탭바 수정 전까지)
- [ ] 학생 홈 isLoading/empty 상태 skeleton 처리 확인
- [ ] 리뷰 상세 뒤로가기 `router.back()` → Link 교체 확인
- [ ] 과제 상세 닫기 버튼에 `aria-label="닫기"` 추가
- [ ] `frontend/student-pages.tsx` dead code 여부 확인 및 정리
