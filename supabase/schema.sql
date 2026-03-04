-- ============================================================
-- 蔵書管理システム (Hon) - Supabase テーブルスキーマ
-- ============================================================

-- 1. UUID 拡張を有効化（Supabase ではデフォルトで有効だが念のため）
create extension if not exists "uuid-ossp";

-- ============================================================
-- books テーブル: 蔵書の基本情報を管理
-- ============================================================
create table public.books (
  id          uuid primary key default uuid_generate_v4(),

  -- 書誌情報
  title       text        not null,                     -- タイトル
  author      text        not null default '',          -- 著者名（複数著者はカンマ区切り）
  publisher   text        not null default '',          -- 出版社
  published_date text     not null default '',          -- 出版日（API の返却形式に幅があるため text）
  description text        not null default '',          -- 概要・あらすじ
  page_count  integer,                                  -- ページ数

  -- 識別コード
  isbn_13     text,                                     -- ISBN-13
  isbn_10     text,                                     -- ISBN-10
  jan_code    text,                                     -- JAN コード（ISBN と異なる場合）

  -- 画像
  cover_image_url text    not null default '',          -- 表紙画像 URL

  -- ジャンル
  genre       text        not null default '',          -- ジャンル（文学, ビジネス, 技術, etc.）

  -- 管理情報
  status      text        not null default 'unread'     -- 'unread' | 'reading' | 'read'
    check (status in ('unread', 'reading', 'read')),
  memo        text        not null default '',          -- ユーザーメモ
  rating      smallint    check (rating between 1 and 5), -- 5 段階評価 (null = 未評価)

  -- メタ
  created_at  timestamptz not null default now(),       -- 登録日時
  updated_at  timestamptz not null default now()        -- 更新日時
);

-- 同じ ISBN / JAN の本を複数所有できるようにユニークインデックスは作成しない
-- (quantity フィールドで品数を管理する)

-- タイトル・著者でのあいまい検索用トライグラムインデックス（任意）
-- create extension if not exists pg_trgm;
-- create index books_title_trgm on public.books using gin (title gin_trgm_ops);
-- create index books_author_trgm on public.books using gin (author gin_trgm_ops);

-- updated_at を自動更新するトリガー
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.books
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
-- 家庭内利用のためシンプルに「認証済みユーザーは全行にアクセス可能」とする。
-- 将来的にユーザーごとの本棚を分けたい場合は user_id カラムを追加して
-- ポリシーを user_id = auth.uid() に変更する。

alter table public.books enable row level security;

-- 家庭内利用のため全アクセスを許可
-- 将来認証を追加する場合は auth.role() = 'authenticated' に変更する
create policy "Allow all access"
  on public.books
  for all
  using (true)
  with check (true);
