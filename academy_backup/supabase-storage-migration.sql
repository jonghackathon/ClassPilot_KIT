-- ============================================================
-- Supabase Storage 연동 마이그레이션
-- SQL Editor에서 실행하세요.
-- ============================================================

-- 1. assignments 테이블에 image_urls 컬럼 추가
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb;

-- 2. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-images', 'assignment-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage 접근 정책 (인증 없이 업로드/조회/삭제 허용)
DROP POLICY IF EXISTS "Public select assignment images" ON storage.objects;
CREATE POLICY "Public select assignment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-images');

DROP POLICY IF EXISTS "Public insert assignment images" ON storage.objects;
CREATE POLICY "Public insert assignment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assignment-images');

DROP POLICY IF EXISTS "Public delete assignment images" ON storage.objects;
CREATE POLICY "Public delete assignment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'assignment-images');
