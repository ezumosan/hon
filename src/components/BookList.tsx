"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Book } from "@/types/book";
import { GENRES } from "@/types/book";
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

type Props = {
  books: Book[];
};

export default function BookList({ books }: Props) {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // ジャンル一覧を動的に取得（登録済みのジャンル + マスター一覧）
  const usedGenres = Array.from(new Set(books.map((b) => b.genre).filter(Boolean)));
  const allGenres = Array.from(new Set([...usedGenres, ...GENRES]));

  const filtered = books.filter((book) => {
    const matchesQuery =
      !query ||
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.publisher.toLowerCase().includes(query.toLowerCase());
    const matchesGenre = !selectedGenre || book.genre === selectedGenre;
    const matchesStatus = !selectedStatus || book.status === selectedStatus;
    return matchesQuery && matchesGenre && matchesStatus;
  });

  return (
    <div>
      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="タイトル、著者、出版社で検索..."
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">全ステータス</option>
            <option value="unread">未読</option>
            <option value="reading">読書中</option>
            <option value="read">読了</option>
          </select>

          {/* Genre filter */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">全ジャンル</option>
            {allGenres.map((g) => (
              <option key={g} value={g}>
                {g} ({books.filter((b) => b.genre === g).length})
              </option>
            ))}
          </select>

          {(query || selectedGenre || selectedStatus) && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedGenre("");
                setSelectedStatus("");
              }}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              クリア
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-muted-foreground">
        {filtered.length} 冊
        {(query || selectedGenre || selectedStatus) && ` (${books.length} 冊中)`}
      </p>

      {/* Book grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 h-12 w-12 text-muted-foreground"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>
          <p className="text-muted-foreground">該当する本がありません</p>
          <Link
            href="/books/scan"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            本を登録する
          </Link>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((book) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Link
                  href={`/books/${book.id}`}
                  className="card-hover group block rounded-2xl border border-border bg-card p-3"
                >
                  <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                    <BookCoverImage
                      src={book.cover_image_url}
                      isbn={book.isbn_13}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Status badge */}
                    <span
                      className={`absolute right-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[book.status]}`}
                    >
                      {STATUS_LABELS[book.status]}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
                    {book.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                    {book.author}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {book.genre && (
                      <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {book.genre}
                      </span>
                    )}
                    {book.series_name && (
                      <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {book.series_name}{book.series_order ? ` #${book.series_order}` : ""}
                      </span>
                    )}
                    {book.quantity > 1 && (
                      <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        x{book.quantity}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
