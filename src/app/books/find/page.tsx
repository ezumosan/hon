"use client";

import { useState, useCallback } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { getBooksByIsbn } from "@/lib/actions/books";
import type { Book } from "@/types/book";
import Link from "next/link";

type BookWithShelf = Book & {
  shelfName?: string;
  shelfLocation?: string;
};

type FindState =
  | { status: "scanning" }
  | { status: "processing"; code: string }
  | { status: "found"; books: BookWithShelf[]; code: string }
  | { status: "not-found"; code: string }
  | { status: "error"; message: string; code: string };

export default function BookFinderPage() {
  const [state, setState] = useState<FindState>({ status: "scanning" });
  const [manualCode, setManualCode] = useState("");

  const lookupBook = useCallback(async (code: string) => {
    setState({ status: "processing", code });

    try {
      const { books, error } = await getBooksByIsbn(code);

      if (error || !books || books.length === 0) {
        setState({ status: "not-found", code });
        return;
      }

      // 各本の棚情報を取得
      const booksWithShelf: BookWithShelf[] = [];
      for (const book of books) {
        let shelfName: string | undefined;
        let shelfLocation: string | undefined;

        if (book.shelf_id) {
          const res = await fetch(`/api/shelves/${book.shelf_id}`);
          if (res.ok) {
            const shelf = await res.json();
            shelfName = shelf.name;
            shelfLocation = shelf.location;
          }
        }

        booksWithShelf.push({ ...book, shelfName, shelfLocation });
      }

      setState({ status: "found", books: booksWithShelf, code });
    } catch {
      setState({ status: "error", message: "通信エラーが発生しました", code });
    }
  }, []);

  const handleScanSuccess = useCallback(
    (code: string) => {
      lookupBook(code);
    },
    [lookupBook]
  );

  const handleRescan = () => setState({ status: "scanning" });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.replace(/[^0-9]/g, "");
    if (cleaned.length >= 10) {
      setManualCode("");
      lookupBook(cleaned);
    }
  };

  const isScanning = state.status === "scanning";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        本を探す
      </h1>

      <BarcodeScanner onScanSuccess={handleScanSuccess} active={isScanning} />

      {/* 処理中 */}
      {state.status === "processing" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <span className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-bold text-foreground">{state.code}</span>
          </p>
          <p className="mt-1 text-primary">検索中...</p>
        </div>
      )}

      {/* 見つかった */}
      {state.status === "found" && (
        <div className="mt-6 space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg>
            {state.books.length}件 見つかりました
          </p>
          {state.books.map((book) => (
            <div
              key={book.id}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {book.cover_image_url && (
                  <img src={book.cover_image_url} alt="書影" className="h-24 rounded-lg shadow" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-foreground">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  {book.quantity > 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">品数: {book.quantity}冊</p>
                  )}

                  {/* 所在情報 */}
                  <div className="mt-3 rounded-lg border border-border bg-card p-3">
                    {book.shelf_id ? (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">所在</p>
                        <p className="text-sm font-bold text-foreground">
                          {book.shelfName || "不明な本棚"}
                        </p>
                        {book.shelfLocation && (
                          <p className="text-xs text-muted-foreground">{book.shelfLocation}</p>
                        )}
                        <Link
                          href={`/shelves/${book.shelf_id}`}
                          className="mt-1 inline-block text-xs text-primary hover:underline"
                        >
                          本棚を見る
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">所在</p>
                        <p className="text-sm text-foreground">本棚に入庫されていません</p>
                      </div>
                    )}
                  </div>

                  {/* ジャンル・シリーズ */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {book.genre && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {book.genre}
                      </span>
                    )}
                    {book.series_name && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {book.series_name}
                        {book.series_order != null && ` 第${book.series_order}巻`}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      book.status === "read"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : book.status === "reading"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {book.status === "read" ? "読了" : book.status === "reading" ? "読書中" : "未読"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/books/${book.id}`}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  詳細を見る
                </Link>
              </div>
            </div>
          ))}

          <button
            onClick={handleRescan}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            別の本を探す
          </button>
        </div>
      )}

      {/* 見つからなかった */}
      {state.status === "not-found" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-foreground">この本は登録されていません</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{state.code}</p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleRescan}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              もう一度探す
            </button>
            <Link
              href={`/books/scan`}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              この本を登録する
            </Link>
          </div>
        </div>
      )}

      {/* エラー */}
      {state.status === "error" && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
          <p className="mb-1 text-sm font-medium text-red-700 dark:text-red-400">{state.message}</p>
          <button onClick={handleRescan} className="mt-2 text-sm text-red-500 underline">再試行</button>
        </div>
      )}

      {/* 手動入力 */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">ISBN を手入力して探す</h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="978-4-xxx-xxxxx-x"
            className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            検索
          </button>
        </form>
      </div>
    </div>
  );
}
