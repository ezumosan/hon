"use client";

import { useState, useCallback, useRef } from "react";

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
 * - Google Books のプレースホルダー画像も検出して次のソースへ
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
  const imgRef = useRef<HTMLImageElement>(null);

  const cleanIsbn = isbn?.replace(/[^0-9]/g, "") ?? "";

  // ISBN から代替書影 URL を生成
  const getFallbackUrl = useCallback(
    (index: number): string | null => {
      if (!cleanIsbn || cleanIsbn.length !== 13) return null;

      const fallbacks = [
        // NDL サムネイル（日本の書籍に最も信頼性が高い）
        `https://ndlsearch.ndl.go.jp/thumbnail/${cleanIsbn}.jpg`,
        // 版元ドットコム (Hanmoto)
        `https://www.hanmoto.com/bd/img/${cleanIsbn}.jpg`,
      ];

      // 現在の src や初期 src と同じ URL はスキップ
      const filtered = fallbacks.filter(
        (url) => url !== src && url !== currentSrc
      );
      return filtered[index] ?? null;
    },
    [cleanIsbn, src, currentSrc]
  );

  const tryNextFallback = useCallback(() => {
    const nextFallback = getFallbackUrl(triedFallbacks);
    if (nextFallback) {
      setCurrentSrc(nextFallback);
      setTriedFallbacks((prev) => prev + 1);
    } else {
      setFailed(true);
    }
  }, [getFallbackUrl, triedFallbacks]);

  function handleError() {
    tryNextFallback();
  }

  function handleLoad() {
    const img = imgRef.current;
    if (!img) return;

    // Google Books プレースホルダー検出:
    // - 空 id= パラメータの URL は常にグレーのプレースホルダーを返す
    // - 実際の表紙画像でないため fallback へ進む
    if (currentSrc.includes("books.google.com/books/content?id=&")) {
      tryNextFallback();
      return;
    }

    // 極端に小さい画像（1x1 ピクセル等）はプレースホルダーとみなす
    if (img.naturalWidth <= 1 || img.naturalHeight <= 1) {
      tryNextFallback();
      return;
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
      ref={imgRef}
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
    />
  );
}
