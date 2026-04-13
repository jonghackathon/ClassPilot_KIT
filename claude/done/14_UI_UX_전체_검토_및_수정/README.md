# UI/UX 수정 작업 계획서

작성일: 2026-04-13  
대상 브랜치: `feature/login-ux-redesign`

---

## 발견된 문제 전체 요약

### 🔴 Critical — 기능이 완전히 깨졌거나 사용자가 기능 자체를 찾지 못함

| # | 문제 | 파일 | 계획서 |
|---|------|------|--------|
| C-1 | **Teacher 헤더 스크롤 시 사라짐** (sticky 없음) | `teacher/layout.tsx:75` | [04](./04_teacher_layout_nav.md) |
| C-2 | **Student 헤더 스크롤 시 사라짐** (sticky 없음) | `student/layout.tsx:55` | [05](./05_student_layout_nav.md) |
| C-3 | **`/student/qna` 페이지가 하단 탭바에 없음** — 학생이 QnA에 접근 불가 | `student/layout.tsx:18-23` | [05](./05_student_layout_nav.md) |
| C-4 | **`/admin/curriculum` 전체가 목업** — 저장 버튼 눌러도 새로고침하면 초기화 | `curriculum-page.tsx:41+` | [06](./06_admin_curriculum.md) |

---

### 🟡 Medium — 버튼이 눌리지 않거나, 데이터가 가짜이거나, UX 흐름이 어색함

| # | 문제 | 파일 | 계획서 |
|---|------|------|--------|
| M-1 | **Admin "알림 설정" 버튼 — onClick 없음** (클릭해도 아무 반응 없음) | `admin/layout.tsx:202` | [03](./03_admin_layout_nav.md) |
| M-2 | **Teacher "수업 알림 설정" 버튼 — onClick 없음** | `teacher/layout.tsx:134` | [04](./04_teacher_layout_nav.md) |
| M-3 | **Admin 사이드바 "오늘의 리스크" — 하드코딩 텍스트** (실제 데이터 아님) | `admin/layout.tsx:114` | [03](./03_admin_layout_nav.md) |
| M-4 | **Admin 헤더 검색창 — 입력해도 아무것도 필터링 안 됨** | `admin/layout.tsx:145` | [03](./03_admin_layout_nav.md) |
| M-5 | **"비밀번호를 잊으셨나요?" — 에러 박스에 안내 메시지 표시** (에러처럼 보임) | `login/staff/page.tsx:146` | [02](./02_login.md) |
| M-6 | **알림/프로필 팝오버 외부 클릭해도 안 닫힘** (Admin, Teacher, Student 모두) | 각 layout.tsx | [01](./01_layout_shared.md) |
| M-7 | **Admin 사이드바 아이콘 중복** — "반 관리"와 "커리큘럼" 둘 다 BookOpen | `admin/layout.tsx:30,32` | [03](./03_admin_layout_nav.md) |
| M-8 | **Teacher 탭 아이콘 중복** — "진도"와 "보고서" 둘 다 BookOpenText | `teacher/layout.tsx:34-35` | [04](./04_teacher_layout_nav.md) |
| M-9 | **Staff 로그인 역할 기반 라우팅 실패** — 로그인 후 항상 student/home으로 이동 | `login/staff/page.tsx:66-73` | [02](./02_login.md) |
| M-10 | **`/teacher/attendance/page.tsx`가 불필요한 래퍼를 경유** | `teacher/attendance/page.tsx:2` | [08](./08_teacher_dashboard.md) |

---

### 🟢 Low — 접근성, dead code, 폴리시

| # | 문제 | 파일 | 계획서 |
|---|------|------|--------|
| L-1 | Admin 모바일 메뉴 열기 버튼에 `aria-label` 없음 | `admin/layout.tsx:124` | [03](./03_admin_layout_nav.md) |
| L-2 | 알림 새로고침 버튼에 `aria-label` 없음 | `NotificationPopover.tsx:35` | [10](./10_teacher_copilot.md) |
| L-3 | 과제 상세 닫기 버튼에 `aria-label` 없음 | `student-assignment-detail-page.tsx:91` | [09](./09_student_home.md) |
| L-4 | 커스텀 모달들 ESC 키로 닫기 미지원 | 다수 컴포넌트 | [10](./10_teacher_copilot.md) |
| L-5 | Student 하단 탭바 safe-area-inset 이중 계산 | `student/layout.tsx:52,103` | [05](./05_student_layout_nav.md) |
| L-6 | `frontend/admin-pages.tsx` — 미사용 dead code | `frontend/admin-pages.tsx` | [07](./07_admin_dashboard.md) |
| L-7 | `frontend/student-pages.tsx` — 미사용 dead code | `frontend/student-pages.tsx` | [09](./09_student_home.md) |
| L-8 | `api/users/[id]/reset-pin/` — untracked, 미완성 API 라우트 | git status | [10](./10_teacher_copilot.md) |
| L-9 | `todayLabel` SSR hydration mismatch 가능성 | 각 layout.tsx | [07](./07_admin_dashboard.md) |

---

## 작업 순서 권장

1. **C-1, C-2** — 헤더 sticky 수정 (teacher, student layout 각 1줄 추가)
2. **C-3** — student QnA 하단 탭바 추가 (grid-cols-5 변경 포함)
3. **M-1, M-2** — 무기능 버튼 disabled 처리
4. **M-6** — 팝오버 외부 클릭 닫기 (Admin, Teacher, Student)
5. **M-7, M-8** — 중복 아이콘 교체
6. **M-4** — 검색창 기능 구현 또는 명시적 비활성화
7. **M-9** — 로그인 역할 라우팅 수정
8. **C-4** — 커리큘럼 페이지 API 연동 (별도 스프린트)
9. **L-1~L-4** — 접근성 개선
10. **L-6, L-7** — dead code 정리

---

## 폴더 구조

| 파일 | 내용 |
|------|------|
| [01_layout_shared.md](./01_layout_shared.md) | 공통 레이아웃 (헤더 sticky, 팝오버 닫기) |
| [02_login.md](./02_login.md) | 로그인 3종 페이지 |
| [03_admin_layout_nav.md](./03_admin_layout_nav.md) | Admin 레이아웃 & 사이드바 |
| [04_teacher_layout_nav.md](./04_teacher_layout_nav.md) | Teacher 레이아웃 & 탭 네비 |
| [05_student_layout_nav.md](./05_student_layout_nav.md) | Student 레이아웃 & 하단 탭바 |
| [06_admin_curriculum.md](./06_admin_curriculum.md) | Admin 커리큘럼 목업 → API 연동 |
| [07_admin_dashboard.md](./07_admin_dashboard.md) | Admin 대시보드 |
| [08_teacher_dashboard.md](./08_teacher_dashboard.md) | Teacher 페이지들 |
| [09_student_home.md](./09_student_home.md) | Student 홈 & 학생 페이지들 |
| [10_teacher_copilot.md](./10_teacher_copilot.md) | 코파일럿, 녹음, dead code 정리 |
