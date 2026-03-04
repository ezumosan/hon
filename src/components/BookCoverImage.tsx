"use client";

import { useState } from "react";

type Props = {
  src: string;
  isbn?: string | null;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  iconSize?: "sm" | "md" | "lg";
};

/**
 * 書影を表示するコンポーネント。
 * - 画像読み込み失敗時に自動で代替ソースを試行
 * - 全て失敗した場合はプレースホルダーを表示
 */
export default function BookCoverImage({
  src,
  isbn,
  alt,
  className = "h-full w-full object-cover",
  placeholderClassName = "flex h-full items-center justify-center text-muted-foreground",
  iconSize = "md",
}: Props) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [failed, setFailed] = useState(!src);
  const [triedFallbacks, setTriedFallbacks] = useState(0);

  // ISBN から代替書影 URL を生成
  function getFallbackUrl(index: number): string | null {
    const cleanIsbn = isbn?.replace(/[^0-9]/g, "");
    if (!cleanIsbn || cleanIsbn.length !== 13) return null;

    const fallbacks = [
      // openBD カバー
      `https://cover.openbd.jp/${cleanIsbn}.jpg`,
      // NDL サムネイル
      `https://ndlsearch.ndl.go.jp/thumbnail/${cleanIsbn}.jpg`,
      // Google Books (embed)
      `https://books.google.com/books/content?id=&printsec=frontcover&img=1&zoom=1&source=gbs_api&vid=ISBN${cleanIsbn}`,
    ];

    // 現在の src と同じ URL はスキップ
    const filtered = fallbacks.filter((url) => url !== src);
    return filtered[index] ?? null;
  }

  function handleError() {
    const nextFallback = getFallbackUrl(triedFallbacks);
    if (nextFallback) {
      setCurrentSrc(nextFallback);
      setTriedFallbacks((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  if (failed) {
    return (
      <div className={placeholderClassName}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={iconSizes[iconSize]}
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}
