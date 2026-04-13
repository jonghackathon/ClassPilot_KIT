# Step 6 작업 운영 방식

이 문서는 `Step 6: AI 연동`을 실제로 어떤 브랜치 전략으로 진행할지, 그리고 `git worktree`와 오케스트라 기능을 어디에 쓰고 어디에는 쓰지 않을지를 정리한다.

## 기본 원칙

- 기준 브랜치는 항상 `develop`이다.
- Step 6은 시작부터 무리하게 병렬화하지 않는다.
- 공용 인프라와 스키마가 걸린 구간은 순차로 먼저 정리한다.
- `git worktree`는 write scope가 분리된 뒤에만 사용한다.
- 오케스트라는 코드 직접 수정 주체가 아니라, 좁은 범위의 분석/검토 보조에만 사용한다.
- `구현_진행_로그.md`는 각 브랜치에서 자기 담당 범위만 갱신한다.

## 현재 실행 상태

- 현재 진행 브랜치: `codex/step6-foundation`
- 현재 사용 worktree: 메인 작업트리 1개만 사용
- foundation 단계에서는 별도 worktree를 만들지 않고 순차로 진행한다
- 오케스트라는 아직 코드 편집에는 사용하지 않았고, Step 6 범위/충돌 지점 검토에만 사용한다

## 왜 Step 6은 바로 병렬로 시작하지 않는가

Step 6 초반에는 아래 공용 파일이 먼저 움직인다.

- `package.json`
- `src/lib/ai/claude.ts`
- `src/lib/ai/openai.ts`
- `src/lib/ai/prompts.ts`
- `prisma/schema.prisma`
- `vercel.json`
- `src/components/frontend/teacher-pages.tsx`
- `src/components/frontend/reports-page.tsx`
- `claude/in-progress/09_구현_로드맵/step별_구현/구현_진행_로그.md`

이 구간을 여러 브랜치가 동시에 만지면 충돌이 거의 확정이므로, Step 6은 `foundation`을 먼저 순차로 닫고 그다음 약한 병렬로 전환한다.

## 전체 브랜치 구성

### 1. `codex/step6-foundation`

역할:

- Step 6의 공용 기반 먼저 정리
- 기존 broken route 착수 전에 필요한 공통 준비 완료

담당 범위:

- `package.json`
- `src/lib/ai/claude.ts`
- `src/lib/ai/openai.ts`
- `src/lib/ai/prompts.ts`
- `src/app/api/reports/route.ts` 버그 수정
- `src/app/api/lessons/[id]/route.ts` 신규
- `src/app/api/lessons/route.ts`의 `from/to` 보강
- `prisma/schema.prisma` (`ReviewSummary @@unique([lessonId, studentId])`)
- 필요 시 migration 파일
- `/src/app/api/ai/` 하위 빈 디렉토리 정리
- Step 6 문서/진행 로그 기준선 정리

운영 방식:

- `git worktree` 사용 안 함
- 메인 작업트리에서 순차 진행
- 오케스트라는 필요 시 아래처럼 보조적으로만 사용
  - migration 리스크 검토
  - prompt 파일 구조 검토
  - Step 6 남은 작업 범위 sanity check

이 브랜치를 먼저 `develop`에 머지한 뒤에만 다음 병렬 브랜치로 넘어간다.

---

### 2. `codex/step6-copilot-recording`

역할:

- 가장 깨진 상태인 Copilot/Recording 골격 재작성
- Claude SSE, Whisper 변환, teacher 화면 분리

담당 범위:

- `src/app/api/copilot/**`
- `src/app/api/recordings/**`
- `src/components/teacher/copilot/**`
- `src/components/teacher/recording/**`
- `src/app/teacher/copilot/**`
- `src/app/teacher/recording/**`
- 필요 시 `src/components/frontend/teacher-pages.tsx`에서 Copilot/Recording 제거

운영 방식:

- 별도 `git worktree` 생성 후 진행
- Copilot과 Recording은 둘 다 teacher AI 흐름이지만 같은 브랜치에 둔다
  - 둘 다 `teacher-pages.tsx` 하드코딩 분리와 연결되기 때문
  - 따로 쪼개면 화면 분리 충돌이 생길 가능성이 높다
- 오케스트라는 아래 검토 보조에만 사용
  - SSE 응답 포맷 검토
  - Copilot JSON contract 검토
  - Whisper/summary 후처리 응답 shape 검토

주의:

- `src/components/frontend/teacher-pages.tsx`는 이 브랜치만 수정한다
- 다른 브랜치에서 같은 파일을 건드리지 않는다

---

### 3. `codex/step6-reports-review-essay`

역할:

- 리포트 AI 연결
- 복습 자동 생성
- 에세이 피드백 초안

담당 범위:

- `src/app/api/reports/**`
- `src/app/api/reviews/generate/route.ts`
- `src/app/api/ai/essay-feedback/route.ts`
- `src/components/teacher/reports/**`
- teacher assignments 피드백 초안 버튼 연결
- teacher progress의 복습 생성 버튼 연결
- 필요 시 `src/components/frontend/reports-page.tsx` 분리

운영 방식:

- 별도 `git worktree` 생성 후 진행
- `reports`, `reviews`, `essay-feedback`를 한 브랜치로 묶는다
  - 모두 Claude 일반 호출 계열
  - teacher 리포트/과제/진도 UI와 연결되는 흐름이 비슷하다
- 오케스트라는 아래 용도로만 사용
  - 보고서 prompt 검토
  - quiz JSON 형식 sanity check
  - feedback 응답 포맷 검토

주의:

- `prisma/schema.prisma`는 foundation에서만 수정한다
- 이 브랜치에서는 스키마 변경 없이 route/UI 연결만 처리한다

---

### 4. `codex/step6-churn-complaints`

역할:

- 이탈 예측 배치
- 민원 AI 초안
- 배포/Cron 연결 초안

담당 범위:

- `src/app/api/churn/batch/route.ts`
- `src/app/api/complaints/[id]/ai-draft/route.ts`
- `src/components/admin/admin-complaints-manager.tsx`
- churn 수동 갱신 버튼
- `vercel.json`

운영 방식:

- 별도 `git worktree` 생성 후 진행
- `churn`과 `complaints`를 한 브랜치로 묶는다
  - 둘 다 admin 운영성 기능
  - 다른 Step 6 브랜치와 write scope가 거의 겹치지 않는다
- 오케스트라는 아래 용도로만 사용
  - churn score 규칙 검토
  - complaint 답변 tone 가이드 검토
  - Cron 보안 헤더/실패 시나리오 검토

주의:

- `vercel.json`은 공용 파일이라 충돌 가능성이 있다
- 가능하면 이 브랜치만 `vercel.json`을 수정한다

## Worktree 사용 기준

Step 6에서 `git worktree`는 foundation 머지 후에만 사용한다.

생성 대상:

- `codex/step6-copilot-recording`
- `codex/step6-reports-review-essay`
- `codex/step6-churn-complaints`

운영 규칙:

- worktree 하나당 브랜치 하나
- 서로 다른 브랜치는 서로 다른 write scope만 담당
- 같은 공용 파일을 두 브랜치가 동시에 수정하지 않는다
- 각 브랜치 완료 후 `git diff --check`, 변경 파일 기준 `eslint` 확인

## 오케스트라 사용 기준

Step 6에서 오케스트라는 아래처럼 쓴다.

사용하는 경우:

- API contract 검토
- prompt 출력 형식 점검
- SSE/streaming 응답 형식 sanity check
- migration이나 Cron 설계 검토
- 병합 전 잔여 리스크 리뷰

사용하지 않는 경우:

- 같은 파일을 직접 수정하는 병렬 코드 작업
- 공용 인프라 파일 편집
- `teacher-pages.tsx`, `reports-page.tsx` 같은 충돌 가능성이 높은 파일 동시 수정

즉, 오케스트라는 `분석/검토 보조`, `git worktree`는 `실제 병렬 구현`에 쓴다.

## 권장 실행 순서

1. `codex/step6-foundation`
2. `develop` 머지
3. `codex/step6-copilot-recording` worktree 시작
4. 동시에 `codex/step6-reports-review-essay` worktree 시작
5. 동시에 `codex/step6-churn-complaints` worktree 시작
6. 병합 후 `구현_진행_로그.md` 총합 재정리
7. `Step 7`은 다시 순차 중심으로 전환

## 머지 순서

권장 머지 순서는 아래와 같다.

1. `codex/step6-foundation`
2. `codex/step6-copilot-recording`
3. `codex/step6-reports-review-essay`
4. `codex/step6-churn-complaints`

이 순서로 가는 이유:

- foundation이 공용 기반과 스키마를 먼저 안정화한다
- copilot/recording은 현재 가장 많이 깨져 있는 route라 빨리 정상화하는 편이 좋다
- reports/review/essay는 foundation 이후 바로 붙이기 쉽다
- churn/complaints는 상대적으로 독립적이라 마지막이 안전하다

## 체크리스트

- [x] `develop` 최신화
- [x] `codex/step6-foundation` 브랜치 생성
- [ ] 공용 인프라 및 스키마 선행 작업 완료
- [ ] foundation을 `develop`에 머지
- [ ] worktree 3개 생성
- [ ] 각 브랜치별 구현/검증/커밋/푸시
- [ ] 머지 후 `구현_진행_로그.md` 최종 집계 정리
