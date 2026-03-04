"use client";

import { useState, useCallback, useEffect } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { assignBookToShelf, removeBookFromShelf, getBookByIsbn } from "@/lib/actions/books";
import { getShelfByBarcode, getShelves } from "@/lib/actions/shelves";
import type { Shelf } from "@/types/book";

type Mode = "checkin" | "checkout";
type Step = "scan-shelf" | "scan-book" | "done";

type LogEntry = {
  id: string;
  bookTitle: string;
  shelfName: string;
  action: Mode;
  time: string;
};

export default function ShelfManagePage() {
  const [mode, setMode] = useState<Mode>("checkin");
  const [step, setStep] = useState<Step>("scan-shelf");
  const [selectedShelf, setSelectedShelf] = useState<{ id: string; name: string } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [manualIsbn, setManualIsbn] = useState("");

  useEffect(() => {
    getShelves().then((r) => setShelves(r.shelves));
  }, []);

  const handleScan = useCallback(
    async (code: string) => {
      if (processing) return;
      setProcessing(true);
      setMessage(null);

      // 入庫モード: まず本棚バーコードをスキャン、次に本をスキャン
      if (mode === "checkin") {
        if (step === "scan-shelf") {
          // SHELF- プレフィックスで本棚バーコードを判定
          if (code.startsWith("SHELF-")) {
            const result = await getShelfByBarcode(code);
            if (result.shelf) {
              setSelectedShelf({ id: result.shelf.id, name: result.shelf.name });
              setStep("scan-book");
              setMessage({ type: "info", text: `本棚「${result.shelf.name}」を選択しました。本のバーコードをスキャンしてください。` });
            } else {
              setMessage({ type: "error", text: "この本棚バーコードは登録されていません" });
            }
          } else {
            setMessage({ type: "error", text: "本棚のバーコードをスキャンしてください（SHELF-で始まるコード）" });
          }
        } else if (step === "scan-book" && selectedShelf) {
          // 本のバーコードをスキャン → 入庫
          const cleaned = code.replace(/[^0-9]/g, "");
          const result = await getBookByIsbn(cleaned);
          if (result.book) {
            const assignResult = await assignBookToShelf(result.book.id, selectedShelf.id);
            if (assignResult.error) {
              setMessage({ type: "error", text: assignResult.error });
            } else {
              setMessage({ type: "success", text: `「${result.book.title}」を「${selectedShelf.name}」に入庫しました` });
              setLog((prev) => [
                {
                  id: `${Date.now()}`,
                  bookTitle: result.book!.title,
                  shelfName: selectedShelf.name,
                  action: "checkin",
                  time: new Date().toLocaleTimeString("ja-JP"),
                },
                ...prev,
              ]);
            }
          } else {
            setMessage({ type: "error", text: "この本は蔵書に登録されていません。先にスキャンページで登録してください。" });
          }
        }
      }

      // 出庫モード: 本のバーコードをスキャンするだけ
      if (mode === "checkout") {
        const cleaned = code.replace(/[^0-9]/g, "");
        const result = await getBookByIsbn(cleaned);
        if (result.book) {
          if (!result.book.shelf_id) {
            setMessage({ type: "info", text: `「${result.book.title}」はどの本棚にも入庫されていません` });
          } else {
            const removeResult = await removeBookFromShelf(result.book.id);
            if (removeResult.error) {
              setMessage({ type: "error", text: removeResult.error });
            } else {
              setMessage({ type: "success", text: `「${result.book.title}」を出庫しました` });
              setLog((prev) => [
                {
                  id: `${Date.now()}`,
                  bookTitle: result.book!.title,
                  shelfName: "—",
                  action: "checkout",
                  time: new Date().toLocaleTimeString("ja-JP"),
                },
                ...prev,
              ]);
            }
          }
        } else {
          setMessage({ type: "error", text: "この本は蔵書に登録されていません" });
        }
      }

      setProcessing(false);
    },
    [mode, step, selectedShelf, processing]
  );

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setStep(newMode === "checkin" ? "scan-shelf" : "scan-book");
    setSelectedShelf(null);
    setMessage(null);
  }

  function resetShelf() {
    setStep("scan-shelf");
    setSelectedShelf(null);
    setMessage(null);
  }

  // 手動で本棚を選択
  function handleManualShelfSelect(shelfId: string) {
    const shelf = shelves.find((s) => s.id === shelfId);
    if (shelf) {
      setSelectedShelf({ id: shelf.id, name: shelf.name });
      setStep("scan-book");
      setMessage({ type: "info", text: `本棚「${shelf.name}」を選択しました。本のバーコードをスキャンまたは入力してください。` });
    }
  }

  // 手動ISBN入力で入出庫
  async function handleManualIsbn(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = manualIsbn.replace(/[^0-9]/g, "");
    if (cleaned.length < 10) return;
    setManualIsbn("");
    await handleScan(cleaned);
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <a
        href="/shelves"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
        本棚管理に戻る
      </a>

      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {mode === "checkin" ? "入庫スキャン" : "出庫スキャン"}
      </h1>

      {/* モード切替 */}
      <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1">
        <button
          onClick={() => switchMode("checkin")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "checkin"
              ? "bg-card text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-4 w-4"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
          入庫
        </button>
        <button
          onClick={() => switchMode("checkout")}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            mode === "checkout"
              ? "bg-card text-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-4 w-4"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
          出庫
        </button>
      </div>

      {/* 入庫モード: 本棚選択状態 */}
      {mode === "checkin" && selectedShelf && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">選択中の本棚</p>
            <p className="font-bold text-foreground">{selectedShelf.name}</p>
          </div>
          <button
            onClick={resetShelf}
            className="text-sm text-primary hover:underline"
          >
            変更
          </button>
        </div>
      )}

      {/* ガイドメッセージ */}
      <div className="mb-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
        {mode === "checkin" && step === "scan-shelf" && (
          <p>1. 本棚をバーコードスキャンまたは一覧から選択してください</p>
        )}
        {mode === "checkin" && step === "scan-book" && (
          <p>2. 入庫する本のバーコードをスキャンまたはISBNを入力してください（連続可能）</p>
        )}
        {mode === "checkout" && (
          <p>出庫する本のバーコードをスキャンまたはISBNを入力してください</p>
        )}
      </div>

      {/* 手動本棚選択（入庫モード + 本棚未選択時） */}
      {mode === "checkin" && step === "scan-shelf" && shelves.length > 0 && (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">本棚を一覧から選択</label>
          <select
            onChange={(e) => e.target.value && handleManualShelfSelect(e.target.value)}
            defaultValue=""
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="">本棚を選択...</option>
            {shelves.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.location ? ` (${s.location})` : ""}</option>
            ))}
          </select>
          <p className="mt-2 text-center text-xs text-muted-foreground">または本棚のバーコードをスキャン</p>
        </div>
      )}

      {/* 手動ISBN入力（本のスキャンステップ時） */}
      {((mode === "checkin" && step === "scan-book") || mode === "checkout") && (
        <form onSubmit={handleManualIsbn} className="mb-4 rounded-xl border border-border bg-card p-4">
          <label className="mb-2 block text-sm font-medium text-muted-foreground">ISBNを手動入力</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualIsbn}
              onChange={(e) => setManualIsbn(e.target.value)}
              placeholder="ISBNを入力 (13桁 or 10桁)"
              inputMode="numeric"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              disabled={processing || manualIsbn.replace(/[^0-9]/g, "").length < 10}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {mode === "checkin" ? "入庫" : "出庫"}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">またはバーコードをスキャン</p>
        </form>
      )}

      {/* スキャナー */}
      <BarcodeScanner
        onScanSuccess={handleScan}
        active={!processing}
        acceptAll
      />

      {/* 処理中 */}
      {processing && (
        <div className="mt-4 text-center">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-1 text-sm text-muted-foreground">処理中...</p>
        </div>
      )}

      {/* メッセージ */}
      {message && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "border border-primary/30 bg-primary/5 text-primary"
              : message.type === "error"
              ? "border border-red-300 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
              : "border border-accent/30 bg-accent/5 text-accent"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 操作ログ */}
      {log.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            操作ログ（{log.length}件）
          </h2>
          <ul className="space-y-2">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    entry.action === "checkin"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {entry.action === "checkin" ? "入庫" : "出庫"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{entry.bookTitle}</p>
                  {entry.action === "checkin" && (
                    <p className="text-xs text-muted-foreground">→ {entry.shelfName}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{entry.time}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
