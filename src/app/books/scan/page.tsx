"use client";

import { useState, useCallback } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function ScanPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(true);
  const [manualCode, setManualCode] = useState("");

  const handleScanSuccess = useCallback((code: string) => {
    setScannedCode(code);
    setScannerActive(false); // スキャン成功後にカメラ停止
  }, []);

  const handleLookup = (code: string) => {
    // ステップ3 で書籍情報取得 → 登録画面へ遷移する処理を実装予定
    window.location.href = `/books/new?code=${encodeURIComponent(code)}`;
  };

  const handleRescan = () => {
    setScannedCode(null);
    setScannerActive(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = manualCode.replace(/[^0-9]/g, "");
    if (cleaned.length >= 10) {
      handleLookup(cleaned);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">📷 バーコードスキャン</h1>

      {/* スキャナー */}
      <BarcodeScanner
        onScanSuccess={handleScanSuccess}
        active={scannerActive}
      />

      {/* スキャン結果 */}
      {scannedCode && (
        <div className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">検出されたコード</p>
          <p className="my-2 text-2xl font-mono font-bold">{scannedCode}</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleLookup(scannedCode)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              この本を検索・登録
            </button>
            <button
              onClick={handleRescan}
              className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
            >
              もう一度スキャン
            </button>
          </div>
        </div>
      )}

      {/* 手動入力フォールバック */}
      <div className="mt-8 border-t pt-6">
        <h2 className="mb-3 text-lg font-semibold">
          ISBN / JAN コードを手入力
        </h2>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="978-4-xxx-xxxxx-x"
            className="flex-1 rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
          >
            検索
          </button>
        </form>
      </div>
    </div>
  );
}
