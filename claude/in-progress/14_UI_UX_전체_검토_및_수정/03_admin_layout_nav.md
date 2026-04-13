# 03 · Admin 레이아웃 & 사이드바

심각도: 🔴 Critical + 🟡 Medium  
영향 범위: `/admin/*` 전체

---

## 문제 1 — "알림 설정" 버튼 클릭해도 아무 일도 없음

**파일:** `src/app/admin/layout.tsx:202-205`

```tsx
<button
  className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
  type="button"
  // onClick 없음 ← 버튼처럼 생겼지만 아무것도 안 함
>
  <Settings2 className="h-4 w-4" />
  알림 설정
</button>
```

hover 스타일 때문에 클릭 가능해 보이지만, 클릭해도 아무 반응 없음.

**수정 방법 (단기):**  
알림 설정 페이지가 아직 없다면 버튼을 비활성화하고 tooltip으로 "준비 중" 안내:
```tsx
<button
  type="button"
  disabled
  title="알림 설정 기능 준비 중"
  className="... opacity-50 cursor-not-allowed"
>
```

**수정 방법 (정식):**  
`/admin/settings/notifications` 페이지 생성 후 Link로 교체 또는 onClick으로 라우팅.

---

## 문제 2 — 사이드바 "오늘의 리스크" 박스가 하드코딩된 가짜 데이터

**파일:** `src/app/admin/layout.tsx:112-117`

```tsx
<div className="rounded-[24px] border border-slate-200 bg-white/85 p-4 text-sm text-slate-600">
  <p className="font-semibold text-slate-800">오늘의 리스크</p>
  <p className="mt-2 leading-6">
    미납 3건, 출석 하락 2명, 확인 대기 민원 4건이 감지되었습니다.
  </p>
</div>
```

실제 데이터와 무관한 고정 문자열. 실제로 미납이 0건이어도 항상 "3건" 표시됨.

**수정 방법:**  
`/api/admin/dashboard/summary` 또는 기존 SWR 훅으로 실시간 요약값 fetch:
```tsx
const { data } = useSWR('/api/admin/dashboard/summary', fetcher)
<p>미납 {data?.unpaidCount ?? '-'}건, ...</p>
```

로딩 중엔 skeleton 표시.

---

## 문제 3 — Admin 헤더 검색창이 입력해도 아무것도 필터링 안 됨

**파일:** `src/app/admin/layout.tsx:145-153`

```tsx
const [searchQuery, setSearchQuery] = useState('')
// ...
<input
  onChange={(event) => setSearchQuery(event.target.value)}
  placeholder="학생, 반, 결제, 민원을 검색해 보세요"
  value={searchQuery}
/>
```

`searchQuery` 상태가 있지만 자식 컴포넌트에 전혀 전달되지 않음. 입력해도 아무 결과 없음.  
사용자는 검색이 되는 줄 알고 입력하다가 아무것도 안 되는 걸 발견함.

**수정 방법 A (단기):** 검색창을 임시로 placeholder 비활성화 또는 숨김 처리  
**수정 방법 B (정식):** Context 또는 URL 쿼리 파라미터로 `searchQuery`를 각 페이지에 전달

---

## 문제 4 — 사이드바 네비게이션에 아이콘 중복

**파일:** `src/app/admin/layout.tsx:30-36`

```tsx
{ href: '/admin/classes', label: '반 관리', icon: BookOpen },
{ href: '/admin/curriculum', label: '커리큘럼', icon: BookOpen },  // ← 같은 아이콘
```

"반 관리"와 "커리큘럼" 두 항목이 모두 `BookOpen` 아이콘 사용. 시각적으로 구분 불가.

**수정 방법:**  
커리큘럼은 `GraduationCap`, `BookMarked`, `ListOrdered` 등으로 교체.

---

## 문제 5 — 모바일 메뉴 열기 버튼에 aria-label 없음

**파일:** `src/app/admin/layout.tsx:124-137`

```tsx
<button
  className="flex h-11 w-11 items-center justify-center rounded-2xl border ..."
  onClick={() => { setMobileNavOpen(true); ... }}
  type="button"
  // aria-label 없음
>
  <Menu className="h-5 w-5" />
</button>
```

닫기 버튼(line 244)에는 `aria-label="메뉴 닫기"`가 있지만, 열기 버튼에는 없음.

**수정:** `aria-label="메뉴 열기"` 추가.

---

## 체크리스트

- [ ] "알림 설정" 버튼 — disabled + tooltip "준비 중" 또는 설정 페이지 연결
- [ ] "오늘의 리스크" — 실제 API 데이터 연결 또는 로딩 skeleton 처리
- [ ] 검색창 — 실제 동작하게 만들거나 "준비 중" 상태로 표시
- [ ] 커리큘럼 사이드바 아이콘 교체 (BookOpen 중복 제거)
- [ ] 모바일 메뉴 열기 버튼에 `aria-label="메뉴 열기"` 추가
