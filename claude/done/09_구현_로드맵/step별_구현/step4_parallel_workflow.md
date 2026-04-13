# Step 4 병렬 작업 운영 방식

이 문서는 `Teacher 기능`을 병렬 worktree로 나눠 진행할 때의 운영 규칙을 정리한다.

## 기본 원칙

- 기준 브랜치는 항상 `develop`이다.
- 작업은 `codex/` 접두사의 전용 브랜치에서만 진행한다.
- 서로 다른 도메인은 가능한 한 서로 다른 worktree에서 구현한다.
- 공용 목업 파일보다 도메인 전용 컴포넌트와 페이지 래퍼를 우선 연결한다.
- 진행 로그는 완료된 항목만 체크하고, 실제 구현 범위를 기준으로 갱신한다.

## 이번 분리 방식

- `codex/step4-teacher-progress-bot`
  - 담당 영역: `src/app/api/curriculum/**`, `src/app/api/week-notes/**`, `src/app/api/memo/**`, `src/app/api/bot-faq/**`, `src/app/api/bot-questions/**`, `src/app/teacher/progress/**`, `src/app/teacher/memo/**`, `src/app/teacher/bot/**`
  - 목표: 진도, 메모, FAQ/질문봇의 실데이터 연결
- `codex/step4-teacher-assignments`
  - 담당 영역: 과제/피드백
- `codex/step5-student-core`
  - 담당 영역: 학생 제출, 복습, Q&A

## 충돌 방지 규칙

- `src/components/frontend/teacher-pages.tsx` 같은 공용 목업 파일은 가능하면 건드리지 않는다.
- 각 도메인 전용 컴포넌트는 `src/components/teacher/progress`, `src/components/teacher/memo`, `src/components/teacher/bot` 아래에 만든다.
- 하나의 브랜치가 여러 도메인의 파일을 동시에 만지는 경우는 피한다.
- `구현_진행_로그.md`는 모든 브랜치가 만질 수 있지만, 머지 직전에 한 번 더 확인해서 중복 체크를 줄인다.

## 검증 순서

1. 각 worktree에서 필요한 API/페이지를 먼저 실데이터로 연결한다.
2. 브랜치별로 `git diff --check`와 타입/린트 검증을 수행한다.
3. 완료된 작업만 커밋하고 푸시한다.
4. `develop`으로 머지된 뒤 다음 worktree를 최신화한다.

## 이번 트랙의 우선순위

1. `teacher/progress`를 먼저 실데이터로 연결한다.
2. `teacher/memo`를 이어서 연결한다.
3. `teacher/bot`을 FAQ/질문 응답 흐름까지 마무리한다.

