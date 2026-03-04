-- ============================================================
-- Migration V2: AI分類 + 本棚管理 + シリーズ管理
-- ============================================================

-- 1) books テーブルに新カラム追加
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS ai_classified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS series_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS series_order integer,
  ADD COLUMN IF NOT EXISTS shelf_id uuid;

-- 2) shelves テーブル: 本棚の管理
CREATE TABLE IF NOT EXISTS public.shelves (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,                            -- 本棚名（例: リビング棚A）
  location    text NOT NULL DEFAULT '',                 -- 設置場所
  barcode     text NOT NULL UNIQUE,                     -- 本棚識別バーコード (SHELF-xxxx)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to shelves" ON public.shelves
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at トリガー
CREATE TRIGGER set_shelves_updated_at
  BEFORE UPDATE ON public.shelves
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3) books.shelf_id に外部キー制約を追加
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'books_shelf_id_fkey'
  ) THEN
    ALTER TABLE public.books
      ADD CONSTRAINT books_shelf_id_fkey
      FOREIGN KEY (shelf_id) REFERENCES public.shelves(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) シリーズ名でのインデックス
CREATE INDEX IF NOT EXISTS books_series_name_idx ON public.books (series_name)
  WHERE series_name <> '';

-- 5) AI未分類のインデックス
CREATE INDEX IF NOT EXISTS books_ai_unclassified_idx ON public.books (ai_classified)
  WHERE ai_classified = false;
