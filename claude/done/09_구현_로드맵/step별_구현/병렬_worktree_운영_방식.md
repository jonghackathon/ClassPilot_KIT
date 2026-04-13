# 병렬 Worktree 운영 방식

> 작성일: 2026-04-12
> 최종 업데이트: 2026-04-13
> 기준 브랜치: `develop`
> 목적: Step 4, Step 5의 남은 작업을 충돌을 최소화하면서 병렬로 진행한 실제 운영 방식과 결과를 기록한다.

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

## 2. 병렬 작업 시작 기준선

병렬 작업은 항상 아래 순서로 시작했다.

- `develop` 최신화
- 직전 작업 브랜치 머지 여부 확인
- 충돌 가능성이 높은 공용 파일 범위 확인
- worktree 생성 후 도메인별 브랜치 분리

실제 기준선은 `develop`이었다.  
`main`은 배포/기준 브랜치로 유지했고, 병렬 구현은 모두 `develop`에서 분기했다.

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

### D. 안정화용 추가 worktree

병렬 머지 후 바로 기능 작업을 더하지 않고, 먼저 공용 리스크를 2갈래로 정리했다.

#### `codex/fix-teacher-progress-memo-lint`

담당 범위:

- `src/components/teacher/progress/**`
- `src/components/teacher/memo/**`

목표:

- 병합 후 발생한 `setState in effect` lint 에러 제거

Worktree 경로:

- `/private/tmp/ClassPilot-fix-teacher-progress-memo-lint`

#### `codex/fix-assignments-student-scope`

담당 범위:

- `src/app/api/assignments/**`
- `src/components/student/student-home-page.tsx`

목표:

- 학생에게 다른 학생 제출 정보가 노출되지 않도록 범위 제한
- 학생 홈 "남은 과제" 집계 수정

Worktree 경로:

- `/private/tmp/ClassPilot-fix-assignments-student-scope`

#### 2차 마감 worktree

Step 4, Step 5를 100%로 닫기 위해 마지막 2갈래 worktree를 한 번 더 사용했다.

##### `codex/step4-teacher-lessons`

담당 범위:

- `src/app/api/lessons/route.ts`
- `src/app/api/lessons/[id]/progress/route.ts`

목표:

- Teacher 진도 기능의 마지막 lessons API 2건 마감

##### `codex/step5-student-submission-flow`

담당 범위:

- `src/app/api/assignments/[id]/submissions/**`
- `src/lib/validations/assignments.ts`
- `src/components/student/student-assignment-detail-page.tsx`

목표:

- 제출 확인 모달
- 5분 자동저장
- draft/submitted 상태 분리

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

## 6. 실제 머지 순서

실제 운영에서는 아래 순서로 병렬 브랜치를 머지했다.

1. `codex/step4-teacher-assignments`
2. `codex/step4-teacher-progress-bot`
3. `codex/step5-student-core`
4. `codex/fix-teacher-progress-memo-lint`
5. `codex/fix-assignments-student-scope`
6. `codex/step4-teacher-churn-dashboard`
7. `codex/step5-student-attendance`
8. `codex/step5-student-interactions`
9. `codex/step4-teacher-lessons`
10. `codex/step5-student-submission-flow`

운영 중 확인한 점:

- 초기 3갈래 병렬은 도메인 분리가 잘 되면 효율이 높았다.
- 머지 후에는 바로 기능 확장보다 `안정화 브랜치`를 먼저 두는 편이 안전했다.
- `구현_진행_로그.md`는 거의 매번 충돌 났고, 마지막 머지 기준으로 표를 다시 계산해야 했다.

---

## 7. 실제 실행 결과

- [x] `develop` 최신화 후 병렬 작업 시작
- [x] `step4-teacher-assignments`, `step4-teacher-progress-bot`, `step5-student-core` 병렬 구현
- [x] 병렬 머지 후 `fix-teacher-progress-memo-lint`, `fix-assignments-student-scope` 안정화 브랜치 추가
- [x] `step4-teacher-churn-dashboard`, `step5-student-attendance`, `step5-student-interactions` 병렬 구현
- [x] 마지막 남은 `step4-teacher-lessons`, `step5-student-submission-flow` 병렬 마감
- [x] Step 4 완료
- [x] Step 5 완료
- [x] `구현_진행_로그.md` 총합 재정리
- [x] 임시 worktree 전부 제거

결과적으로 병렬 worktree 전략으로 `Step 4`, `Step 5`를 모두 `100%` 완료했다.

---

## 8. 작업 중 배운 점

- `src/components/frontend/teacher-pages.tsx`, `src/components/frontend/student-pages.tsx` 같은 대형 공용 파일은 병렬 대상에서 제외하는 게 맞았다.
- 실제로는 전용 manager/component 파일을 새로 분리할수록 충돌이 크게 줄었다.
- worktree는 기능 구현 병렬화에는 매우 유효했지만, 머지 후 안정화 브랜치가 한 번 더 필요했다.
- 공통 문서인 `구현_진행_로그.md`는 각 브랜치에서 자기 행만 수정해도 결국 머지 시 표 계산 충돌이 난다.
- 병렬 종료 후에는 worktree 정리를 바로 해두는 것이 다음 단계 준비에 유리했다.

---

## 9. 현재 상태

- 현재 worktree는 메인 작업트리 하나만 남아 있다.
- 남아 있는 작업은 `Step 6`, `Step 7`이며, 이 구간은 다시 순차 또는 약한 병렬이 적합하다.
- 현재 메인 작업트리:
  - `/Users/jongtae/Desktop/ClassPilot` → `develop`

---

## 10. 실제 작업 시작 전 체크리스트

- [x] `develop` 최신화
- [ ] 기존 `codex/*` 브랜치 정리
- [ ] 원격 `codex/*` 브랜치 정리
- [x] worktree 생성
- [x] 각 worktree에서 실제 구현 시작
- [x] 각 브랜치별 커밋/푸시
- [x] 머지 후 `구현_진행_로그.md` 충돌 정리

---

## 11. 실제 생성되었던 Worktree 목록

- `/Users/jongtae/Desktop/ClassPilot` → `develop`
- `/private/tmp/ClassPilot-step4-teacher-assignments` → `codex/step4-teacher-assignments`
- `/private/tmp/ClassPilot-step4-teacher-progress-bot` → `codex/step4-teacher-progress-bot`
- `/private/tmp/ClassPilot-step5-student-core` → `codex/step5-student-core`
- `/private/tmp/ClassPilot-fix-teacher-progress-memo-lint` → `codex/fix-teacher-progress-memo-lint`
- `/private/tmp/ClassPilot-fix-assignments-student-scope` → `codex/fix-assignments-student-scope`
- `/private/tmp/ClassPilot-step4-teacher-churn-dashboard` → `codex/step4-teacher-churn-dashboard`
- `/private/tmp/ClassPilot-step5-student-attendance` → `codex/step5-student-attendance`
- `/private/tmp/ClassPilot-step5-student-interactions` → `codex/step5-student-interactions`
- `/private/tmp/ClassPilot-step5-student-submission-flow` → `codex/step5-student-submission-flow`

현재는 위 임시 worktree를 모두 제거했고, 메인 작업트리만 남아 있다.

---

## 12. 다음 실행 순서

1. `Step 6 AI 연동` 범위를 다시 작은 단위로 쪼갠다.
2. 공통 인프라가 많은 구간은 순차로 먼저 구현한다.
3. 화면 연결이 독립적인 부분만 약한 병렬 여부를 다시 판단한다.
4. `Step 7`은 모바일/공통 UI/배포 성격이 강하므로 순차 중심으로 진행한다.
