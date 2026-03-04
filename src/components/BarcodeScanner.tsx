"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type Props = {
  /** スキャン成功時のコールバック。ISBN/JAN コードが渡される */
  onScanSuccess: (code: string) => void;
  /** スキャン中かどうかの外部制御（省略時: true） */
  active?: boolean;
  /** true の場合 isBookBarcode フィルターを無効化し全コードを受け入れる */
  acceptAll?: boolean;
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

export default function BarcodeScanner({ onScanSuccess, active = true, acceptAll = false }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const lastScannedRef = useRef<string>("");

  /** ライトのオン/オフを切り替える */
  const toggleTorch = useCallback(async () => {
    try {
      const videoEl = document.querySelector(
        `#${SCANNER_REGION_ID} video`
      ) as HTMLVideoElement | null;
      if (!videoEl?.srcObject) return;

      const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
      if (!track) return;

      const next = !torchOn;
      await track.applyConstraints({
        // @ts-expect-error -- torch is not in the standard typings yet
        advanced: [{ torch: next }],
      });
      setTorchOn(next);
    } catch {
      // デバイスが対応していない場合は無視
    }
  }, [torchOn]);

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
      setTorchOn(false);
      setTorchSupported(false);
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

          if (acceptAll || isBookBarcode(decodedText)) {
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

      // ライト対応チェック（少し待ってからビデオトラックを取得）
      setTimeout(() => {
        try {
          const videoEl = document.querySelector(
            `#${SCANNER_REGION_ID} video`
          ) as HTMLVideoElement | null;
          if (!videoEl?.srcObject) return;

          const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
          if (!track) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = track.getCapabilities() as any;
          if (caps?.torch) {
            setTorchSupported(true);
          }
        } catch {
          // capability check failed
        }
      }, 500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "カメラの起動に失敗しました";
      setError(message);
      setIsScanning(false);
    }
  }, [acceptAll, onScanSuccess, stopScanner]);

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
      <div className="relative w-full max-w-md">
        <div
          id={SCANNER_REGION_ID}
          className="w-full overflow-hidden rounded-xl border-2 border-dashed border-border"
          style={{ minHeight: 300 }}
        />

        {/* フラッシュライトボタン */}
        {isScanning && torchSupported && (
          <button
            onClick={toggleTorch}
            className={`absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-colors ${
              torchOn
                ? "bg-yellow-400 text-gray-900"
                : "bg-gray-800/70 text-white hover:bg-gray-700/80"
            }`}
            title={torchOn ? "ライトOFF" : "ライトON"}
            aria-label={torchOn ? "フラッシュライトをオフにする" : "フラッシュライトをオンにする"}
          >
            {torchOn ? (
              /* ライトON アイコン */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
              </svg>
            ) : (
              /* ライトOFF アイコン */
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h2M19.78 4.22l-.71.71M23 12h-2" />
                <path d="M15 9.34V7a3 3 0 0 0-6 0v2.34a5 5 0 1 0 6 0z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ステータス表示 */}
      {isScanning && (
        <p className="flex items-center gap-2 text-sm text-primary">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
          スキャン中... バーコードをカメラに映してください
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
