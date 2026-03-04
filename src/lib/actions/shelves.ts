"use server";

import { createClient } from "@/lib/supabase/server";
import type { Shelf, ShelfInsert } from "@/types/book";
import { revalidatePath } from "next/cache";

/** 本棚一覧を取得 */
export async function getShelves(): Promise<{ shelves: Shelf[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .order("name");

  if (error) return { shelves: [], error: error.message };
  return { shelves: data as Shelf[] };
}

/** 本棚を1件取得 */
export async function getShelf(id: string): Promise<{ shelf?: Shelf; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { shelf: data as Shelf };
}

/** バーコードから本棚を検索 */
export async function getShelfByBarcode(barcode: string): Promise<{ shelf?: Shelf; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shelves")
    .select("*")
    .eq("barcode", barcode)
    .single();

  if (error) return { error: error.message };
  return { shelf: data as Shelf };
}

/** 本棚を作成 */
export async function createShelf(data: ShelfInsert): Promise<{ shelf?: Shelf; error?: string }> {
  const supabase = await createClient();
  const { data: shelf, error } = await supabase
    .from("shelves")
    .insert(data)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/shelves");
  return { shelf: shelf as Shelf };
}

/** 本棚を更新 */
export async function updateShelf(
  id: string,
  data: Partial<ShelfInsert>
): Promise<{ shelf?: Shelf; error?: string }> {
  const supabase = await createClient();
  const { data: shelf, error } = await supabase
    .from("shelves")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/shelves");
  return { shelf: shelf as Shelf };
}

/** 本棚を削除 */
export async function deleteShelf(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  // 本棚に入っている本の shelf_id を null にする
  await supabase
    .from("books")
    .update({ shelf_id: null })
    .eq("shelf_id", id);

  const { error } = await supabase.from("shelves").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/shelves");
  revalidatePath("/books");
  return {};
}
