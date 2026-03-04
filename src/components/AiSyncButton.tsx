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

  async function handleSync() {
    if (loading) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (data.error) {
        setResult(`エラー: ${data.error}`);
      } else {
        setResult(data.message || `${data.processed}冊を分類しました`);
        router.refresh();
      }
    } catch {
      setResult("通信エラーが発生しました");
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
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
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
}
