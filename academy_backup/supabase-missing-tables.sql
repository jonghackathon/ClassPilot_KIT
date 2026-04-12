create table if not exists memos (
  id         bigint primary key,
  title      text default '',
  content    text default '',
  category   text default '',
  created_at text not null,
  updated_at text not null,
  archived   boolean default false
);
alter table memos disable row level security;

create table if not exists report_data (
  student_id bigint not null references students(id) on delete cascade,
  month_str  text not null,
  comment    text default '',
  growth     text default '',
  primary key (student_id, month_str)
);
alter table report_data disable row level security;

create table if not exists app_settings (
  key   text primary key,
  value text default ''
);
alter table app_settings disable row level security;
