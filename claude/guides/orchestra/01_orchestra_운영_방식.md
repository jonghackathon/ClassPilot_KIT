# Orchestra 운영 방식

## ClassPilot 적용 사례

- **Step 6** — foundation 순차 → Copilot/Reports/Churn 3갈래 병렬 구현
- Orchestra 서브에이전트로 SSE 포맷·quiz JSON·Cron 보안 헤더 sanity check
- `after()` 비동기 전환·중복 세션 차단 등 복잡한 케이스는 Claude가 직접 처리

---

> 여러 AI 에이전트를 조율하는 멀티 에이전트 워크플로우를 기록한다.  
> ClassPilot Step 6 AI 연동 단계에서 실제 적용한 방식을 기반으로 한다.

---

## 1. Orchestra란

Orchestra는 **여러 AI 에이전트가 역할을 나눠 하나의 작업을 처리하는 워크플로우**다.

이 프로젝트에서의 역할 분담:

| 에이전트 | 역할 |
|---|---|
| **Codex** | 코드 구현 (API, 훅, 컴포넌트 작성) |
| **Claude (대화형)** | 설계 검토, 복잡한 문제 분석, 리뷰 |
| **Orchestra 서브에이전트** | 좁은 범위 분석·검토 보조 |

핵심 원칙:
- Orchestra 서브에이전트는 코드를 직접 수정하지 않는다
- 분석·검토·sanity check 역할만 담당
- 실제 구현은 Codex 또는 Claude가 맡는다

---

## 2. 역할 분담 기준

### Codex에 맡기는 것

- 범위가 명확하고 반복적인 구현
- 파일 write scope가 독립적인 작업
- 정해진 패턴을 따르는 CRUD, 훅, 화면 연결

### Claude에 맡기는 것

- 아키텍처 결정이 필요한 작업
- 여러 파일에 걸친 복잡한 버그 추적
- Codex 결과물 검토 및 수정
- AI 기능 설계 (Claude API 프롬프트 구조 등)

### Orchestra 서브에이전트에 맡기는 것

- API contract 검토 (입출력 형식 sanity check)
- 특정 파일/범위 분석 (코드 직접 수정 없이)
- 병합 전 잔여 리스크 확인
- 프롬프트 출력 형식 점검

---

## 3. ClassPilot Step 6 적용 사례

### 공용 인프라 단계 (foundation) — 순차 처리

Step 6 초반에는 공용 파일이 먼저 움직이므로 병렬화하지 않았다.

```
codex/step6-foundation (순차)
  → package.json
  → src/lib/ai/claude.ts
  → src/lib/ai/openai.ts
  → src/lib/ai/prompts.ts
  → prisma/schema.prisma
```

이 단계에서 Orchestra는:
- migration 리스크 검토
- prompt 파일 구조 검토
- Step 6 남은 범위 sanity check

### 병렬 구현 단계 — Codex 3갈래

foundation 머지 후, write scope가 분리된 3개 브랜치를 병렬 실행:

```
codex/step6-copilot-recording      → Copilot/Whisper 구현
codex/step6-reports-review-essay   → 리포트/복습/에세이 구현
codex/step6-churn-complaints       → 이탈예측/민원AI 구현
```

이 단계에서 Orchestra는 각 브랜치별로:
- SSE 응답 포맷 검토
- quiz JSON 형식 sanity check
- complaint 답변 tone 가이드 검토
- Cron 보안 헤더 리스크 검토

### 복잡한 구현 — Claude가 이어받기

Codex가 처리하기 어려운 케이스는 Claude가 직접 처리:

- `after()` 비동기 전환 (Whisper 동기→비동기)
- rate-limit 멀티 인스턴스 설계
- 중복 세션 차단 로직 (409 처리)
- 에러 fallback 패턴 설계

---

## 4. 실제 워크플로우 패턴

### 패턴 A — 단순 구현 (Codex만 사용)

```
요구사항 정의
    ↓
Codex 브랜치 생성 (codex/{step}-{name})
    ↓
Codex 구현
    ↓
tsc --noEmit 확인
    ↓
PR → develop 머지
```

### 패턴 B — 검토 포함 (Orchestra 추가)

```
요구사항 정의
    ↓
Orchestra: 설계·리스크 검토
    ↓
Codex 브랜치 생성
    ↓
Codex 구현
    ↓
Orchestra: API contract / 형식 sanity check
    ↓
PR → develop 머지
```

### 패턴 C — 복잡한 구현 (Claude 이어받기)

```
요구사항 정의
    ↓
Codex 초기 구현 (골격)
    ↓
Claude: 복잡한 로직 직접 처리
    ↓
tsc --noEmit + 기능 검증
    ↓
PR → develop 머지
```

---

## 5. Orchestra를 쓰면 안 되는 경우

- 같은 파일을 직접 수정하는 병렬 코드 작업
- 공용 인프라 파일 편집 (foundation 단계에서 충돌 위험)
- `teacher-pages.tsx` 같은 충돌 가능성이 높은 파일 동시 수정

**원칙:** Orchestra는 "분석·검토 보조", git worktree는 "실제 병렬 구현"이다.

---

## 6. 관련 문서

- `guides/codex/01_codex_작업_운영_방식.md` — Codex 단독 운영 방식
- `guides/git-worktree/01_병렬_worktree_운영_방식.md` — 병렬 worktree 전략
- `done/09_구현_로드맵/step별_구현/step6_ai_연동/step6_작업_운영_방식.md` — Step 6 실제 운영 기록 원본
