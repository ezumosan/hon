-- read_at カラム追加: 読了日時を記録する
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS read_at timestamptz DEFAULT NULL;

-- 既存の読了済み書籍に updated_at を read_at として設定
UPDATE public.books
  SET read_at = updated_at
  WHERE status = 'read' AND read_at IS NULL;
