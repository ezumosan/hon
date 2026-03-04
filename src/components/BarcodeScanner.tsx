"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  /** スキャン成功時のコールバック。ISBN/JAN コードが渡される */
  onScanSuccess: (code: string) => void;
  /** スキャン中かどうかの外部制御（省略時: true） */
  active?: boolean;
};

const SCANNER_REGION_ID = "barcode-scanner-region";

/** ISBN (978/979) または JAN (45/49) コードかどうかを判定 */
function isBookBarcode(code: string): boolean {
  const cleaned = code.replace(/[^0-9]/g, "");
  if (cleaned.length === 13) {
    return (
      cleaned.startsWith("978") ||
      cleaned.startsWith("979") ||
      cleaned.startsWith("45") ||
      cleaned.startsWith("49")
    );
  }
  if (cleaned.length === 10) {
    // ISBN-10
    return true;
  }
  return false;
}

export default function BarcodeScanner({ onScanSuccess, active = true }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const lastScannedRef = useRef<string>("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // 2 = SCANNING, 3 = PAUSED
        if (state === 2 || state === 3) {
          await scannerRef.current.stop();
        }
      } catch {
        // 既に停止済み
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    // 既存のスキャナーを停止
    await stopScanner();

    try {
      const scanner = new Html5Qrcode(SCANNER_REGION_ID, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // 背面カメラ優先
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // 同じコードの連続検知を防止
          if (decodedText === lastScannedRef.current) return;

          if (isBookBarcode(decodedText)) {
            lastScannedRef.current = decodedText;
            onScanSuccess(decodedText);
          }
        },
        () => {
          // スキャン失敗（フレームごとに呼ばれるので無視）
        }
      );

      setIsScanning(true);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "カメラの起動に失敗しました";
      setError(message);
      setIsScanning(false);
    }
  }, [onScanSuccess, stopScanner]);

  useEffect(() => {
    if (active) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [active, startScanner, stopScanner]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* カメラプレビュー領域 */}
      <div
        id={SCANNER_REGION_ID}
        className="w-full max-w-md overflow-hidden rounded-xl border-2 border-dashed border-border"
        style={{ minHeight: 300 }}
      />

      {/* ステータス表示 */}
      {isScanning && (
        <p className="flex items-center gap-2 text-sm text-primary">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          スキャン中... 本のバーコードをカメラに映してください
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-500">
          <p className="font-medium">エラー</p>
          <p>{error}</p>
          <button
            onClick={startScanner}
            className="mt-2 text-red-500 underline hover:text-red-700 dark:hover:text-red-300"
          >
            再試行
          </button>
        </div>
      )}
    </div>
  );
}
