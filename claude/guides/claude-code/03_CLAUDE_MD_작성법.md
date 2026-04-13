# CLAUDE.md 작성법 가이드

## 1. CLAUDE.md란?

`CLAUDE.md`는 Claude Code가 프로젝트에서 작업할 때 **자동으로 읽는 인스트럭션 파일**입니다.
프로젝트의 규칙, 컨벤션, 빌드 방법 등을 기록하면 Claude가 이를 따릅니다.

> 사람에게 주는 온보딩 문서와 비슷하지만, AI에 최적화된 형태입니다.

---

## 2. 파일 위치 및 우선순위

Claude Code는 여러 위치의 CLAUDE.md를 **모두 로드**합니다:

```
~/.claude/CLAUDE.md                    ← 전역 (모든 프로젝트에 적용)
프로젝트/CLAUDE.md                     ← 프로젝트 루트 (가장 일반적)
프로젝트/src/CLAUDE.md                 ← 하위 디렉토리 (해당 경로 작업 시)
프로젝트/.claude/settings.json         ← 설정 기반 인스트럭션
```

### 로딩 순서
1. 전역 `~/.claude/CLAUDE.md`
2. 프로젝트 루트 `CLAUDE.md`
3. 현재 작업 디렉토리의 `CLAUDE.md` (있을 경우)
4. `@파일명`으로 참조된 추가 파일

### `@` 참조 문법

```markdown
<!-- CLAUDE.md -->
@AGENTS.md
@docs/coding-standards.md
```

이렇게 하면 해당 파일의 내용도 함께 로드됩니다.

---

## 3. 작성 원칙

### DO (권장)

- **구체적인 명령어 기록**: 빌드, 테스트, 린트 실행 방법
- **코드 컨벤션 명시**: 네이밍, 파일 구조, 패턴
- **금지사항 명시**: "~하지 마라" 형태의 명확한 지시
- **짧고 직접적으로**: 불필요한 설명 없이 핵심만
- **예시 포함**: 모호한 규칙보다 구체적 예시

### DON'T (비권장)

- 너무 긴 문서 (Claude의 컨텍스트를 낭비)
- 코드에서 이미 명확한 내용 반복
- 모호한 지시 ("좋은 코드를 작성하라")
- 자주 변하는 정보 (특정 PR 번호, 임시 이슈 등)

---

## 4. 실전 템플릿

### 기본 구조

```markdown
# 프로젝트명

## 빌드 & 실행

\`\`\`bash
npm install          # 의존성 설치
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm test             # 테스트 실행
npm run lint         # 린트 검사
\`\`\`

## 코드 스타일

- TypeScript strict 모드 사용
- 함수형 컴포넌트 + hooks 패턴 (class 컴포넌트 금지)
- 파일명: kebab-case (예: `user-profile.tsx`)
- 컴포넌트명: PascalCase (예: `UserProfile`)
- 유틸 함수: camelCase (예: `formatDate`)

## 프로젝트 구조

\`\`\`
src/
├── app/           # Next.js App Router 페이지
├── components/    # 재사용 컴포넌트
├── lib/           # 유틸리티, 헬퍼
├── hooks/         # 커스텀 React hooks
└── types/         # TypeScript 타입 정의
\`\`\`

## 규칙

- 새 API 엔드포인트 작성 시 반드시 입력 검증(zod) 포함
- DB 쿼리는 Prisma를 통해서만 수행
- 환경변수는 `.env.example`에 문서화
- 커밋 메시지는 conventional commits 형식
```

### 고급 예시: 금지사항 및 주의사항

```markdown
## 절대 하지 말 것

- `any` 타입 사용 금지. 반드시 구체적 타입 지정
- `console.log` 대신 프로젝트 로거 (`lib/logger.ts`) 사용
- API 라우트에서 try-catch 없이 async 함수 사용 금지
- `.env` 파일을 절대 커밋하지 않기

## 주의사항

- Next.js App Router 사용 중 — Pages Router 문법 사용 금지
- Prisma 스키마 변경 후 반드시 `npx prisma generate` 실행
- shadcn/ui 컴포넌트는 `components/ui/`에 위치
```

### 고급 예시: 외부 문서 참조

```markdown
@AGENTS.md
@docs/api-conventions.md

# ClassPilot

## 기술 스택
- Next.js 15 (App Router)
- Prisma + PostgreSQL
- shadcn/ui + Tailwind CSS
- NextAuth.js (인증)

## 빌드
\`\`\`bash
npm run dev
npm run build
npx prisma migrate dev
\`\`\`
```

---

## 5. AGENTS.md 활용

`AGENTS.md`는 CLAUDE.md에서 `@AGENTS.md`로 참조하여 사용하는 보조 파일입니다.
주로 **에이전트의 행동 규칙**을 정의합니다.

```markdown
<!-- AGENTS.md -->
# 코드 작성 규칙

이 프로젝트의 Next.js 버전은 최신 버전이며, 학습 데이터와 다를 수 있습니다.
코드 작성 전 `node_modules/next/dist/docs/`의 가이드를 먼저 확인하세요.

# 테스트 규칙

- 단위 테스트: Vitest 사용
- E2E 테스트: Playwright 사용
- 테스트 파일은 `__tests__/` 디렉토리에 위치
```

---

## 6. `/init` 커맨드로 자동 생성

```bash
# Claude Code 대화 중
/init
```

이 커맨드를 실행하면 Claude가 프로젝트를 분석하여 CLAUDE.md를 자동으로 생성합니다:
- package.json에서 빌드/테스트 스크립트 추출
- 프로젝트 구조 분석
- 코드 스타일 패턴 감지
- 사용 중인 프레임워크/라이브러리 식별

---

## 7. 팁

1. **점진적으로 추가**: 처음부터 완벽하게 쓰려 하지 말고, 작업하면서 필요한 규칙을 추가
2. **Claude에게 물어보기**: "이 프로젝트에서 주의할 점을 CLAUDE.md에 추가해줘"
3. **팀과 공유**: Git에 커밋하여 팀원 모두 동일한 Claude 경험 확보
4. **정기적 정리**: 더 이상 유효하지 않은 규칙은 삭제
5. **구체적 > 일반적**: "좋은 코드 작성" 보다 "함수는 30줄 이하로 유지"가 효과적
