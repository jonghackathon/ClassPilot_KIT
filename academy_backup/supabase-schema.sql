create table if not exists students (
  id            bigint primary key,
  name          text not null,
  grade         text default '',
  class_name    text default '',
  memo          text default '',
  created_at    text default '',
  schedule_id   bigint
);

create table if not exists assignments (
  id            bigint primary key,
  student_id    bigint references students(id) on delete cascade,
  title         text not null,
  type          text default '',
  assigned_date text default '',
  teacher_note  text default '',
  created_at    text default '',
  image_urls    jsonb default '[]'::jsonb
);

alter table assignments
  add column if not exists image_urls jsonb default '[]'::jsonb;

create table if not exists schedule_items (
  id         bigint primary key,
  day        text default '',
  start_time text default '',
  end_time   text default '',
  title      text default '',
  note       text default '',
  color      text default 'indigo'
);

create table if not exists attendance_records (
  date             text   not null,
  student_id       bigint not null,
  status           text   not null default '',
  homework_status  text,
  homework_note    text   default '',
  absence_reason   text   default '',
  primary key (date, student_id)
);

create table if not exists week_notes (
  schedule_id text not null,
  week_start  text not null,
  text        text not null,
  primary key (schedule_id, week_start)
);

create table if not exists homework_records (
  date       text   not null,
  student_id bigint not null,
  done       text   not null,
  note       text   default '',
  primary key (date, student_id)
);

create table if not exists curriculum_classes (
  id         text primary key,
  name       text not null,
  stages     jsonb not null default '[]'::jsonb,
  sort_order integer default 0
);

create table if not exists memos (
  id         bigint primary key,
  title      text default '',
  content    text default '',
  category   text default '',
  created_at text not null,
  updated_at text not null,
  archived   boolean default false
);

create table if not exists report_data (
  student_id bigint not null references students(id) on delete cascade,
  month_str  text not null,
  comment    text default '',
  growth     text default '',
  primary key (student_id, month_str)
);

create table if not exists app_settings (
  key   text primary key,
  value text default ''
);

alter table students           disable row level security;
alter table assignments        disable row level security;
alter table schedule_items     disable row level security;
alter table attendance_records disable row level security;
alter table week_notes         disable row level security;
alter table homework_records   disable row level security;
alter table curriculum_classes disable row level security;
alter table memos              disable row level security;
alter table report_data        disable row level security;
alter table app_settings       disable row level security;

insert into storage.buckets (id, name, public)
values ('assignment-images', 'assignment-images', true)
on conflict (id) do nothing;

drop policy if exists "Public select assignment images" on storage.objects;
create policy "Public select assignment images"
  on storage.objects for select
  using (bucket_id = 'assignment-images');

drop policy if exists "Public insert assignment images" on storage.objects;
create policy "Public insert assignment images"
  on storage.objects for insert
  with check (bucket_id = 'assignment-images');

drop policy if exists "Public delete assignment images" on storage.objects;
create policy "Public delete assignment images"
  on storage.objects for delete
  using (bucket_id = 'assignment-images');
