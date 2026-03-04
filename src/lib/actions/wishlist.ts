"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WishlistItem = {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn_13: string | null;
  cover_image_url: string;
  memo: string;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type WishlistInsert = Omit<WishlistItem, "id" | "created_at" | "updated_at">;

/** ほしい本リストを取得 */
export async function getWishlist(): Promise<{ items: WishlistItem[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return { items: [], error: error.message };
  return { items: (data || []) as WishlistItem[] };
}

/** ほしい本を追加 */
export async function addToWishlist(
  data: WishlistInsert
): Promise<{ item?: WishlistItem; error?: string }> {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("wishlist")
    .insert(data)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/wishlist");
  return { item: item as WishlistItem };
}

/** ほしい本を削除 */
export async function removeFromWishlist(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("wishlist").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wishlist");
  return {};
}

/** ほしい本の優先度を更新 */
export async function updateWishlistPriority(
  id: string,
  priority: number
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlist")
    .update({ priority })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/wishlist");
  return {};
}
