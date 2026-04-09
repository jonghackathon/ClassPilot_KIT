-- ============================================================
-- 데이터 동기화 마이그레이션 - 기기 간 동기화를 위한 새 테이블 추가
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.
-- ============================================================

-- 메모 (기존 localStorage → Supabase로 이전)
create table if not exists memos (
  id         bigint primary key,
  title      text default '',
  content    text default '',
  category   text default '기타',
  created_at text not null,
  updated_at text not null,
  archived   boolean default false
);
alter table memos disable row level security;

-- 리포트 데이터: 선생님 코멘트 + AI 성장평가 (localStorage → Supabase로 이전)
create table if not exists report_data (
  student_id bigint not null references students(id) on delete cascade,
  month_str  text not null,
  comment    text default '',
  growth     text default '',
  primary key (student_id, month_str)
);
alter table report_data disable row level security;

-- 앱 설정: 학원 로고 등 (localStorage → Supabase로 이전)
create table if not exists app_settings (
  key   text primary key,
  value text default ''
);
alter table app_settings disable row level security;
