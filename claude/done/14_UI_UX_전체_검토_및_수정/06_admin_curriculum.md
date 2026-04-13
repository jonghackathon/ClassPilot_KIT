# 06 · Admin 커리큘럼 페이지

심각도: 🔴 Critical  
파일: `src/app/admin/curriculum/page.tsx`, `src/components/frontend/curriculum-page.tsx`

---

## 문제 — 페이지 전체가 하드코딩된 프론트엔드 목업

**페이지:** `/admin/curriculum`  
**컴포넌트:** `CurriculumPage` from `@/components/frontend/curriculum-page`

```tsx
// curriculum-page.tsx:41
const courses: CurriculumCourse[] = [
  {
    id: 'korean-middle',
    title: '국어 논술 중급 코스',
    level: '중등 심화',
    teacher: '박강사',
    stages: [ ... ],   // 모두 하드코딩
  },
  {
    id: 'math-basic',
    title: '수학 내신 기초 코스',
    ...
  },
]
```

이 파일에 있는 모든 커리큘럼 데이터는 하드코딩된 mock 데이터.  
"+ 단원 추가", "편집" 버튼들이 UI에 있고 모달도 열리지만, 저장 시 API 호출이 없음.  
페이지를 새로고침하면 변경 사항이 모두 초기화됨.

### 현재 버튼 목록과 상태

| 버튼 | 동작 |
|------|------|
| `+ 코스 추가` | 오버레이 열림 → 입력 가능 → 저장 클릭해도 하드코딩 배열에만 추가 (새로고침 시 초기화) |
| `+ 단원 추가` | 위와 동일 |
| `편집` (스테이지) | 오버레이 열림 → 저장해도 메모리만 변경 |
| `삭제` | 메모리에서만 제거 (새로고침 시 복구됨) |

### 다른 Admin 페이지들과 비교

모든 다른 admin 페이지는 실제 API 컴포넌트 사용:
- `/admin/students` → `AdminStudentsManagerPage` (useSWR)
- `/admin/classes` → `AdminClassesManagerPage` (useSWR)
- `/admin/schedule` → `AdminScheduleManagerPage` (useSWR + useClasses + useSchedule)

커리큘럼만 `frontend/curriculum-page.tsx` (목업)를 사용.

---

## 수정 방향

### 단기 (임시 처리)
페이지 상단에 "준비 중" 배너 추가:
```tsx
<div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-4">
  커리큘럼 기능은 현재 준비 중입니다. 데이터는 저장되지 않습니다.
</div>
```

### 정식 구현 필요 사항
1. Prisma 모델 확인: `Curriculum`, `CurriculumStage`, `Lesson` 등 테이블 존재 여부
2. API 라우트 생성: `/api/admin/curriculum` (GET, POST, PUT, DELETE)
3. `useCurriculum` SWR 훅 작성
4. `admin-curriculum-manager.tsx` 컴포넌트 작성 (admin-schedule-manager.tsx 패턴 참고)
5. `page.tsx`에서 `CurriculumPage` → `AdminCurriculumManagerPage`로 교체

---

## 체크리스트

- [ ] `CurriculumPage` 상단에 "데이터 미연동" 경고 배너 추가 (단기)
- [ ] Prisma 스키마에 커리큘럼 관련 모델 정의 확인
- [ ] `/api/admin/curriculum` CRUD 라우트 생성
- [ ] `AdminCurriculumManagerPage` 컴포넌트 구현
- [ ] `admin/curriculum/page.tsx`에서 컴포넌트 교체
- [ ] `frontend/curriculum-page.tsx` 파일 삭제 또는 archive
