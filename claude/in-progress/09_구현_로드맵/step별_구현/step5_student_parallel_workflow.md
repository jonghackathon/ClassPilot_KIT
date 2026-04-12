# Step 5 Student 병렬 작업 방식

이 문서는 `Step 5: Student 기능`을 병렬로 진행할 때의 작업 방식을 정리한다.

## 작업 원칙

- 기준 브랜치는 항상 `develop` 최신 상태에서 새 worktree/브랜치를 만든다.
- 학생 트랙은 `src/components/student/` 아래에 새 컴포넌트를 두고, 기존 공유 mock 파일인 `src/components/frontend/student-pages.tsx`는 건드리지 않는다.
- 각 worktree는 서로 다른 쓰기 범위를 맡는다.
- 공통 로그 파일인 `claude/in-progress/09_구현_로드맵/step별_구현/구현_진행_로그.md` 는 각 worktree가 자기 담당 행만 갱신한다.

## 병렬 분리 기준

- `codex/step4-teacher-assignments`
  - 과제 목록, 과제 상세, 제출 흐름
- `codex/step4-teacher-progress-bot`
  - 진도, 메모, 봇 FAQ, 질문 관리
- `codex/step5-student-core`
  - 학생 과제, 복습, 질문하기, 홈 요약

## 학생 트랙 구현 순서

1. 학생 홈을 실데이터로 바꿔 전체 진입점을 만든다.
2. 과제 목록과 과제 상세를 연결해 제출 흐름을 만든다.
3. 복습 목록과 복습 상세를 연결해 읽음 처리까지 묶는다.
4. 질문하기 화면을 실데이터로 연결하고 생성 흐름을 붙인다.
5. 마지막에 진행 로그의 Step 5 행과 전체 진행률을 맞춘다.

## 검증 기준

- 변경한 파일만 대상으로 `git diff --check` 를 먼저 확인한다.
- 가능하면 변경 파일 기준 `eslint` 를 확인한다.
- 라우트 파라미터가 있는 페이지는 현재 Next.js 규칙에 맞춰 `params: Promise<...>` 패턴을 따른다.

## 이번 worktree 적용 방식

- 작업 경로: `/private/tmp/ClassPilot-step5-student-core`
- 담당 범위: 학생 쪽 실데이터 화면과 그에 필요한 학생 전용 컴포넌트
- 제외 범위: 관리자가 쓰는 공통 mock 컴포넌트, Step 5 밖의 route나 page
