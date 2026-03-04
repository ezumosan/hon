"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBook } from "@/lib/actions/books";
import type { BookInsert } from "@/types/book";

const defaultForm: BookInsert = {
  title: "",
  author: "",
  publisher: "",
  published_date: "",
  description: "",
  page_count: null,
  isbn_13: null,
  isbn_10: null,
  jan_code: null,
  cover_image_url: "",
  status: "unread",
  memo: "",
  rating: null,
};

export default function NewBookPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code");

  const [form, setForm] = useState<BookInsert>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ISBN/JAN コードが URL パラメータにあれば自動検索
  useEffect(() => {
    if (code) {
      lookupBook(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function lookupBook(isbn: string) {
    setLookupLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/books/lookup?code=${encodeURIComponent(isbn)}`
      );
      if (res.ok) {
        const data = await res.json();
        setForm({
          ...defaultForm,
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
        });
        setMessage({ type: "success", text: "書籍情報を自動取得しました" });
      } else {
        const err = await res.json();
        setMessage({
          type: "error",
          text: err.error || "書籍情報が見つかりませんでした",
        });
        // ISBN だけセット
        setForm((prev) => ({ ...prev, isbn_13: isbn }));
      }
    } catch {
      setMessage({ type: "error", text: "通信エラーが発生しました" });
    } finally {
      setLookupLoading(false);
    }
  }

  function updateField<K extends keyof BookInsert>(
    key: K,
    value: BookInsert[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setMessage({ type: "error", text: "タイトルは必須です" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await createBook(form);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "登録しました！" });
      // 一覧ページへ遷移
      setTimeout(() => router.push("/books"), 1000);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">📖 本を登録</h1>

      {/* ISBN 手動検索 */}
      {!code && (
        <div className="mb-6 rounded-lg border bg-white p-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            ISBN / JAN コードで検索
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="978-4-xxx-xxxxx-x"
              className="flex-1 rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const val = (e.target as HTMLInputElement).value
                    .replace(/[^0-9]/g, "");
                  if (val.length >= 10) lookupBook(val);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>(
                  'input[placeholder="978-4-xxx-xxxxx-x"]'
                );
                if (input) {
                  const val = input.value.replace(/[^0-9]/g, "");
                  if (val.length >= 10) lookupBook(val);
                }
              }}
              disabled={lookupLoading}
              className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900 disabled:opacity-50"
            >
              {lookupLoading ? "検索中…" : "検索"}
            </button>
          </div>
        </div>
      )}

      {lookupLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          書籍情報を取得しています…
        </div>
      )}

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-4 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 登録フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        {/* 書影プレビュー */}
        {form.cover_image_url && (
          <div className="flex justify-center">
            <img
              src={form.cover_image_url}
              alt="書影"
              className="h-48 rounded shadow"
            />
          </div>
        )}

        {/* タイトル */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 著者 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            著者
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => updateField("author", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 出版社 & 出版日 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              出版社
            </label>
            <input
              type="text"
              value={form.publisher}
              onChange={(e) => updateField("publisher", e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              出版日
            </label>
            <input
              type="text"
              value={form.published_date}
              onChange={(e) => updateField("published_date", e.target.value)}
              placeholder="2024-01-01"
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ISBN / JAN */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ISBN-13
            </label>
            <input
              type="text"
              value={form.isbn_13 || ""}
              onChange={(e) => updateField("isbn_13", e.target.value || null)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ISBN-10
            </label>
            <input
              type="text"
              value={form.isbn_10 || ""}
              onChange={(e) => updateField("isbn_10", e.target.value || null)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              JAN コード
            </label>
            <input
              type="text"
              value={form.jan_code || ""}
              onChange={(e) => updateField("jan_code", e.target.value || null)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* 概要 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            概要
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* ページ数 & ステータス */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ページ数
            </label>
            <input
              type="number"
              value={form.page_count ?? ""}
              onChange={(e) =>
                updateField(
                  "page_count",
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              読書ステータス
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value as "unread" | "reading" | "read"
                )
              }
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="unread">未読</option>
              <option value="reading">読書中</option>
              <option value="read">読了</option>
            </select>
          </div>
        </div>

        {/* 表紙画像URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            表紙画像 URL
          </label>
          <input
            type="url"
            value={form.cover_image_url}
            onChange={(e) => updateField("cover_image_url", e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            メモ
          </label>
          <textarea
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "登録中…" : "📚 登録する"}
          </button>
          <a
            href="/books"
            className="rounded-lg border border-gray-300 px-6 py-2.5 hover:bg-gray-100"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}
