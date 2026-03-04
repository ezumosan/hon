-- ============================================================
-- Migration v3: ISBN / JAN ユニークインデックスを削除
-- 同じ ISBN の本を複数冊所有できるようにする
-- ============================================================

-- ISBN-13 ユニークインデックスを削除
DROP INDEX IF EXISTS books_isbn13_unique;

-- JAN ユニークインデックスを削除
DROP INDEX IF EXISTS books_jan_unique;
