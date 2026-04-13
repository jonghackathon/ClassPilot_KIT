# 01 · 공통 레이아웃 — 헤더 스크롤 고정 문제

심각도: 🔴 Critical  
영향 범위: Teacher 전체 페이지, Student 전체 페이지

---

## 문제 1 — Teacher 헤더가 스크롤하면 사라짐

**파일:** `src/app/teacher/layout.tsx:75`

현재 코드:
```tsx
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
```

헤더에 `sticky top-0` 또는 `sticky top-4`가 없어서, 페이지를 스크롤하면 헤더 + 탭 네비게이션이 통째로 사라짐.  
강사가 긴 페이지(과제 목록, 출결 기록 등)를 보다가 네비게이션을 쓰려면 다시 최상단으로 올라가야 함.

**수정 방법:**
```tsx
// before
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">

// after
<header className="glass-panel sticky top-4 z-20 rounded-[30px] border border-white/55 px-5 py-5">
```

추가로 `<div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">` 바깥으로 sticky가 먹히려면  
래퍼 div에 `overflow` 제한이 없는지 확인 필요.

---

## 문제 2 — Student 헤더가 스크롤하면 사라짐

**파일:** `src/app/student/layout.tsx:55`

현재 코드:
```tsx
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
```

동일한 이유로 스크롤 시 헤더가 사라짐.  
학생 페이지는 모바일 UX가 핵심인데, 헤더가 고정되지 않으면 이질감이 큼.

**수정 방법:**
```tsx
// before
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">

// after
<header className="glass-panel sticky top-4 z-20 rounded-[30px] border border-white/55 px-5 py-5">
```

또는 모바일에서는 `top-0`으로 붙이는 것이 더 자연스러울 수 있음 (여백 없이).

---

## 문제 3 — 알림/프로필 팝오버 외부 클릭 시 닫히지 않음

**파일:** `src/app/admin/layout.tsx:183`, `src/app/teacher/layout.tsx:115`

Admin과 Teacher 레이아웃의 알림(Bell) 팝오버 및 프로필 드롭다운은  
다른 곳을 클릭해도 닫히지 않음. 버튼 재클릭으로만 닫힘.

현재 방식: `isAlarmVisible = alarmOpen && alarmPath === pathname` — pathname 변경 시에만 닫힘.

**수정 방법 A (간단):**  
backdrop div를 팝오버 뒤에 깔아서 클릭 시 `setAlarmOpen(false)` 호출:
```tsx
{isAlarmVisible ? (
  <>
    <div className="fixed inset-0 z-20" onClick={() => setAlarmOpen(false)} />
    <NotificationPopover className="absolute right-0 top-[calc(100%+12px)] z-30 ..." title="알림 센터" />
  </>
) : null}
```

**수정 방법 B (권장):**  
`useEffect` + `document.addEventListener('mousedown', handler)`로 ref 바깥 클릭 감지.

---

## 체크리스트

- [ ] `teacher/layout.tsx` 헤더에 `sticky top-4 z-20` 추가
- [ ] `student/layout.tsx` 헤더에 `sticky top-4 z-20` (또는 `sticky top-0`) 추가
- [ ] Admin 알림/프로필 팝오버 외부 클릭 닫기 추가
- [ ] Teacher 알림/프로필 팝오버 외부 클릭 닫기 추가
- [ ] sticky 적용 후 z-index가 하단 탭바(z-30), 모달(z-40/z-50)과 충돌하지 않는지 확인
