# 병렬 Worktree 운영 방식

> 작성일: 2026-04-12
> 기준 브랜치: `develop`
> 목적: Step 4, Step 5의 남은 작업을 충돌을 최소화하면서 병렬로 진행하기 위한 작업 방식 정리

---

## 1. 왜 이 방식으로 가는가

Step 3까지는 기능 단위를 작은 브랜치로 끊어서 순차적으로 구현했다.  
이 방식은 안전했지만, Step 4와 Step 5부터는 작업량이 커지고 도메인이 나뉘어 있어 병렬화 이점이 커졌다.

다만 무작정 병렬로 진행하면 아래 파일에서 충돌이 커질 수 있다.

- `src/components/frontend/teacher-pages.tsx`
- `src/components/frontend/student-pages.tsx`
- `claude/in-progress/09_구현_로드맵/step별_구현/구현_진행_로그.md`

그래서 이번부터는 `develop`을 기준선으로 유지하고, 충돌 가능성이 낮은 도메인 단위만 분리해서 `git worktree`로 병렬 작업한다.

---

## 2. 이번에 실제로 정리한 상태

병렬 작업 시작 전에 브랜치를 정리했다.

- 로컬/원격의 기존 `codex/*` 브랜치는 모두 삭제
- `main`, `develop`만 기준 브랜치로 유지
- 최신 `origin/develop`까지 fast-forward 완료

즉, 병렬 작업 시작 시점의 기준선은 아래 두 브랜치다.

- `main`
- `develop`

---

## 3. Worktree 분리 기준

### A. `codex/step4-teacher-assignments`

담당 범위:

- `src/app/api/assignments/**`
- `src/hooks/useAssignments.ts`
- `src/app/teacher/assignments/**`

목표:

- 과제 목록/상세/생성/수정/삭제
- 피드백 작성
- 강사 과제 화면 실데이터 연결

Worktree 경로:

- `/private/tmp/ClassPilot-step4-teacher-assignments`

---

### B. `codex/step4-teacher-progress-bot`

담당 범위:

- `src/app/api/curriculum/**`
- `src/app/api/week-notes/**`
- `src/app/api/memo/**`
- `src/app/api/bot-faq/**`
- `src/app/api/bot-questions/**`
- `src/app/teacher/progress/**`
- `src/app/teacher/memo/**`
- `src/app/teacher/bot/**`

목표:

- 커리큘럼/진도/주간 메모 실데이터 연결
- 메모 CRUD 연결
- FAQ/질문 응답 흐름 연결

Worktree 경로:

- `/private/tmp/ClassPilot-step4-teacher-progress-bot`

---

### C. `codex/step5-student-core`

담당 범위:

- `src/app/api/assignments/[id]/submissions/**`
- `src/app/api/reviews/**`
- `src/app/api/qna/**`
- `src/app/student/assignments/**`
- `src/app/student/review/**`
- `src/app/student/qna/**`
- `src/app/student/home/page.tsx`

목표:

- 학생 과제 제출/수정 흐름
- 복습/퀴즈 흐름
- 질문 등록과 피드백 흐름
- 학생 홈 실데이터 연결

Worktree 경로:

- `/private/tmp/ClassPilot-step5-student-core`

---

## 4. 이번 병렬 전략에서 순차로 남기는 것

아래 단계는 병렬보다 순차가 안전하다.

- `Step 6 AI 연동`
- `Step 7 마무리`

이유:

- AI 연동은 공통 인프라 파일을 함께 건드릴 가능성이 큼
- 마무리 단계는 모바일 대응, 전역 오류 처리, 공통 UI 정리가 많아 충돌이 잦음

즉, 병렬은 `Step 4`, `Step 5`까지만 적극 적용하고 이후는 다시 순차 또는 약한 병렬로 전환한다.

---

## 5. 작업 규칙

### 공통 규칙

- 기준 브랜치는 항상 `develop`
- 새 작업은 `develop` 최신화 후 시작
- 각 worktree는 자기 브랜치 범위만 수정
- 공용 파일 수정은 가능한 한 최소화
- 작업 완료 시 `구현_진행_로그.md`도 함께 갱신

### 충돌 주의 파일

- `src/components/frontend/teacher-pages.tsx`
  - 여러 teacher 화면이 한 파일에 묶여 있어 병렬 충돌 가능성이 높음
- `src/components/frontend/student-pages.tsx`
  - student 쪽 병렬 충돌 가능성이 높음
- `구현_진행_로그.md`
  - 모든 브랜치가 수정하므로 merge hotspot

### 운영 원칙

- 가능하면 새 manager/component 파일을 분리해서 충돌을 줄인다
- `page.tsx`는 얇은 wrapper로 유지한다
- `구현_진행_로그.md`는 각 브랜치에서 자기 작업분만 갱신한다
- 최종 머지 직전 `전체 진행 현황` 표는 다시 한 번 맞춘다

---

## 6. 머지 순서

권장 머지 순서는 아래와 같다.

1. `codex/step4-teacher-assignments`
2. `codex/step4-teacher-progress-bot`
3. `codex/step5-student-core`

이 순서로 가는 이유:

- assignments는 `Step 4`의 핵심 패턴을 먼저 만든다
- progress/bot은 assignments와 도메인 충돌이 비교적 적다
- student core는 teacher 쪽 패턴이 어느 정도 정리된 뒤 머지하는 편이 안전하다

---

## 7. 실제 작업 시작 전 체크리스트

- [x] `develop` 최신화
- [x] 기존 `codex/*` 브랜치 정리
- [x] 원격 `codex/*` 브랜치 정리
- [x] worktree 3개 생성
- [ ] 각 worktree에서 실제 구현 시작
- [ ] 각 브랜치별 커밋/푸시
- [ ] 머지 전 `구현_진행_로그.md` 충돌 정리

---

## 8. 현재 생성된 Worktree 목록

- `/Users/jongtae/Desktop/ClassPilot` → `develop`
- `/private/tmp/ClassPilot-step4-teacher-assignments` → `codex/step4-teacher-assignments`
- `/private/tmp/ClassPilot-step4-teacher-progress-bot` → `codex/step4-teacher-progress-bot`
- `/private/tmp/ClassPilot-step5-student-core` → `codex/step5-student-core`

---

## 9. 다음 실행 순서

1. `teacher assignments` worktree에서 Step 4 과제 기능 구현 시작
2. 동시에 `teacher progress/bot` worktree에서 진도/메모/Bot 영역 구현
3. 동시에 `student core` worktree에서 과제 제출/복습/Q&A 구현
4. 각 브랜치 완료 시 진행 로그 업데이트 후 커밋/푸시
5. 병합 후 `develop` 최신화
6. `Step 6`, `Step 7`은 다시 순차 진행
