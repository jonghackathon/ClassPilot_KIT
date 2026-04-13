-- ================================================================
-- attendance_records 테이블 컬럼 추가 및 수정
-- Supabase Dashboard → SQL Editor에서 실행하세요
-- ================================================================

-- status 컬럼에 DEFAULT '' 추가 (NOT NULL + DEFAULT 없으면 homework/absence 저장 시 오류 발생)
ALTER TABLE attendance_records
  ALTER COLUMN status SET DEFAULT '';

-- 3개 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS homework_status text,           -- 과제 완료 여부 (O / X)
  ADD COLUMN IF NOT EXISTS homework_note   text DEFAULT '', -- 과제 미완료 사유
  ADD COLUMN IF NOT EXISTS absence_reason  text DEFAULT ''; -- 결석/지각/조퇴 사유

-- ================================================================
-- 기존 homework_records 데이터 마이그레이션 (선택사항)
-- homework_records 테이블에 기존 데이터가 있다면 아래 SQL도 실행하세요
-- ================================================================

-- INSERT INTO attendance_records (date, student_id, status, homework_status, homework_note)
-- SELECT date, student_id, '', done, COALESCE(note, '')
-- FROM homework_records
-- ON CONFLICT (date, student_id) DO UPDATE
--   SET homework_status = EXCLUDED.homework_status,
--       homework_note   = EXCLUDED.homework_note;
