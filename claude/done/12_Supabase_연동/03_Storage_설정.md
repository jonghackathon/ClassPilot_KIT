# Supabase Storage 설정

---

## 1. 용도

| 버킷 | 저장 대상 | 접근 |
|------|---------|------|
| `assignments` | 과제 이미지 (학생 글 사진, AI 첨삭용) | 강사 업로드, 학생 조회 |
| `recordings` | 수업 녹음 파일 (mp3, m4a, wav) | 강사 업로드 |
| `academy` | 학원 로고, 보고서 첨부 | 운영자 업로드, 전체 조회 |

---

## 2. Supabase Storage 버킷 생성

### 2.1 대시보드에서 생성

```
Supabase 대시보드 → Storage → "New bucket"

버킷 1: assignments
  - Public: No (인증 필요)
  - File size limit: 10MB
  - Allowed MIME types: image/jpeg, image/png, image/webp

버킷 2: recordings
  - Public: No
  - File size limit: 100MB
  - Allowed MIME types: audio/mpeg, audio/mp4, audio/wav, audio/x-m4a

버킷 3: academy
  - Public: Yes (로고는 공개)
  - File size limit: 5MB
  - Allowed MIME types: image/jpeg, image/png, image/svg+xml, image/webp
```

### 2.2 SQL로 생성 (대안)

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('assignments', 'assignments', false, 10485760, '{"image/jpeg","image/png","image/webp"}'),
  ('recordings', 'recordings', false, 104857600, '{"audio/mpeg","audio/mp4","audio/wav","audio/x-m4a"}'),
  ('academy', 'academy', true, 5242880, '{"image/jpeg","image/png","image/svg+xml","image/webp"}');
```

---

## 3. Storage 정책 (RLS)

### 3.1 assignments 버킷

```sql
-- 강사: 업로드 가능
CREATE POLICY "Teachers can upload assignment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignments'
  AND (auth.jwt() ->> 'role') IN ('ADMIN', 'TEACHER')
);

-- 인증된 사용자: 조회 가능
CREATE POLICY "Authenticated users can view assignment images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments');

-- 강사: 삭제 가능
CREATE POLICY "Teachers can delete assignment images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignments'
  AND (auth.jwt() ->> 'role') IN ('ADMIN', 'TEACHER')
);
```

### 3.2 recordings 버킷

```sql
-- 강사만 업로드/조회/삭제
CREATE POLICY "Teachers manage recordings"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'recordings'
  AND (auth.jwt() ->> 'role') IN ('ADMIN', 'TEACHER')
);
```

### 3.3 academy 버킷

```sql
-- 누구나 조회 (public)
CREATE POLICY "Public can view academy assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'academy');

-- 운영자만 업로드
CREATE POLICY "Admins can upload academy assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'academy'
  AND (auth.jwt() ->> 'role') = 'ADMIN'
);
```

---

## 4. 클라이언트 설정

### 4.1 패키지 설치

```bash
npm install @supabase/supabase-js
```

### 4.2 Supabase 클라이언트 생성

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// 서버 사이드 (service_role — RLS 우회)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// 클라이언트 사이드 (anon key — RLS 적용)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
```

### 4.3 .env 추가 필요

```env
# .env에 추가
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."   # Settings → API → anon key
```

---

## 5. 업로드 유틸리티

### 5.1 이미지 업로드 (과제용)

```typescript
// src/lib/storage.ts
import { supabaseAdmin } from './supabase'

export async function uploadAssignmentImage(
  file: File,
  assignmentId: string,
  index: number,
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${assignmentId}/${Date.now()}-${index}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('assignments')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`업로드 실패: ${error.message}`)

  const { data } = supabaseAdmin.storage
    .from('assignments')
    .getPublicUrl(path)

  return data.publicUrl
}
```

### 5.2 녹음 업로드

```typescript
export async function uploadRecording(
  file: File,
  lessonId: string,
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${lessonId}/${Date.now()}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('recordings')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) throw new Error(`업로드 실패: ${error.message}`)

  const { data } = supabaseAdmin.storage
    .from('recordings')
    .getPublicUrl(path)

  return data.publicUrl
}
```

### 5.3 로고 업로드

```typescript
export async function uploadLogo(
  file: File,
  academyId: string,
): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `logos/${academyId}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('academy')
    .upload(path, file, {
      contentType: file.type,
      upsert: true,  // 로고는 덮어쓰기
    })

  if (error) throw new Error(`업로드 실패: ${error.message}`)

  const { data } = supabaseAdmin.storage
    .from('academy')
    .getPublicUrl(path)

  return data.publicUrl
}
```

---

## 6. API 라우트에서 사용

### 과제 이미지 업로드 API

```typescript
// src/app/api/assignments/[id]/images/route.ts
import { uploadAssignmentImage } from '@/lib/storage'

export async function POST(request: Request) {
  const formData = await request.formData()
  const files = formData.getAll('files') as File[]
  const assignmentId = /* params에서 추출 */

  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    const url = await uploadAssignmentImage(files[i], assignmentId, i)
    urls.push(url)
  }

  // Assignment의 imageUrls에 추가
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { imageUrls: { push: urls } },
  })

  return successResponse({ urls })
}
```

---

## 7. 파일 크기 제한

| 버킷 | 제한 | 근거 |
|------|------|------|
| assignments | 10MB/파일 | 스마트폰 사진 평균 3~5MB |
| recordings | 100MB/파일 | 90분 수업 녹음 약 50~80MB |
| academy | 5MB/파일 | 로고 이미지 |
| Free tier 총합 | 1GB | Supabase 무료 한도 |
