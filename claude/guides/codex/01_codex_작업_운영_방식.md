# Codex 작업 운영 방식

> 이 문서는 ClassPilot 프로젝트에서 Claude Code(Codex 에이전트)를 어떻게 활용했는지 기록한다.

---

## 1. Codex란

이 프로젝트에서 "Codex"는 **Claude Code를 에이전트 모드로 실행하여 특정 구현 작업을 자동으로 처리하는 방식**을 뜻한다.

- Claude Code CLI를 통해 작업 지시를 내리면, 에이전트가 자율적으로 파일을 분석하고 코드를 작성한다.
- 사람이 직접 라인 단위로 편집하지 않고, 요구사항과 범위만 지정한다.
- 결과물은 별도 브랜치로 격리해 리뷰 후 머지한다.

---

## 2. 브랜치 명명 규칙

```
codex/{step}-{작업-설명}
```

### 실제 사용 예

| 브랜치명 | 설명 |
|---|---|
| `codex/step4-teacher-assignments` | Step 4 강사 과제 API 구현 |
| `codex/step4-teacher-progress-bot` | Step 4 강사 진도/봇 API 구현 |
| `codex/step5-student-core` | Step 5 학생 핵심 기능 구현 |
| `codex/step6-foundation` | Step 6 AI 공용 인프라 구축 |
| `codex/step6-copilot-recording` | Step 6 Copilot·녹음 기능 구현 |
| `codex/step7-polish-seo` | Step 7 폴리싱 및 SEO 완료 |
| `codex/fix-teacher-progress-memo-lint` | 병합 후 lint 안정화 |

**규칙:**
- 기준 브랜치는 항상 `develop`
- `main`은 배포/기준 브랜치로만 사용
- 작업 완료 후 `develop`으로 PR → 머지

---

## 3. 작업 지시 방법

### 좋은 지시의 구성 요소

```
1. 목표 한 줄 요약
2. 담당 범위 (파일/폴더 경로)
3. 구현할 기능 목록
4. 금지 사항 또는 주의할 파일
5. 완료 기준
```

### 예시 — Step 4 강사 과제 지시

```
목표: teacher/assignments 페이지를 실데이터로 연결한다.

범위:
- src/app/api/assignments/**
- src/hooks/useAssignments.ts
- src/app/teacher/assignments/**

구현:
- 과제 목록/상세/생성/수정/삭제 API
- 피드백 작성 API
- teacher 과제 화면 실데이터 연결

주의:
- src/components/frontend/teacher-pages.tsx는 수정하지 않는다
- prisma/schema.prisma는 건드리지 않는다

완료 기준:
- npx tsc --noEmit 오류 0건
- 구현_진행_로그.md 해당 항목 체크
```

---

## 4. Codex가 잘 맞는 작업 유형

| 유형 | 예시 |
|---|---|
| **범위가 명확한 CRUD 구현** | 특정 도메인 API + hook + 화면 연결 |
| **반복 패턴 작업** | 여러 페이지에 동일한 패턴 적용 |
| **파일 단위 SEO/메타데이터 추가** | 모든 페이지에 metadata export |
| **린트/타입 오류 수정** | tsc --noEmit 실패 항목 처리 |
| **스타일 통일** | 폰트 교체, safe-area 적용 등 |

---

## 5. Claude가 더 적합한 작업 유형

| 유형 | 이유 |
|---|---|
| **아키텍처 결정** | 구조 전체를 이해하고 판단해야 함 |
| **복잡한 디버깅** | 여러 파일에 걸친 흐름 추적 필요 |
| **AI 기능 설계** | Claude API 활용 방식, 프롬프트 구조 설계 |
| **코드 리뷰** | 완성된 코드 전체 맥락 검토 |
| **문서 작성** | 판단과 요약이 필요한 작업 |

→ **Codex = 구현, Claude = 설계·리뷰** 분담이 기본 원칙이다.  
단, 복잡한 구현이거나 Codex 결과에 문제가 있을 때는 Claude가 이어받아 처리한다.

---

## 6. 작업 완료 체크리스트

```
- [ ] develop 최신화 후 브랜치 생성
- [ ] 작업 범위 파일 목록 사전 확인
- [ ] 구현 완료 후 npx tsc --noEmit 오류 0건
- [ ] 구현_진행_로그.md 해당 항목 체크
- [ ] PR 생성 → develop 머지
- [ ] 사용한 worktree가 있다면 즉시 정리
```
