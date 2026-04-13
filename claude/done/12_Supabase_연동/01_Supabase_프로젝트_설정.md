# Supabase 프로젝트 설정

---

## 1. Supabase 프로젝트 생성

### 1.1 생성 단계

```
1. https://supabase.com 접속 → 로그인
2. "New Project" 클릭
3. 설정:
   - Organization: 선택 또는 생성
   - Project name: classpilot
   - Database password: 강력한 비밀번호 생성 (메모 필수!)
   - Region: Northeast Asia (ap-northeast-1) — 한국 가장 가까운 리전
   - Pricing: Free tier (개발 단계)
4. "Create new project" → 2~3분 대기
```

### 1.2 생성 후 확인

프로젝트 대시보드 → Settings → Database에서 아래 정보 확보:

```
Host:     db.xxxxxxxxxxxx.supabase.co
Port:     5432 (direct) / 6543 (pooling)
Database: postgres
User:     postgres
Password: (프로젝트 생성 시 설정한 비밀번호)
```

---

## 2. 환경변수 설정

### 2.1 CONNECTION STRING 구성

Supabase는 2가지 연결 방식 제공:

| 방식 | 포트 | 용도 |
|------|------|------|
| Direct | 5432 | 마이그레이션, seed 실행 |
| Pooling (Transaction) | 6543 | 서버리스 런타임 (Next.js API Routes) |

### 2.2 .env 파일 수정

```env
# ─── Database ───
# Direct 연결 (migrate, seed 용)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# Pooling 연결 (런타임 용) — prisma.config.ts에서 사용하지 않으면 생략 가능
# DIRECT_URL은 Prisma에서 마이그레이션 시 사용
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"

# ─── NextAuth ───
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="http://localhost:3001"
AUTH_TRUST_HOST="true"

# ─── Supabase Storage ───
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
NEXT_PUBLIC_SUPABASE_BUCKET="classpilot"

# ─── AI ───
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
```

### 2.3 prisma/schema.prisma 수정

현재:
```prisma
datasource db {
  provider = "postgresql"
}
```

변경:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // 마이그레이션 시 direct 연결 사용
}
```

> `directUrl`은 Supabase pooling 환경에서 마이그레이션이 connection pool을 통하지 않고 직접 연결하도록 함.

### 2.4 prisma.config.ts 확인

현재 이미 `dotenv/config`를 import하고 있어서 .env 파일을 자동으로 읽음:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

---

## 3. 연결 테스트

### 3.1 Prisma로 연결 확인

```bash
# 스키마 검증
npx prisma validate

# DB에 연결되는지 확인
npx prisma db pull
```

성공 시:
```
Prisma schema loaded from prisma/schema.prisma.
Environment variables loaded from .env
Datasource "db": PostgreSQL database "postgres"...
```

### 3.2 직접 연결 테스트 (선택)

```bash
# psql로 직접 확인 (psql 설치 필요)
psql "postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

---

## 4. Supabase 대시보드에서 확인할 것

| 메뉴 | 확인 내용 |
|------|---------|
| Settings → Database | Host, Port, Password |
| Settings → API | Project URL, anon key, service_role key |
| Storage | 버킷 목록 (03_Storage_설정에서 생성) |
| Table Editor | 마이그레이션 후 테이블 확인 |
| SQL Editor | 직접 쿼리 실행 가능 |

---

## 5. Free Tier 제한 사항

| 항목 | 제한 |
|------|------|
| DB 크기 | 500MB |
| Storage | 1GB |
| 파일 업로드 | 50MB/파일 |
| 월간 전송 | 5GB |
| 동시 연결 | ~50 |
| 일시정지 | 7일 미사용 시 자동 정지 (재활성 가능) |

> 개발 단계에서는 충분. 프로덕션 전환 시 Pro 플랜 ($25/월) 검토.

---

## 6. 문제 해결

### 연결 오류: "connection refused"
- Supabase 프로젝트가 일시정지 상태일 수 있음 → 대시보드에서 "Restore" 클릭
- Region 불일치 확인 (한국이면 ap-northeast-1 권장)

### 연결 오류: "password authentication failed"
- 프로젝트 비밀번호 재확인 (Settings → Database → Reset password)
- URL에서 비밀번호 특수문자 URL 인코딩 확인 (@ → %40 등)

### Prisma 오류: "P1001: Can't reach database server"
- VPN이 연결을 차단하고 있을 수 있음
- 방화벽 확인 (포트 5432, 6543 오픈 필요)
