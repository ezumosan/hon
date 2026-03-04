"use client";

import { useState, useCallback } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { createBook } from "@/lib/actions/books";
import type { BookInsert } from "@/types/book";

type RegisteredBook = {
  id: string;
  title: string;
  author: string;
  cover_image_url: string;
};

type ScanState =
  | { status: "scanning" }
  | { status: "processing"; code: string }
  | { status: "registered"; book: RegisteredBook; code: string; partial?: boolean }
  | { status: "error"; message: string; code: string };

export default function ScanPage() {
  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [history, setHistory] = useState<RegisteredBook[]>([]);
  const [manualCode, setManualCode] = useState("");

  const autoRegister = useCallback(async (code: string) => {
    setState({ status: "processing", code });

    try {
      const res = await fetch(
        `/api/books/lookup?code=${encodeURIComponent(code)}`
      );

      if (!res.ok) {
        const err = await res.json();
        setState({
          status: "error",
          message: err.error || "書籍情報が見つかりませんでした",
          code,
        });
        return;
      }

      const data = await res.json();
      const isPartial = data._partial === true;

      const bookData: BookInsert = {
        title: data.title || "",
        author: data.author || "",
        publisher: data.publisher || "",
        published_date: data.published_date || "",
        description: data.description || "",
        page_count: data.page_count ?? null,
        isbn_13: data.isbn_13 || null,
        isbn_10: data.isbn_10 || null,
        jan_code: null,
        cover_image_url: data.cover_image_url || "",
        genre: "",
        ai_classified: false,
        series_name: "",
        series_order: null,
        shelf_id: null,
        status: "unread",
        memo: "",
        rating: null,
      };

      const result = await createBook(bookData);

      if (result.error) {
        setState({ status: "error", message: result.error, code });
        return;
      }

      const registered: RegisteredBook = {
        id: result.book!.id,
        title: result.book!.title,
        author: result.book!.author,
        cover_image_url: result.book!.cover_image_url,
      };

      setState({
        status: "registered",
        book: registered,
        code,
        partial: isPartial,
      } as ScanState);
      setHistory((prev) => [registered, ...prev]);
    } catch {
      setState({ status: "error", message: "通信エラーが発生しました", code });
    }
  }, []);

  const handleScanSuccess = useCallback(
    (code: string) => {
      autoRegister(code);
    },
    [autoRegister]
  );

  const handleRescan = () => {
    setState({ status: "scanning" });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.replace(/[^0-9]/g, "");
    if (cleaned.length >= 10) {
      setManualCode("");
      autoRegister(cleaned);
    }
  };

  const isScanning = state.status === "scanning";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="16" x2="17" y2="16" /></svg>
        バーコードスキャン
      </h1>

      <BarcodeScanner onScanSuccess={handleScanSuccess} active={isScanning} />

      {/* 処理中 */}
      {state.status === "processing" && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <span className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-bold text-foreground">{state.code}</span>
          </p>
          <p className="mt-1 text-primary">書籍情報を取得して登録中...</p>
        </div>
      )}

      {/* 登録完了 */}
      {state.status === "registered" && (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg>
            登録しました
          </p>
          {state.partial && (
            <p className="mb-2 rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">
              書籍データベースに情報がなかったため、ISBNのみで仮登録しました。詳細ページからタイトルや著者を編集できます。
            </p>
          )}
          <div className="flex items-center gap-4">
            {state.book.cover_image_url && (
              <img src={state.book.cover_image_url} alt="書影" className="h-20 rounded-lg shadow" />
            )}
            <div>
              <p className="font-bold text-foreground">{state.book.title}</p>
              <p className="text-sm text-muted-foreground">{state.book.author}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{state.code}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRescan}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="16" x2="17" y2="16" /></svg>
              次の本をスキャン
            </button>
            <a
              href={`/books/${state.book.id}`}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              詳細を見る
            </a>
          </div>
        </div>
      )}

      {/* エラー */}
      {state.status === "error" && (
        <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
          <p className="mb-1 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            {state.message}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{state.code}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleRescan}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="16" x2="17" y2="16" /></svg>
              もう一度スキャン
            </button>
            <a
              href={`/books/new?code=${encodeURIComponent(state.code)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
              手動で登録
            </a>
          </div>
        </div>
      )}

      {/* 手動入力フォールバック */}
      <div className="mt-8 border-t border-border pt-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          ISBN / JAN コードを手入力
        </h2>
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
            登録
          </button>
        </form>
      </div>

      {/* 登録履歴 */}
      {history.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            今回登録した本（{history.length}冊）
          </h2>
          <ul className="space-y-2">
            {history.map((book) => (
              <li
                key={book.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {book.cover_image_url && (
                  <img src={book.cover_image_url} alt="" className="h-12 rounded-lg" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{book.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{book.author}</p>
                </div>
                <a
                  href={`/books/${book.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  詳細
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
