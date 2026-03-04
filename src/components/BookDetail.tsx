"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Book, BookUpdate } from "@/types/book";
import { GENRES } from "@/types/book";
import { updateBook, deleteBook } from "@/lib/actions/books";
import BookCoverImage from "@/components/BookCoverImage";

const STATUS_LABELS: Record<string, string> = {
  unread: "未読",
  reading: "読書中",
  read: "読了",
};

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-muted text-muted-foreground",
  reading: "bg-accent/15 text-accent",
  read: "bg-primary/15 text-primary",
};

export default function BookDetail({ book }: { book: Book }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<BookUpdate>({
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    published_date: book.published_date,
    description: book.description,
    page_count: book.page_count,
    genre: book.genre,
    status: book.status,
    memo: book.memo,
    rating: book.rating,
    cover_image_url: book.cover_image_url,
  });

  function updateField<K extends keyof BookUpdate>(key: K, value: BookUpdate[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    setMessage(null);
    const result = await updateBook(book.id, form);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "更新しました" });
      setIsEditing(false);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("この本を削除しますか？")) return;
    setDeleting(true);
    const result = await deleteBook(book.id);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
      setDeleting(false);
    } else {
      router.push("/books");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl"
    >
      {/* Back link */}
      <Link href="/books" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
        蔵書一覧に戻る
      </Link>

      {/* Message */}
      {message && (
        <div className={`mb-4 rounded-xl p-3 text-sm ${message.type === "success" ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500"}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Header section */}
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="relative aspect-[2/3] w-40 overflow-hidden rounded-xl bg-muted shadow-lg">
              <BookCoverImage
                src={book.cover_image_url}
                isbn={book.isbn_13}
                alt={book.title}
                iconSize="lg"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[book.status]}`}>
                {STATUS_LABELS[book.status]}
              </span>
              {book.genre && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {book.genre}
                </span>
              )}
            </div>
            <h1 className="mb-1 text-2xl font-bold text-foreground">{book.title}</h1>
            <p className="mb-4 text-muted-foreground">{book.author}</p>

            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {book.publisher && (
                <>
                  <dt className="text-muted-foreground">出版社</dt>
                  <dd className="text-foreground">{book.publisher}</dd>
                </>
              )}
              {book.published_date && (
                <>
                  <dt className="text-muted-foreground">出版日</dt>
                  <dd className="text-foreground">{book.published_date}</dd>
                </>
              )}
              {book.page_count && (
                <>
                  <dt className="text-muted-foreground">ページ数</dt>
                  <dd className="text-foreground">{book.page_count}p</dd>
                </>
              )}
              {book.isbn_13 && (
                <>
                  <dt className="text-muted-foreground">ISBN-13</dt>
                  <dd className="font-mono text-xs text-foreground">{book.isbn_13}</dd>
                </>
              )}
            </dl>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
                {isEditing ? "キャンセル" : "編集"}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                {deleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        {book.description && !isEditing && (
          <div className="border-t border-border px-6 py-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">概要</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{book.description}</p>
          </div>
        )}

        {/* Memo */}
        {book.memo && !isEditing && (
          <div className="border-t border-border px-6 py-5">
            <h2 className="mb-2 text-sm font-semibold text-foreground">メモ</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{book.memo}</p>
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border px-6 py-5"
          >
            <h2 className="mb-4 text-sm font-semibold text-foreground">編集</h2>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">タイトル</label>
                <input
                  type="text"
                  value={form.title || ""}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {/* Author */}
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">著者</label>
                <input
                  type="text"
                  value={form.author || ""}
                  onChange={(e) => updateField("author", e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {/* Genre + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">ジャンル</label>
                  <select
                    value={form.genre || ""}
                    onChange={(e) => updateField("genre", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">未分類</option>
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">ステータス</label>
                  <select
                    value={form.status || "unread"}
                    onChange={(e) => updateField("status", e.target.value as "unread" | "reading" | "read")}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="unread">未読</option>
                    <option value="reading">読書中</option>
                    <option value="read">読了</option>
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">概要</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {/* Memo */}
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">メモ</label>
                <textarea
                  value={form.memo || ""}
                  onChange={(e) => updateField("memo", e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {/* Save button */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? "保存中..." : "保存する"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function Link({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  // Use a plain anchor to avoid importing from next/link in client component
  return <a href={href} className={className}>{children}</a>;
}
