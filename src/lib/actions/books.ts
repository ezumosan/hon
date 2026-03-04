"use server";

import { createClient } from "@/lib/supabase/server";
import { BookInsert, BookUpdate, Book } from "@/types/book";
import { revalidatePath } from "next/cache";

// ============================================================
// 蔵書 CRUD - Server Actions
// ============================================================

/** 本を登録する */
export async function createBook(data: BookInsert): Promise<{ book?: Book; error?: string }> {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .insert(data)
    .select()
    .single();

  if (error) {
    // 重複チェック
    if (error.code === "23505") {
      return { error: "この本は既に登録されています" };
    }
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/books");
  return { book };
}

/** 本を更新する */
export async function updateBook(
  id: string,
  data: BookUpdate
): Promise<{ book?: Book; error?: string }> {
  const supabase = await createClient();

  const { data: book, error } = await supabase
    .from("books")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return { book };
}

/** 本を削除する */
export async function deleteBook(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("books").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/books");
  return {};
}

/** 本の一覧を取得する */
export async function getBooks(opts?: {
  query?: string;
  genre?: string;
  status?: string;
  series?: string;
  shelfId?: string;
  unclassifiedOnly?: boolean;
}): Promise<{ books: Book[]; error?: string }> {
  const supabase = await createClient();

  let q = supabase
    .from("books")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.query) {
    q = q.or(
      `title.ilike.%${opts.query}%,author.ilike.%${opts.query}%,publisher.ilike.%${opts.query}%`
    );
  }
  if (opts?.genre) {
    q = q.eq("genre", opts.genre);
  }
  if (opts?.status) {
    q = q.eq("status", opts.status);
  }
  if (opts?.series) {
    q = q.eq("series_name", opts.series);
  }
  if (opts?.shelfId) {
    q = q.eq("shelf_id", opts.shelfId);
  }
  if (opts?.unclassifiedOnly) {
    q = q.eq("ai_classified", false);
  }

  const { data, error } = await q;

  if (error) return { books: [], error: error.message };
  return { books: data as Book[] };
}

/** 本を1件取得する */
export async function getBook(id: string): Promise<{ book?: Book; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { book: data as Book };
}

/** AI未分類の本を取得する */
export async function getUnclassifiedBooks(): Promise<{ books: Book[]; error?: string }> {
  return getBooks({ unclassifiedOnly: true });
}

/** シリーズ名一覧を取得する */
export async function getSeriesList(): Promise<{ series: string[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("series_name")
    .neq("series_name", "")
    .order("series_name");

  if (error) return { series: [], error: error.message };
  const unique = [...new Set((data as { series_name: string }[]).map((d) => d.series_name))];
  return { series: unique };
}

/** 本を本棚に入庫する（品数チェック・重複コピー対応） */
export async function assignBookToShelf(
  bookId: string,
  shelfId: string
): Promise<{ error?: string; warning?: string; duplicateCreated?: boolean }> {
  const supabase = await createClient();

  // 対象の本を取得
  const { data: book, error: bookErr } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single();

  if (bookErr || !book) return { error: "本が見つかりません" };

  // この本自体が既に同じ棚に入っている場合
  if (book.shelf_id === shelfId) {
    return { error: "この本は既にこの本棚に入庫されています" };
  }

  // この本がまだ棚に入っていない場合 → そのまま入庫
  if (!book.shelf_id) {
    const { error } = await supabase
      .from("books")
      .update({ shelf_id: shelfId })
      .eq("id", bookId);
    if (error) return { error: error.message };

    revalidateBookPaths(bookId);
    return {};
  }

  // この本が既に別の棚にある場合 → 品数チェック
  const quantity = book.quantity || 1;

  if (quantity <= 1) {
    // 所有1冊なのに既に棚にある → 移動のみ許可
    return {
      error: `この本は既に別の本棚に入庫済みです (所有数: ${quantity}冊)。移動する場合は一度出庫してください。`,
    };
  }

  // quantity > 1: 同じISBNの本が他に未入庫のコピーがあるか確認
  if (book.isbn_13) {
    const { data: copies } = await supabase
      .from("books")
      .select("id, shelf_id, quantity")
      .eq("isbn_13", book.isbn_13);

    // 未入庫のコピーがある場合はそちらを使う
    const unassigned = (copies || []).find((c) => !c.shelf_id && c.id !== bookId);
    if (unassigned) {
      const { error } = await supabase
        .from("books")
        .update({ shelf_id: shelfId })
        .eq("id", unassigned.id);
      if (error) return { error: error.message };

      revalidateBookPaths(unassigned.id);
      return { warning: "別のコピーを入庫しました" };
    }

    // 全コピーが入庫済み → 入庫済み数が合計品数未満なら、コピーを新規作成
    const totalQuantity = (copies || []).reduce((sum, c) => sum + ((c as unknown as Book).quantity || 1), 0);
    const shelvedCount = (copies || []).filter((c) => c.shelf_id !== null).length;

    if (shelvedCount >= totalQuantity) {
      return {
        error: `所有数(${totalQuantity}冊)は全て入庫済みです。品数を増やすか確認してください。`,
      };
    }
  }

  // 品数に余裕がある → コピーを分割して新しいレコードを作成
  // 元の本のquantityを1減らし、quantity=1の新レコードを作成
  const { error: updateErr } = await supabase
    .from("books")
    .update({ quantity: quantity - 1 })
    .eq("id", bookId);
  if (updateErr) return { error: updateErr.message };

  const newBook: Partial<Book> = {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    published_date: book.published_date,
    description: book.description,
    page_count: book.page_count,
    isbn_13: book.isbn_13,
    isbn_10: book.isbn_10,
    jan_code: book.jan_code,
    cover_image_url: book.cover_image_url,
    genre: book.genre,
    ai_classified: book.ai_classified,
    series_name: book.series_name,
    series_order: book.series_order,
    shelf_id: shelfId,
    quantity: 1,
    status: book.status,
    memo: book.memo ? `${book.memo}\n[複数所有コピー]` : "[複数所有コピー]",
    rating: book.rating,
  };

  const { error: insertErr } = await supabase
    .from("books")
    .insert(newBook);
  if (insertErr) {
    // ロールバック: quantityを元に戻す
    await supabase.from("books").update({ quantity }).eq("id", bookId);
    return { error: insertErr.message };
  }

  revalidateBookPaths(bookId);
  return { duplicateCreated: true, warning: "複数所有のため、コピーを分割して入庫しました" };
}

function revalidateBookPaths(bookId: string) {
  revalidatePath("/");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelves");
}

/** 本を本棚から出庫する */
export async function removeBookFromShelf(
  bookId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("books")
    .update({ shelf_id: null })
    .eq("id", bookId);

  if (error) return { error: error.message };

  revalidateBookPaths(bookId);
  return {};
}

/** ISBNで本を検索する（全コピー取得） */
export async function getBooksByIsbn(isbn: string): Promise<{ books: Book[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("isbn_13", isbn)
    .order("created_at", { ascending: true });

  if (error) return { books: [], error: error.message };
  return { books: (data || []) as Book[] };
}

/** ISBNで本を検索する */
export async function getBookByIsbn(isbn: string): Promise<{ book?: Book; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .eq("isbn_13", isbn)
    .single();

  if (error) return { error: error.message };
  return { book: data as Book };
}
