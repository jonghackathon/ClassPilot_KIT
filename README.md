# ClassPilot

## 🚀 데모 바로 체험하기

> 아래 계정으로 즉시 로그인해 볼 수 있습니다. (비밀번호 공통: `1234`)

| 역할 | 이메일 / 로그인 정보 |
|------|----------------------|
| 학원관리자 (ADMIN) | `admin@academind.kr` |
| 강사 (TEACHER) | `teacher@academind.kr` |
| 수강생 (STUDENT) | 학원코드 `DEMO-1234` · 이름 검색 후 `민수` 선택 · PIN `1234` |

> 수강생은 `/login/student` 화면에서 학원코드 → 학생 선택 → PIN 순으로 입력합니다.

---

## 개요

ClassPilot은 학원 운영(관리자·강사·학생) 업무를 한 번에 처리할 수 있도록 만든 웹 기반 교육 관리 시스템입니다.  
출석, 수업/과제/피드백, 상담, 리포트, AI(코파일럿·녹음 요약·리포트 초안), 크런치(이탈 예측)까지 한 플랫폼에서 연결합니다.

- 프론트엔드: Next.js App Router + React 19
- 백엔드: Next.js API Route + Prisma + PostgreSQL
- 인증: NextAuth
- 상태관리/데이터 패칭: Zustand + SWR
- 검증: Zod
- AI: OpenAI Whisper, Anthropic Claude 연동
- 저장소 스타일: TypeScript/ESM, Tailwind 기반 UI

---

## 루트 디렉토리 구조

```text
ClassPilot
├─ academy_backup/               # 이전 버전 자산(백업/참고용)
├─ claude/                       # 문서·운영·워크플로우 중앙 저장소
├─ prisma/                       # Prisma 스키마, 마이그레이션, 시드
├─ public/                       # 정적 리소스
├─ src/                          # 애플리케이션 본문
└─ .env / .env.example           # 환경 변수
```

---

## `src/` 프로젝트 구조

```text
src/
├─ app/                          # App Router(페이지, 레이아웃, API)
│  ├─ (auth)/                   # 인증 화면 (로그인)
│  ├─ admin/                    # 관리자 화면/기능
│  ├─ teacher/                  # 강사용 화면/기능
│  ├─ student/                  # 학생 화면/기능
│  └─ api/                      # RESTful API 엔드포인트
├─ components/                   # 도메인별 UI 컴포넌트
│  ├─ admin / teacher / student  # 각 역할 중심 기능 컴포넌트
│  ├─ frontend                   # 역할 통합 화면 컴포넌트
│  ├─ ai                         # AI 보조 UI
│  ├─ ui                         # 공통 UI 컴포넌트
│  ├─ notifications              # 알림/토스트
│  └─ error                      # 에러 바운더리
├─ hooks/                        # 훅 계층 (SWR 기반 API 호출 캡슐화)
├─ lib/                          # 인증, DB, 정책, 유효성, 유틸, AI 공통 모듈
│  └─ ai/                       # AI provider/프롬프트/텍스트 추출 유틸
├─ store/                        # 글로벌 상태 (Zustand)
├─ types/                        # 공용 타입
└─ generated/                    # Prisma Client 생성물
```

현재 가장 큰 도메인은 다음과 같습니다.

- `attendance`: 출결/조회/정정
- `assignments`: 과제/제출/피드백
- `curriculum`, `classes`, `users`: 기본 학원 운영 데이터
- `consultations`, `payments`, `complaints`, `qna`, `reports`
- `copilot`, `recordings`, `churn`, `memo`, `week-notes`

---

## API/라우트 구조

`src/app/api`는 도메인별로 정리되어 있으며, 각 API는 다음 계층 패턴을 따릅니다.

1) 인증/권한 확인 (academy/role 기반 가드)  
2) 입력 검증 (Zod)  
3) Prisma 호출(트랜잭션/연결 검사)  
4) 비즈니스 규칙 적용 후 일관된 응답 포맷 반환  

대표 라우트 그룹:

- `src/app/api/attendance`
- `src/app/api/users`, `classes`, `curriculum`, `payments`
- `src/app/api/assignments`, `reviews`, `reports`
- `src/app/api/copilot`, `recordings`, `churn`
- `src/app/api/qna`, `bot-faq`, `bot-questions`

---

## `claude/` 폴더 구조 (중요)

```text
claude/
├─ README.md                     # AI/문서 운영 설명
├─ docs/                         # 기획·요구사항·설계 문서
│  ├─ 01_기획서.md
│  ├─ 02_기능_요구사항_정의서.md
│  ├─ 03_DB_스키마_설계서.md
│  ├─ 04_API_명세서.md
│  ├─ 05_시스템_아키텍처.md
│  └─ 화면_설계서/             # 화면별 문서화
├─ guides/                       # 작업 방식 가이드
│  ├─ claude-code/              # Claude Code 사용법/워크플로우
│  ├─ codex/                    # Codex 에이전트 운영 방식
│  ├─ git-worktree/             # 병렬 작업 운영 규칙
│  ├─ orchestra/                # 오케스트라 멀티-에이전트 규칙
│  └─ design-workflow/
├─ in-progress/                  # 현재 진행중 문서
├─ done/                         # 완료 작업 아카이브(로드맵/추가요구/UX/백엔드)
├─ 사용설명서/                  # 사용자 대상 가이드(학생/강사/관리자)
└─ templates/                    # 문서/작업 템플릿
```

`claude`는 단순 보조자료가 아니라 “현재 구현 상태 + 작업 전략 + QA 이력 + 설계 의사결정”의 실질 실행 기록 저장소입니다.

---

## 개발/운영 방식

- 브랜치 전략: `main`(배포) ← `develop`(통합) ← `codex/*`(작업 단위)
- 병렬 개발은 `git worktree`로 분리하여 라우트/파일 충돌을 줄입니다.
- `Claude` 문서에 기반해 Step 단위 진행 로그를 갱신하고, `develop` 머지 시점에서 상태표를 재동기화합니다.

주요 운영 문서

- `claude/guides/git-worktree/01_병렬_worktree_운영_방식.md`
- `claude/guides/orchestra/01_orchestra_운영_방식.md`
- `claude/guides/codex/01_codex_작업_운영_방식.md`

---

## 실행 방법

```bash
# 설치
npm install

# 개발 서버
npm run dev

# DB 반영/시드
npm run db:generate
npm run db:push
npm run db:seed

# 빌드/실행
npm run build
npm run start
```

---

## 체크리스트

- 환경변수: `DATABASE_URL`, `AUTH_*`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_*`, `CRON_SECRET`
- Prisma 마이그레이션은 브랜치 충돌 가능성이 있으므로 단계별로 적용
- API는 `academyId` 기반의 멀티테넌시 분리와 역할(Role) 권한 검사 우선 적용
- `src/app/(auth)`, `src/middleware.ts`에서 인증 흐름 확인
- 구현 진행은 `claude/done/09_구현_로드맵/step별_구현/구현_진행_로그.md` 중심으로 관리

---

## 비고

`academy_backup/`는 과거 산출물/비교 리소스로 유지되고 있으며, 현재 운영은 `src/`와 `claude/`에 맞춰 정리합니다.
 
