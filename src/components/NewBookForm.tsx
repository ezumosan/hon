"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBook } from "@/lib/actions/books";
import type { BookInsert } from "@/types/book";
import { GENRES } from "@/types/book";

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
  genre: "",
  status: "unread",
  memo: "",
  rating: null,
};

export default function NewBookForm() {
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
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>
        本を登録
      </h1>

      {/* ISBN 手動検索 */}
      {!code && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-4">
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            ISBN / JAN コードで検索
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="978-4-xxx-xxxxx-x"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {lookupLoading ? "検索中..." : "検索"}
            </button>
          </div>
        </div>
      )}

      {lookupLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-primary">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          書籍情報を取得しています...
        </div>
      )}

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-4 rounded-xl p-3 text-sm ${
            message.type === "success"
              ? "bg-primary/10 text-primary"
              : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 登録フォーム */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
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
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* 著者 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            著者
          </label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => updateField("author", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* 出版社 & 出版日 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              出版社
            </label>
            <input
              type="text"
              value={form.publisher}
              onChange={(e) => updateField("publisher", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              出版日
            </label>
            <input
              type="text"
              value={form.published_date}
              onChange={(e) => updateField("published_date", e.target.value)}
              placeholder="2024-01-01"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ISBN / JAN */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              ISBN-13
            </label>
            <input
              type="text"
              value={form.isbn_13 || ""}
              onChange={(e) => updateField("isbn_13", e.target.value || null)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              ISBN-10
            </label>
            <input
              type="text"
              value={form.isbn_10 || ""}
              onChange={(e) => updateField("isbn_10", e.target.value || null)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
              JAN コード
            </label>
            <input
              type="text"
              value={form.jan_code || ""}
              onChange={(e) => updateField("jan_code", e.target.value || null)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ジャンル */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            ジャンル
          </label>
          <select
            value={form.genre}
            onChange={(e) => updateField("genre", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">未分類</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* 概要 */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            概要
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* ページ数 & ステータス */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted-foreground">
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            >
              <option value="unread">未読</option>
              <option value="reading">読書中</option>
              <option value="read">読了</option>
            </select>
          </div>
        </div>

        {/* 表紙画像URL */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            表紙画像 URL
          </label>
          <input
            type="url"
            value={form.cover_image_url}
            onChange={(e) => updateField("cover_image_url", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* メモ */}
        <div>
          <label className="mb-1 block text-sm font-medium text-muted-foreground">
            メモ
          </label>
          <textarea
            value={form.memo}
            onChange={(e) => updateField("memo", e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
          <a
            href="/books"
            className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            キャンセル
          </a>
        </div>
      </form>
    </div>
  );
}
