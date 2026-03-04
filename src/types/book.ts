/** books テーブルの行型定義 */
export type Book = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  published_date: string;
  description: string;
  page_count: number | null;
  isbn_13: string | null;
  isbn_10: string | null;
  jan_code: string | null;
  cover_image_url: string;
  status: "unread" | "reading" | "read";
  memo: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
};

/** 新規登録時の入力型（id, created_at, updated_at は自動生成） */
export type BookInsert = Omit<Book, "id" | "created_at" | "updated_at">;

/** 更新時の入力型（全フィールド任意） */
export type BookUpdate = Partial<BookInsert>;
