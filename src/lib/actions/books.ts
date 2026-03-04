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
