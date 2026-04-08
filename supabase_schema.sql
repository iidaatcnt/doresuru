-- Supabase の SQL Editor に貼り付けて実行してください

create table sticker_selections (
  id uuid default gen_random_uuid() primary key,
  nickname text unique not null,
  selected_ids jsonb not null default '[]',
  reorder_list jsonb not null default '[]',
  message text,
  is_confirmed boolean default false,
  updated_at timestamp with time zone default now()
);

-- RLS (Row Level Security) の設定
-- 誰でも読み書きできるように設定（テスト用）
alter table sticker_selections enable row level security;

create policy "Allow all access"
on sticker_selections
for all
using (true)
with check (true);
