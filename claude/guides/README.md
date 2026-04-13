# AI 워크플로우 가이드

ClassPilot 개발에서 실제 사용한 AI 도구 및 워크플로우 레퍼런스.

---

## 폴더 구조

| 폴더 | 설명 |
|---|---|
| `claude-code/` | Claude Code CLI 기본 사용법 (슬래시커맨드, MCP, Hooks 등) |
| `codex/` | Codex 에이전트 작업 운영 방식 (브랜치 전략, 작업 지시 방법) |
| `git-worktree/` | 병렬 Git Worktree 전략 (Step 4·5 실제 운영 기록) |
| `orchestra/` | 멀티 에이전트 조율 패턴 (Codex + Claude 역할 분담) |
| `design-workflow/` | AI 디자인 워크플로우 (요구사항 → Figma MCP → 코드) |
| `token-optimization/` | 토큰 최적화, 유지보수성 및 재현성 전략 |

---

## 빠른 참조

### 어떤 도구를 언제 쓰는가

```
새 기능 구현 (범위 명확)       → Codex
복잡한 버그 / 아키텍처 결정    → Claude (대화형)
병렬 구현이 필요한 대형 Step   → Git Worktree + Codex
검토·sanity check              → Orchestra 서브에이전트
초기 디자인                    → design-workflow 흐름
```

### 브랜치 명명

```
codex/{step}-{작업-설명}

예)
codex/step4-teacher-assignments
codex/step6-foundation
codex/step7-polish-seo
```

### Claude Code 실행

```bash
claude                    # 대화형 모드
claude "질문"             # 원샷 모드
claude -p "질문"          # 비대화형 모드
```

---

## 세부 가이드

### claude-code/

| 파일 | 내용 |
|---|---|
| `01_슬래시_커맨드_스킬.md` | 내장/커스텀 슬래시 커맨드, 스킬 시스템 |
| `02_MCP_서버_활용.md` | MCP 개념, 설정법, Figma MCP 포함 |
| `03_CLAUDE_MD_작성법.md` | 프로젝트 인스트럭션 파일 작성 가이드 |
| `04_Hooks_설정.md` | 이벤트 기반 자동화 훅 시스템 |
| `05_고급_워크플로우.md` | 멀티 에이전트, CI/CD, 메모리 시스템 |
| `06_단축키_팁.md` | 키보드 단축키, 생산성 팁 |

### codex/

| 파일 | 내용 |
|---|---|
| `01_codex_작업_운영_방식.md` | 브랜치 전략, 작업 지시 방법, 적합한 작업 유형 |

### git-worktree/

| 파일 | 내용 |
|---|---|
| `01_병렬_worktree_운영_방식.md` | Step 4·5 병렬 구현 실제 운영 기록 |

### orchestra/

| 파일 | 내용 |
|---|---|
| `01_orchestra_운영_방식.md` | 멀티 에이전트 역할 분담, Step 6 적용 사례 |

### design-workflow/

| 파일 | 내용 |
|---|---|
| `01_AI_디자인_워크플로우.md` | 요구사항 → 화면설계서 → Stitch → Figma MCP → 코드 전체 흐름 |

### token-optimization/

| 파일 | 내용 |
|---|---|
| `01_토큰_최적화_전략.md` | 컨텍스트 피라미드, /compact, 프롬프트 중앙관리, Fallback, SWR 캐싱, done/ 아카이브 |
