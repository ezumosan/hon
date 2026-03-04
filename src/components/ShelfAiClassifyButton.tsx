"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  bookIds: string[];
};

export default function ShelfAiClassifyButton({ bookIds }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClassify() {
    if (loading || bookIds.length === 0) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceAll: true, bookIds }),
      });
      const data = await res.json();

      if (data.error) {
        setResult(`エラー: ${data.error}`);
      } else if (data.processed > 0) {
        setResult(`${data.processed}冊を再分類しました`);
        router.refresh();
      } else {
        setResult(data.message || "分類対象がありません");
      }
    } catch {
      setResult("通信エラーが発生しました");
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClassify}
        disabled={loading || bookIds.length === 0}
        className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
            AI分類中...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M12 2a4.5 4.5 0 0 0-3.18 7.68A3 3 0 0 0 6 12.5V14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1.5a3 3 0 0 0-2.82-2.82A4.5 4.5 0 0 0 12 2z" />
              <path d="M10 18v2" /><path d="M14 18v2" />
            </svg>
            AI再分類
          </>
        )}
      </button>
      {result && (
        <span className="text-sm text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
