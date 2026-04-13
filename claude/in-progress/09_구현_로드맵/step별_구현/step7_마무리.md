# Step 7: 마무리 (모바일 네비, 알림, 스켈레톤 UI, 에러처리, 배포)

**선행 조건:** Step 6 완료 (모든 기능 구현 후 폴리싱)
**작업 항목 수:** 15개 (기존 10 + 신규 5)
**예상 소요:** 3~4일

---

## 목표

모바일 대응, 로딩/에러 상태 처리, Vercel 배포를 완료하여 서비스를 출시 가능한 상태로 만든다.

---

## 작업 항목

| # | 항목 | 파일 | 설명 |
|---|------|------|------|
| 1 | 모바일 admin 햄버거 메뉴 | `src/components/layout/AdminMobileNav.tsx` | Sheet 컴포넌트로 오버레이 사이드바 |
| 2 | 모바일 teacher 하단 탭 | `src/components/layout/TeacherBottomNav.tsx` | 768px 이하 바텀 탭 전환 |
| 3 | safe-area-inset 대응 | `src/app/student/layout.tsx` | `env(safe-area-inset-bottom)` — iPhone 노치 |
| 4 | 알림 벨 드롭다운 | `src/app/api/notifications/route.ts` + `src/hooks/useNotifications.ts` | 최근 알림 5개 + 전체보기 |
| 5 | Skeleton 활용 점검 | `src/components/ui/skeleton.tsx` (**이미 존재**) | 각 데이터 로딩 구간에 실제 적용 여부 점검 |
| 6 | 빈 상태 (EmptyState) | `src/components/ui/EmptyState.tsx` | 데이터 0건일 때 안내 |
| 7 | 에러 처리 | `src/components/error/ErrorBoundary.tsx` + `src/app/error.tsx` | 401/403/404/500/네트워크 에러별 UI |
| 8 | 폰트 Pretendard | `src/app/layout.tsx` | Geist → Pretendard 교체 (`next/font`) |
| 9 | SEO 메타데이터 | 각 `page.tsx` | 페이지별 title, description |
| 10 | Vercel 배포 | `vercel.json` + `next.config.ts` + 환경변수 | 도메인 연결 + 프로덕션 최적화 |
| **11** | **🔴 녹음 파일 스토리지 전환** | `src/app/api/recordings/route.ts` | 로컬 `public/uploads` → Supabase Storage |
| **12** | **🟠 TypeScript 빌드 오류 수정** | 15개 파일 (`extractText`, `slug` 등) | `tsc --noEmit` 통과시켜야 Vercel 빌드 성공 |
| **13** | **🟡 중복 파일 정리** | `route 2.ts` 형태 파일 6개 | 공백 파일명 제거 |
| **14** | **🟡 환경변수 `.env.example` 보완** | `.env.example` | `CRON_SECRET` 누락 |
| **15** | **🟡 rate limiter 주의사항 문서화** | `src/lib/rate-limit.ts` | 멀티 인스턴스 시 Redis 전환 안내 |

---

## 배포 전 필수 수정 (블로커)

### 11. 녹음 파일 스토리지 전환 🔴

**문제:** `src/app/api/recordings/route.ts`의 `storeRecordingFile()`이 `public/uploads/recordings`(로컬 디스크)에 저장한다.
Vercel 서버리스 환경은 파일시스템이 **ephemeral** — 요청 간 파일이 유지되지 않는다.
`after()` 콜백에서 같은 파일을 `readFile()`로 읽으려 하면 파일을 찾지 못해 전사가 항상 FAILED가 된다.

**해결:** Supabase Storage로 전환. `.env.example`에 이미 설정값이 있다.

```bash
npm install @supabase/supabase-js
```

```typescript
// src/lib/storage.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function uploadRecording(buffer: Buffer, fileName: string, mimeType: string) {
  const { error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
    .upload(`recordings/${fileName}`, buffer, { contentType: mimeType, upsert: false })

  if (error) throw error

  const { data } = supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
    .getPublicUrl(`recordings/${fileName}`)

  return data.publicUrl
}

export async function downloadRecording(fileName: string) {
  const { data, error } = await supabase.storage
    .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET!)
    .download(`recordings/${fileName}`)

  if (error || !data) throw error ?? new Error('파일을 찾을 수 없습니다.')
  return Buffer.from(await data.arrayBuffer())
}
```

**수정 대상:** `src/app/api/recordings/route.ts`
- `storeRecordingFile()`: `writeFile()` → `uploadRecording()`, 반환 `audioUrl`은 Supabase public URL
- `after()` 내부: `readFile()` → `downloadRecording()`
- `import { mkdir, readFile, writeFile }` 제거, `publicRecordingDir` 상수 제거

---

### 12. TypeScript 빌드 오류 수정 🟠

`npx tsc --noEmit`에서 **15개 파일** 오류 발생. Vercel은 빌드 시 타입 체크를 실행하므로 전부 통과해야 한다.

#### 패턴 A — `extractText()` 타입 오류 (4개 파일 동일)

`messages.create()`는 `Message | Stream`을 반환하므로 `.content`가 없다는 타입 오류 발생.
`stream: false`를 명시하거나 리턴 타입을 `Message`로 단언한다.

```typescript
// 수정 전 (essays-feedback, complaints/ai-draft, reports/generate, reviews/generate)
const response = await client.messages.create({ ... })

// 수정 후 — stream을 쓰지 않으므로 false 명시
const response = await client.messages.create({ ..., stream: false })
```

또는 `extractText()` 헬퍼의 파라미터 타입을 `Message`로 좁힌다.

```typescript
import type { Message } from '@anthropic-ai/sdk/resources'

function extractText(response: Message): string {
  return response.content
    .filter((block): block is Extract<typeof block, { type: 'text' }> => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
}
```

이 헬퍼를 `src/lib/ai/extract-text.ts`로 추출하면 4개 파일 중복 제거까지 해결된다.

#### 패턴 B — Prisma 스키마 불일치 (개별 수정)

| 파일 | 오류 | 원인 | 수정 |
|------|------|------|------|
| `auth/register/route.ts:38` | `slug` 없음 | `Academy` 모델에 `slug` 필드 없음 | `slug` 라인 제거 |
| `bot-faq/route.ts:32,71` | `sortOrder` 없음 | `BotFAQ` 모델에 `sortOrder` 필드 없음 | `sortOrder` 라인 제거 |
| `attendance/[id]/route.ts:87` | `Date \| null \| undefined` 타입 | PATCH data에 nullable 날짜 전달 | `?? undefined` 처리 |
| `submissions/[submissionId]/route.ts:172` | `classId` 없음 | include에서 `classId` 대신 `class` 접근 | `.class.id` 로 수정 |
| `memo/[id]/route.ts:25` | `academyId` 없음 | teacher join 시 academyId select 누락 | teacher select에 `academyId` 추가 |
| `memo/route.ts:26,28` | `MemoWhereInput` 타입 불일치 | teacher 중첩 필터 구조 오류 | `teacher: { is: { academyId } }` 구조로 수정 |
| `churn/route.ts(복사본):36,50` | level enum 불일치 | `'LOW'\|'MEDIUM'\|'HIGH'` → 실제 `'SAFE'\|'WARNING'\|'DANGER'` | level 타입 수정 |
| `consultations/route.ts(복사본):103` | `ownerId` 없음 | Consultation 모델에 `ownerId` 없음 | 해당 필드 제거 |
| `reports/route.ts(복사본):69` | `teacherStudentIds` ReferenceError | Step 3에서 수정됐으나 복사본 파일에 남음 | 아래 13번 중복 파일 정리로 해결 |

---

### 13. 중복 파일 정리 🟡

아래 파일들이 이름에 공백이 포함된 복사본(`route 2.ts`)으로 존재하며 타입 오류를 2배로 발생시킨다.

```bash
# 삭제 대상
src/app/api/auth/register/route 2.ts
src/app/api/bot-faq/route 2.ts
src/app/api/churn/route 2.ts
src/app/api/consultations/route 2.ts
src/app/api/reports/route 2.ts
# (발견 시 추가)
```

```bash
# 일괄 삭제
find src -name "* 2.ts" -delete
```

---

### 14. 환경변수 `.env.example` 보완 🟡

현재 `.env.example`에 `CRON_SECRET`이 없다. `vercel.json`에서 `/api/churn/batch`를 매일 실행하므로 반드시 추가해야 한다.

```env
# Vercel Cron 인증
CRON_SECRET="generate-with-openssl-rand-base64-32"
```

Vercel 대시보드 환경변수에도 동일하게 설정해야 Cron Job이 인증을 통과한다.

---

### 15. rate-limit.ts — 멀티 인스턴스 주의사항 🟡

`src/lib/rate-limit.ts`의 `store`는 `Map` (in-memory). Vercel 멀티 인스턴스 환경에서는 인스턴스별로 카운터가 분리되므로 실질적인 제한 효과가 희석된다.

**단기:** 현재 구현 유지. 단일 인스턴스 범위에서 최소한의 보호 제공.  
**중장기:** `@vercel/kv` 또는 Upstash Redis로 전환.

```typescript
// 전환 시 예시 (src/lib/rate-limit.ts)
import { kv } from '@vercel/kv'

const count = await kv.incr(key)
if (count === 1) await kv.expire(key, Math.ceil(options.windowMs / 1000))
```

---

## 모바일 대응 체크리스트

### Admin (운영자)
- [ ] 햄버거 버튼 클릭 → Sheet 사이드바 열기
- [ ] 메뉴 항목 클릭 → Sheet 닫기 + 페이지 이동

### Teacher (강사)
- [ ] 768px 이하 하단 탭은 존재하므로, 전체 메뉴 전략과 활성 상태를 최종 점검
- [ ] 현재 활성 탭 하이라이트

### Student (수강생)
- [ ] 바텀 탭 4개 (홈/과제/출석/질문)
- [ ] iPhone safe area inset 최종 점검

---

## 에러 처리 케이스

| 상태코드 | 처리 |
|---------|------|
| 401 Unauthorized | 로그인 페이지로 리다이렉트 |
| 403 Forbidden | "접근 권한이 없습니다" 토스트 |
| 404 Not Found | 커스텀 404 페이지 |
| 500 Server Error | "서버 오류가 발생했습니다" + 재시도 버튼 |
| 네트워크 에러 | "인터넷 연결을 확인해주세요" 토스트 |
| 429 Rate Limit | "잠시 후 다시 시도해 주세요" 토스트 |

---

## Vercel 배포 체크리스트

- [ ] 환경변수 전체 설정 (`DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
- [ ] **`CRON_SECRET` 설정** (누락 시 이탈 예측 Cron 인증 실패)
- [ ] **`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_BUCKET` 설정** (녹음 파일 스토리지)
- [ ] `DATABASE_URL` connection pooling 모드로 설정 (Supabase Transaction Pooler)
- [ ] **`npx tsc --noEmit` 오류 0건 확인** (빌드 전 필수)
- [ ] **중복 `route 2.ts` 파일 삭제 확인**
- [ ] Vercel Cron Jobs 설정 확인 (이탈 예측 배치: 매일 오전 1시)
- [ ] 도메인 연결
- [ ] 빌드 성공 확인

---

## 결과물

- 모바일에서 사용 가능한 UI (admin/teacher/student 전체)
- 로딩/에러 상태 처리 완료
- TypeScript 빌드 오류 0건
- Vercel 배포 완료, 데모 URL 확보
