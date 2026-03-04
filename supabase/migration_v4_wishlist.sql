-- ============================================================
-- Migration v4: ほしい本リスト (wishlist) テーブル追加
-- ============================================================

create table if not exists public.wishlist (
  id          uuid primary key default uuid_generate_v4(),
  title       text        not null,
  author      text        not null default '',
  publisher   text        not null default '',
  isbn_13     text,
  cover_image_url text    not null default '',
  memo        text        not null default '',
  priority    smallint    not null default 3
    check (priority between 1 and 5),              -- 1=最高 5=最低
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at トリガー
create trigger set_wishlist_updated_at
  before update on public.wishlist
  for each row
  execute function public.handle_updated_at();

-- RLS
alter table public.wishlist enable row level security;

create policy "Allow all access on wishlist"
  on public.wishlist
  for all
  using (true)
  with check (true);
