"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { removeFromWishlist, updateWishlistPriority } from "@/lib/actions/wishlist";
import type { WishlistItem } from "@/lib/actions/wishlist";

type Props = {
  items: WishlistItem[];
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "最優先",
  2: "高",
  3: "普通",
  4: "低",
  5: "いつか",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-500/10 text-red-600 dark:text-red-400",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  3: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  4: "bg-muted text-muted-foreground",
  5: "bg-muted text-muted-foreground",
};

export default function WishlistClient({ items }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("このアイテムを削除しますか?")) return;
    setDeletingId(id);
    await removeFromWishlist(id);
    router.refresh();
    setDeletingId(null);
  };

  const handlePriorityChange = async (id: string, priority: number) => {
    await updateWishlistPriority(id, priority);
    router.refresh();
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        <p className="text-muted-foreground">ほしい本リストは空です</p>
        <p className="mt-1 text-sm text-muted-foreground">
          バーコードスキャンまたは手動で追加できます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/20"
        >
          {item.cover_image_url ? (
            <img
              src={item.cover_image_url}
              alt={item.title}
              className="h-20 rounded-lg shadow"
            />
          ) : (
            <div className="flex h-20 w-14 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
              No Image
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.author}</p>
            {item.publisher && (
              <p className="text-xs text-muted-foreground">{item.publisher}</p>
            )}
            {item.memo && (
              <p className="mt-1 text-xs text-muted-foreground">{item.memo}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS[3]}`}>
                {PRIORITY_LABELS[item.priority] || "普通"}
              </span>
              <select
                value={item.priority}
                onChange={(e) => handlePriorityChange(item.id, Number(e.target.value))}
                className="rounded-lg border border-border bg-card px-2 py-0.5 text-xs text-foreground"
              >
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
              {item.isbn_13 && (
                <span className="font-mono text-xs text-muted-foreground">{item.isbn_13}</span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
            title="削除"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
