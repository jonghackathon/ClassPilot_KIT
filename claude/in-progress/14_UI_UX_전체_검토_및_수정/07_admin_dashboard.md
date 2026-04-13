# 07 · Admin 대시보드

심각도: 🟡 Medium  
파일: `src/components/admin/admin-dashboard-manager.tsx`  
페이지: `/admin/dashboard`

---

## 문제 1 — 학생 상세 링크가 slug 방식이 아닌 실제 ID를 써야 함

Admin 대시보드에서 학생 카드를 클릭하면 `/admin/students/[id]`로 이동.  
대시보드 매니저는 SWR로 실제 데이터를 가져오므로 `student.id` (UUID)를 href에 사용하고 있을 것.  
`frontend/admin-pages.tsx`에 있는 하드코딩 `/admin/students/kim-minsu` 같은 slug는  
**실제 앱 페이지에선 사용되지 않음** (admin-pages.tsx가 현재 어느 page.tsx에도 import되지 않음).

→ 이 파일(`admin-pages.tsx`)은 **현재 사용되지 않는 dead code**. 혼란 방지를 위해 삭제 또는 `_archive` 폴더 이동 검토.

---

## 문제 2 — 리스크 지표 카드 "위험" 링크가 동작하는지 확인 필요

대시보드에는 출석 하락, 미납, 민원 카드가 있고 "자세히 보기" 링크가 있음.  
SWR 데이터 기반이므로 일반적으로는 정상이지만,  
데이터가 비어있을 때 (학원 초기 설정 단계) 빈 카드 처리가 있는지 확인.

**확인 항목:**
- `isLoading` 상태에서 skeleton 보여주는지 ✓ (useSWR + Skeleton 컴포넌트 확인)
- `error` 상태에서 에러 메시지 표시하는지
- 데이터 0건일 때 EmptyState 표시하는지

---

## 문제 3 — 날짜/시간 표시 hydration mismatch 가능성

Admin layout의 `todayLabel`은 `useMemo`로 서버/클라이언트 둘 다 `new Date()` 호출.  
SSR → 클라이언트 hydration 시 날짜가 다를 수 있음 (시간대 차이).

**수정:** `useEffect`로 클라이언트에서만 날짜 초기화 또는 `suppressHydrationWarning` 추가.

---

## 체크리스트

- [ ] `frontend/admin-pages.tsx` dead code 여부 최종 확인 후 삭제 검토
- [ ] 대시보드 SWR 에러 상태 처리 확인
- [ ] 데이터 0건 EmptyState 처리 확인
- [ ] `todayLabel` hydration mismatch 여부 확인 및 수정
