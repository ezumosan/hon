import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hon - 蔵書管理",
  description: "家庭用の蔵書管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* ヘッダー */}
        <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <a href="/" className="text-xl font-bold tracking-tight">
              📚 Hon
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/" className="hover:underline">
                一覧
              </a>
              <a href="/books/scan" className="hover:underline">
                スキャン
              </a>
              <a href="/books/new" className="hover:underline">
                手動登録
              </a>
            </nav>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
