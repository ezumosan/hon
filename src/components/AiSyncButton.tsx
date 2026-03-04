"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  unclassifiedCount: number;
};

export default function AiSyncButton({ unclassifiedCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleSync(forceAll = false) {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setProgress(null);

    let totalProcessed = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const res = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(forceAll ? { forceAll: true } : {}),
        });
        const data = await res.json();

        if (data.error) {
          setResult(`エラー: ${data.error}`);
          break;
        }

        totalProcessed += data.processed || 0;
        const remaining = data.remaining ?? 0;

        if (remaining > 0 && data.processed > 0) {
          setProgress(`${totalProcessed}冊を分類済み... 残り${remaining}冊`);
        } else {
          hasMore = false;
          if (totalProcessed > 0) {
            setResult(`${totalProcessed}冊を分類しました`);
          } else {
            setResult(data.message || "分類対象がありません");
          }
        }
      }
      router.refresh();
    } catch {
      setResult("通信エラーが発生しました");
    }

    setProgress(null);
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSync(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          )}
          全体を再分類
        </button>
        <button
          onClick={() => handleSync(false)}
          disabled={loading || unclassifiedCount === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
        >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            AI 分類中...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 2a4.5 4.5 0 0 0-3.18 7.68A3 3 0 0 0 6 12.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5a3 3 0 0 0-2.82-2.82A4.5 4.5 0 0 0 12 2z" />
              <path d="M10 18v2" /><path d="M14 18v2" />
            </svg>
            AI 仕分け実行
          </>
        )}
        </button>
      </div>
      {progress && (
        <p className="text-xs text-muted-foreground">{progress}</p>
      )}
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
}
