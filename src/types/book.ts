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
  genre: string;
  ai_classified: boolean;
  series_name: string;
  series_order: number | null;
  shelf_id: string | null;
  quantity: number;
  status: "unread" | "reading" | "read";
  memo: string;
  rating: number | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

/** shelves テーブルの行型定義 */
export type Shelf = {
  id: string;
  name: string;
  location: string;
  barcode: string;
  created_at: string;
  updated_at: string;
};

/** 新規登録時の入力型（id, created_at, updated_at は自動生成） */
export type BookInsert = Omit<Book, "id" | "created_at" | "updated_at" | "read_at">;

/** 更新時の入力型（全フィールド任意） */
export type BookUpdate = Partial<BookInsert>;

/** 本棚の挿入型 */
export type ShelfInsert = Omit<Shelf, "id" | "created_at" | "updated_at">;

/** ジャンル一覧 */
export const GENRES = [
  "文学・小説",
  "ビジネス・経済",
  "自己啓発",
  "技術・IT",
  "科学・数学",
  "歴史・地理",
  "芸術・デザイン",
  "漫画・コミック",
  "ライトノベル",
  "趣味・実用",
  "教育・学参",
  "健康・医学",
  "料理・グルメ",
  "旅行・ガイド",
  "絵本・児童書",
  "その他",
] as const;
