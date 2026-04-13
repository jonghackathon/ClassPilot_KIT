# 10 · Teacher 코파일럿 & 기타 페이지

심각도: 🟡 Medium  
파일: `src/components/teacher/copilot/`, `src/components/teacher/recording/`  
페이지: `/teacher/copilot`, `/teacher/copilot/[lessonId]`, `/teacher/recording`, `/teacher/recording/[id]`

---

## 문제 1 — 코파일럿 랜딩 → 세션 진입 링크 확인

**파일:** `src/components/teacher/copilot/teacher-copilot-landing-page.tsx`

랜딩 페이지에서 수업 카드를 클릭하면 `/teacher/copilot/[lessonId]`로 이동.  
`frontend/teacher-pages.tsx`의 하드코딩된 `lesson-1`, `lesson-2` href가 아닌  
실제 DB lessonId를 사용하는지 확인.

**확인 포인트:**
- 코파일럿 랜딩이 SWR로 오늘 수업 일정을 fetch하는지
- 세션 페이지(`teacher-copilot-session-page.tsx`)가 `params.lessonId`로 실제 데이터 fetch하는지

---

## 문제 2 — 녹음 업로드 페이지에서 파일 업로드 실제 동작 확인

**파일:** `src/components/teacher/recording/teacher-recording-page.tsx`

녹음 페이지에 파일 업로드 UI가 있다면, 실제 API 호출 여부 확인 필요.  
업로드 진행 표시(progress bar), 오류 처리, 완료 후 상세 페이지 이동 등이 구현됐는지 검토.

---

## 문제 3 — 알림 팝오버 RefreshCcw 버튼에 aria-label 없음

**파일:** `src/components/notifications/NotificationPopover.tsx:35-40`

```tsx
<button
  className="inline-flex h-8 w-8 items-center justify-center rounded-xl ..."
  onClick={() => void mutate()}
  type="button"
  // aria-label 없음
>
  <RefreshCcw className="h-4 w-4" />
</button>
```

**수정:** `aria-label="알림 새로고침"` 추가.

---

## 문제 4 — 모달/다이얼로그들의 ESC 키 닫기 미지원

**다수 파일:** `frontend/admin-pages.tsx`, `teacher/memo/teacher-memo-manager.tsx`, 등의 커스텀 모달

현재 커스텀 Dialog들은 X 버튼 클릭으로만 닫힘. ESC 키 지원 없음.  
`useEffect`로 `keydown` 이벤트 등록 또는 `<dialog>` 네이티브 요소 사용 검토.

```tsx
useEffect(() => {
  if (!open) return
  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('keydown', handleKey)
  return () => document.removeEventListener('keydown', handleKey)
}, [open, onClose])
```

---

## 문제 5 — `/api/users/[id]/reset-pin/` 폴더가 미완성 상태

`git status`에서 `src/app/api/users/[id]/reset-pin/`이 untracked으로 표시됨.  
이 API 라우트가 구현 중인지, 필요한지 확인 후 커밋하거나 삭제.

---

## 전체 dead code 정리 목록

현재 `src/components/frontend/` 폴더에는 실제 앱 페이지에서 import되지 않는 컴포넌트가 존재:

| 파일 | 실제 사용 여부 |
|------|--------------|
| `admin-pages.tsx` | ❌ 미사용 (page.tsx에서 import 없음) |
| `student-pages.tsx` | ❌ 미사용 (student/attendance는 별도 컴포넌트 사용) |
| `teacher-pages.tsx` | ⚠️ teacher/attendance에서만 사용 (래퍼만 경유) |
| `curriculum-page.tsx` | ✅ admin/curriculum에서 사용 중 (but 목업) |
| `feedback-panel.tsx` | 사용 여부 확인 필요 |
| `memo-page.tsx` | 사용 여부 확인 필요 |
| `reports-page.tsx` | 사용 여부 확인 필요 |

**수정:** 각 파일의 import 여부 최종 확인 후 미사용 파일 `_archive/` 이동 또는 삭제.

---

## 체크리스트

- [ ] 코파일럿 수업 링크 실제 lessonId 매핑 확인
- [ ] 녹음 업로드 API 연동 및 에러 처리 확인
- [ ] 알림 새로고침 버튼에 `aria-label` 추가
- [ ] 커스텀 모달들에 ESC 키 닫기 추가
- [ ] `reset-pin` API 라우트 완성 또는 삭제
- [ ] `src/components/frontend/` 미사용 파일 정리
