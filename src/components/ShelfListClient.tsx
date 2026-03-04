"use client";

import { useState } from "react";
import type { Shelf } from "@/types/book";
import { createShelf, deleteShelf } from "@/lib/actions/shelves";
import { useRouter } from "next/navigation";

type Props = {
  shelves: Shelf[];
  shelfBookCounts: Record<string, number>;
};

export default function ShelfListClient({ shelves, shelfBookCounts }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    // バーコードを自動生成 (SHELF-XXXXX)
    const barcode = `SHELF-${Date.now().toString(36).toUpperCase()}`;
    const result = await createShelf({ name: name.trim(), location: location.trim(), barcode });

    if (result.error) {
      setError(result.error);
    } else {
      setName("");
      setLocation("");
      setShowAddForm(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete(id: string, shelfName: string) {
    if (!confirm(`「${shelfName}」を削除しますか？\n入庫されている本は未配置になります。`)) return;
    const result = await deleteShelf(id);
    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      {/* 本棚一覧 */}
      {shelves.length === 0 && !showAddForm ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 h-12 w-12 text-muted-foreground">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          <p className="text-muted-foreground">本棚がまだありません</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            最初の本棚を追加する
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shelves.map((shelf) => (
            <div
              key={shelf.id}
              className="card-hover rounded-2xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{shelf.name}</h3>
                  {shelf.location && (
                    <p className="text-sm text-muted-foreground">{shelf.location}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(shelf.id, shelf.name)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                </button>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
                  {shelfBookCounts[shelf.id] || 0} 冊
                </span>
              </div>
              <p className="mb-3 font-mono text-xs text-muted-foreground">
                ID: {shelf.barcode}
              </p>
              <div className="flex gap-2">
                <a
                  href={`/shelves/${shelf.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  詳細を見る
                </a>
                <a
                  href={`/api/shelves/barcode-pdf?id=${shelf.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  target="_blank"
                >
                  バーコード
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 一括ダウンロード */}
      {shelves.length > 1 && (
        <div className="mt-4 text-center">
          <a
            href="/api/shelves/barcode-pdf?all=true"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            全バーコードを一括ダウンロード
          </a>
        </div>
      )}

      {/* 追加ボタン */}
      {!showAddForm && shelves.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          本棚を追加
        </button>
      )}

      {/* 追加フォーム */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mt-6 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-bold text-foreground">新しい本棚を追加</h3>
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">本棚名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: リビング本棚A"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">設置場所（任意）</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: リビング北側"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "追加中..." : "追加する"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setError(""); }}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                キャンセル
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
