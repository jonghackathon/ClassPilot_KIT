# ClassPilot AI 워크플로우

ClassPilot 개발에서 AI 도구를 어떻게 활용했는지 체계적으로 기록한 폴더입니다.

---

## 폴더 구조

```
claude/
├── docs/          프로젝트 핵심 설계 문서 (기획·요구사항·DB·API·아키텍처)
├── guides/        AI 도구 활용 워크플로우 가이드
│   ├── claude-code/      Claude Code 기본 사용법
│   ├── codex/            Codex 에이전트 운영 방식
│   ├── git-worktree/     병렬 Git Worktree 전략
│   ├── orchestra/        멀티 에이전트 조율 패턴
│   └── design-workflow/  AI 디자인 워크플로우
├── in-progress/   현재 진행 중인 작업 문서
├── done/          완료된 작업 (Step 2~7, 이관, Supabase 연동 등)
└── templates/     작업 문서 템플릿
```

### in-progress/ 사용 방법

새 Step 또는 작업 단위를 시작할 때:
1. `in-progress/` 아래에 폴더 생성 (`14_다음작업/` 형태)
2. 작업 계획·진행 로그·운영 방식 문서를 여기서 작성
3. 작업이 완료되면 `done/`으로 폴더째 이동

```
in-progress/14_xxx/
  ├── 00_목차.md
  ├── 01_작업_계획.md
  └── 구현_진행_로그.md
```

> Step 2~13의 모든 작업 문서가 이 방식으로 관리됐으며, 완료 후 `done/`에 보관되어 있다.

---

## 핵심 문서 바로가기

| 목적 | 문서 |
|---|---|
| 프로젝트 개요 | `docs/01_기획서.md` |
| 기능 요구사항 | `docs/02_기능_요구사항_정의서.md` |
| DB 스키마 | `docs/03_DB_스키마_설계서.md` |
| API 명세 | `docs/04_API_명세서.md` |
| 시스템 아키텍처 | `docs/05_시스템_아키텍처.md` |
| 화면 설계서 | `docs/화면_설계서/` |
| AI 도구 활용법 | `guides/README.md` |
| Codex 운영 방식 | `guides/codex/01_codex_작업_운영_방식.md` |
| 병렬 구현 전략 | `guides/git-worktree/01_병렬_worktree_운영_방식.md` |
| 멀티 에이전트 | `guides/orchestra/01_orchestra_운영_방식.md` |
| 디자인 워크플로우 | `guides/design-workflow/01_AI_디자인_워크플로우.md` |

---

## 개발 워크플로우 요약

```
요구사항 정의 (Claude)
    ↓
화면 설계서 작성 (Claude)
    ↓
AI 디자인 시각화 (Stitch → Figma MCP)
    ↓
UI 구현 (Codex)
    ↓
백엔드 구현 (Codex + Git Worktree 병렬)
    ↓
복잡한 기능 처리 (Claude 이어받기)
    ↓
리뷰·검토 (Orchestra + Claude)
    ↓
PR → develop 머지
```

---

## Git 브랜치 규칙

```
codex/{step}-{작업-설명}   # Codex 에이전트 작업
develop                    # 통합 기준 브랜치
main                       # 배포 브랜치
```
