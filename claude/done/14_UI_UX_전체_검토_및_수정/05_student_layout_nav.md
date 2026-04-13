# 05 · Student 레이아웃 & 하단 탭바

심각도: 🔴 Critical  
영향 범위: `/student/*` 전체

---

## 문제 1 — 헤더가 스크롤 시 사라짐 (스티키 미적용)

**파일:** `src/app/student/layout.tsx:55`

```tsx
// 현재: sticky 없음
<header className="glass-panel rounded-[30px] border border-white/55 px-5 py-5">
```

학생 페이지는 모바일 중심 UX. 스크롤 하면 헤더가 사라지고,  
알림 버튼이나 날짜 정보에 다시 접근하려면 최상단으로 올려야 함.

**수정:**
```tsx
<header className="glass-panel sticky top-0 z-20 rounded-[30px] border border-white/55 px-5 py-5">
```

모바일에서는 `top-4` 여백보다 `top-0`이 더 자연스러울 수 있음.  
적용 후 하단 탭바(z-30)와 z-index 충돌 없는지 확인.

---

## 문제 2 — `/student/qna` 페이지가 있지만 하단 탭바에 없음

**파일:** `src/app/student/layout.tsx:18-23`

현재 하단 탭바 네비게이션:
```tsx
const navigation = [
  { href: '/student/home', label: '홈', icon: Home },
  { href: '/student/attendance', label: '출결', icon: CalendarCheck2 },
  { href: '/student/assignments', label: '과제', icon: NotebookPen },
  { href: '/student/review', label: '복습', icon: BookOpen },
]
```

`/student/qna` 페이지가 존재하지만 네비게이션에 없음.  
학생은 QnA 기능에 접근할 방법이 없음 (직접 URL 입력 외).

참고 파일: `src/app/student/qna/page.tsx` 존재, `src/components/student/student-qna-page.tsx` 존재.

**수정 방법 A — 탭바에 QnA 추가 (5번째 탭으로):**
```tsx
import { MessageCircleQuestion } from 'lucide-react'
// navigation 배열에 추가
{ href: '/student/qna', label: 'Q&A', icon: MessageCircleQuestion },
```
단, 탭바가 4칸 grid → 5칸으로 변경 필요: `grid-cols-5`

**수정 방법 B — 학생 홈 페이지에서 QnA 링크 노출 (현재 방식 유지):**
홈에서 QnA 카드/링크를 두어 접근 가능하게 함.

**추천:** 방법 A. QnA는 핵심 기능이므로 탭바에 포함해야 함.

---

## 문제 3 — 하단 탭바 알림 팝오버 외부 클릭으로 안 닫힘

**파일:** `src/app/student/layout.tsx:77-86`

Bell 버튼 클릭 시 `NotificationPopover`가 나타나는데,  
팝오버 외부를 클릭해도 닫히지 않음. 다시 Bell을 눌러야만 닫힘.

**수정:** Admin/Teacher와 동일하게 backdrop 레이어 추가:
```tsx
{isAlarmVisible ? (
  <>
    <div className="fixed inset-0 z-20" onClick={() => setAlarmOpen(false)} />
    <NotificationPopover className="absolute right-0 ... z-30 ..." title="알림" />
  </>
) : null}
```

---

## 문제 4 — 하단 탭바 안에서 패딩 계산이 이중으로 돼 있음

**파일:** `src/app/student/layout.tsx:52-53`, `src/app/student/layout.tsx:103-104`

```tsx
// 래퍼 div
style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6.5rem)' }}

// 하단 탭바 nav
style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
```

탭바 nav 자체에도 `safe-area-inset-bottom`이 들어 있고,  
래퍼 div에도 같은 값이 들어 있어 노치가 있는 기기에서 이중으로 패딩이 적용될 수 있음.

**수정:** 래퍼 div의 paddingBottom에서 `env(safe-area-inset-bottom)`을 제거하고  
고정값만 남기거나, 탭바 높이를 CSS 변수로 통일.

---

## 체크리스트

- [ ] 헤더에 `sticky top-0 z-20` 추가 (top-4 여백 여부는 디자인팀 확인)
- [ ] `/student/qna`를 하단 탭바에 추가 (`grid-cols-5` 변경 포함)
- [ ] 알림 팝오버 외부 클릭 닫기 추가
- [ ] `safe-area-inset-bottom` 이중 패딩 계산 정리
