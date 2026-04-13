# 04 · Teacher 레이아웃 & 네비게이션

심각도: 🔴 Critical + 🟡 Medium  
영향 범위: `/teacher/*` 전체

---

## 문제 1 — 헤더가 스크롤 시 사라짐 (스티키 미적용)

**파일:** `src/app/teacher/layout.tsx:75`

```tsx
// 현재: sticky 없음
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
```

페이지를 조금만 스크롤해도 헤더(+탭 네비게이션)가 사라짐.  
강사는 수업 중 빠르게 페이지를 이동해야 하는데 매번 스크롤 올려야 함.

**수정:**
```tsx
<header className="glass-panel sticky top-4 z-20 rounded-[30px] border border-white/55 px-5 py-5">
```

주의: 부모 `<div className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6">`가  
`overflow: hidden`이 되면 sticky가 먹히지 않으므로 확인 필요.

---

## 문제 2 — "수업 알림 설정" 버튼 클릭해도 아무 일도 없음

**파일:** `src/app/teacher/layout.tsx:134-137`

```tsx
<button
  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
  type="button"
  // onClick 없음
>
  <Settings2 className="h-4 w-4" />
  수업 알림 설정
</button>
```

hover 효과로 클릭 가능해 보이지만 아무 동작 없음.

**수정 (단기):** disabled + cursor-not-allowed + title="준비 중"  
**수정 (정식):** 알림 설정 페이지/모달 연결

---

## 문제 3 — 진도/보고서 아이콘 중복

**파일:** `src/app/teacher/layout.tsx:34-35`

```tsx
{ href: '/teacher/progress', label: '진도', icon: BookOpenText },
{ href: '/teacher/reports', label: '보고서', icon: BookOpenText },  // ← 같은 아이콘
```

두 항목이 똑같은 `BookOpenText` 아이콘을 사용. 탭 네비에서 시각적으로 구분 불가.

**수정:**  
보고서는 `FileText`, `BarChart2`, `ClipboardList` 중 선택.  
진도는 `TrendingUp`, `BookOpenText` 유지.

---

## 문제 4 — 모바일 하단 탭바에서 "더보기" 활성 상태 감지 오류 가능성

**파일:** `src/app/teacher/layout.tsx:203-212`

```tsx
className={`... ${
  navigation.slice(4).some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
    ? 'bg-white text-slate-950'
    : 'text-slate-300'
}`}
```

더보기(slice(4))에 속한 페이지에 있으면 "더보기" 버튼이 활성화됨 — 이건 OK.  
하지만 사용자 관점에서 어느 페이지에 있는지 하단 탭바에서 전혀 알 수 없음  
(아이콘도 없고, 어떤 메뉴인지 표시 안 됨).

**수정 (선택):**  
더보기 활성 시, 해당 섹션 레이블("메모", "보고서" 등)을 작게 표시하는 방법 검토.

---

## 문제 5 — Teacher 헤더가 모바일에서 `pb-24`와 겹침

**파일:** `src/app/teacher/layout.tsx:73`

```tsx
<div className="min-h-dvh pb-24 md:pb-0">
```

하단 탭바가 `fixed bottom-0`이고, 본문에 `pb-24`가 있어서 보통은 OK.  
하지만 sticky 헤더를 추가하면 본문 시작점이 헤더 높이만큼 밀리는지 확인 필요.

---

## 체크리스트

- [ ] 헤더에 `sticky top-4 z-20` 추가
- [ ] "수업 알림 설정" 버튼 — disabled 또는 설정 모달 연결
- [ ] 보고서 아이콘 교체 (`FileText` 또는 `BarChart2`)
- [ ] sticky 추가 후 모바일 하단 탭바와 z-index 충돌 없는지 확인
- [ ] (선택) 더보기 활성 시 현재 페이지 레이블 표시 개선
