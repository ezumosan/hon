"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { addToWishlist } from "@/lib/actions/wishlist";

export default function WishlistAddForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "scan">("manual");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // フォーム状態
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [isbn, setIsbn] = useState("");
  const [memo, setMemo] = useState("");
  const [priority, setPriority] = useState(3);
  const [coverUrl, setCoverUrl] = useState("");

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setPublisher("");
    setIsbn("");
    setMemo("");
    setPriority(3);
    setCoverUrl("");
  };

  const handleScanSuccess = useCallback(async (code: string) => {
    setLoading(true);
    setMessage(null);

    try {
      // API で書籍情報を取得
      const res = await fetch(`/api/books/lookup?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setTitle(data.title || "");
        setAuthor(data.author || "");
        setPublisher(data.publisher || "");
        setIsbn(data.isbn_13 || code);
        setCoverUrl(data.cover_image_url || "");
        setMode("manual"); // フォームに切替えて確認
        setMessage({ type: "success", text: "書籍情報を取得しました。内容を確認して追加してください。" });
      } else {
        setIsbn(code);
        setMode("manual");
        setMessage({ type: "error", text: "書籍情報が見つかりません。手動で入力してください。" });
      }
    } catch {
      setIsbn(code);
      setMode("manual");
      setMessage({ type: "error", text: "通信エラー。手動で入力してください。" });
    }

    setLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setMessage(null);

    const result = await addToWishlist({
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      isbn_13: isbn.trim() || null,
      cover_image_url: coverUrl.trim(),
      memo: memo.trim(),
      priority,
    });

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: `"${title}" をほしい本リストに追加しました` });
      resetForm();
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-lg font-bold text-foreground">ほしい本を追加</h2>

      {/* モード切替 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMode("manual")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            mode === "manual"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground hover:bg-muted"
          }`}
        >
          手動入力
        </button>
        <button
          onClick={() => setMode("scan")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
            mode === "scan"
              ? "bg-primary text-primary-foreground"
              : "border border-border text-foreground hover:bg-muted"
          }`}
        >
          バーコードスキャン
        </button>
      </div>

      {/* メッセージ */}
      {message && (
        <div className={`mb-4 rounded-xl px-3 py-2 text-sm ${
          message.type === "success"
            ? "bg-primary/10 text-primary"
            : "bg-red-500/10 text-red-500"
        }`}>
          {message.text}
        </div>
      )}

      {/* スキャンモード */}
      {mode === "scan" && (
        <div className="mb-4">
          <BarcodeScanner onScanSuccess={handleScanSuccess} active={mode === "scan" && !loading} />
          {loading && (
            <p className="mt-2 text-center text-sm text-primary">書籍情報を取得中...</p>
          )}
        </div>
      )}

      {/* フォーム（手動 or スキャン後） */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="本のタイトル"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">著者</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="著者名"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">出版社</label>
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="出版社"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="978-4-xxx"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={1}>最優先</option>
                <option value={2}>高</option>
                <option value={3}>普通</option>
                <option value={4}>低</option>
                <option value={5}>いつか</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">メモ</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="メモ（任意）"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "追加中..." : "ほしい本リストに追加"}
          </button>
        </form>
      )}
    </div>
  );
}
