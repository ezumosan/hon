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
  | { status: "registered"; book: RegisteredBook; code: string }
  | { status: "error"; message: string; code: string };

export default function ScanPage() {
  const [state, setState] = useState<ScanState>({ status: "scanning" });
  const [history, setHistory] = useState<RegisteredBook[]>([]);
  const [manualCode, setManualCode] = useState("");

  const autoRegister = useCallback(async (code: string) => {
    setState({ status: "processing", code });

    try {
      // 1. 書籍情報を取得
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

      // 2. Supabase に自動登録
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

      setState({ status: "registered", book: registered, code });
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
      <h1 className="mb-6 text-2xl font-bold">📷 バーコードスキャン</h1>

      {/* スキャナー */}
      <BarcodeScanner
        onScanSuccess={handleScanSuccess}
        active={isScanning}
      />

      {/* 処理中 */}
      {state.status === "processing" && (
        <div className="mt-6 rounded-lg border bg-white p-6 text-center shadow-sm">
          <span className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-600">
            <span className="font-mono font-bold">{state.code}</span>
          </p>
          <p className="mt-1 text-blue-600">書籍情報を取得して登録中…</p>
        </div>
      )}

      {/* 登録完了 */}
      {state.status === "registered" && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="mb-2 text-sm font-medium text-green-700">
            ✅ 登録しました！
          </p>
          <div className="flex items-center gap-4">
            {state.book.cover_image_url && (
              <img
                src={state.book.cover_image_url}
                alt="書影"
                className="h-20 rounded shadow"
              />
            )}
            <div>
              <p className="font-bold">{state.book.title}</p>
              <p className="text-sm text-gray-600">{state.book.author}</p>
              <p className="mt-1 font-mono text-xs text-gray-400">
                {state.code}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleRescan}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              📷 次の本をスキャン
            </button>
            <a
              href={`/books/${state.book.id}`}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              詳細を見る
            </a>
          </div>
        </div>
      )}

      {/* エラー */}
      {state.status === "error" && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="mb-1 text-sm font-medium text-red-700">❌ {state.message}</p>
          <p className="font-mono text-xs text-gray-500">{state.code}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleRescan}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              📷 もう一度スキャン
            </button>
            <a
              href={`/books/new?code=${encodeURIComponent(state.code)}`}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              ✏️ 手動で登録
            </a>
          </div>
        </div>
      )}

      {/* 手動入力フォールバック */}
      <div className="mt-8 border-t pt-6">
        <h2 className="mb-3 text-lg font-semibold">
          ISBN / JAN コードを手入力
        </h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="978-4-xxx-xxxxx-x"
            className="flex-1 rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
          >
            登録
          </button>
        </form>
      </div>

      {/* 登録履歴 */}
      {history.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h2 className="mb-3 text-lg font-semibold">
            📚 今回登録した本（{history.length}冊）
          </h2>
          <ul className="space-y-2">
            {history.map((book) => (
              <li
                key={book.id}
                className="flex items-center gap-3 rounded-lg border bg-white p-3"
              >
                {book.cover_image_url && (
                  <img
                    src={book.cover_image_url}
                    alt=""
                    className="h-12 rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{book.title}</p>
                  <p className="truncate text-sm text-gray-500">
                    {book.author}
                  </p>
                </div>
                <a
                  href={`/books/${book.id}`}
                  className="text-sm text-blue-600 hover:underline"
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
