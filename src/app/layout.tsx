import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeToggleButton from "@/components/ThemeToggleButton";

export const metadata: Metadata = {
  title: "Hon - 蔵書管理",
  description: "家庭用の蔵書管理システム",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {/* ヘッダー */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
              <a href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary sm:h-6 sm:w-6">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
                Hon
              </a>

              {/* デスクトップナビ */}
              <nav className="hidden items-center gap-1 text-sm sm:flex">
                <a href="/books" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  蔵書一覧
                </a>
                <a href="/series" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  シリーズ
                </a>
                <a href="/shelves" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  本棚
                </a>
                <a href="/books/find" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  探す
                </a>
                <a href="/wishlist" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  ほしい本
                </a>
                <a href="/stats" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  記録
                </a>
                <a href="/books/scan" className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  スキャン
                </a>
                <ThemeToggleButton />
              </nav>

              {/* モバイル: テーマ切替のみ */}
              <div className="sm:hidden">
                <ThemeToggleButton />
              </div>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="mx-auto max-w-6xl px-4 py-6 pb-20 sm:px-6 sm:py-8 sm:pb-8">
            <div className="animate-fade-in">{children}</div>
          </main>

          {/* モバイル下部ナビ */}
          <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg sm:hidden">
            <div className="flex items-center justify-around py-1.5">
              <a href="/" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-[10px]">ホーム</span>
              </a>
              <a href="/books" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                <span className="text-[10px]">蔵書</span>
              </a>
              <a href="/books/scan" className="flex flex-col items-center gap-0.5 px-2 py-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M5 17H3m0 0v2a2 2 0 002 2h2M7 12h10M7 8h10M7 16h10" /></svg>
                </div>
              </a>
              <a href="/books/find" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <span className="text-[10px]">探す</span>
              </a>
              <a href="/stats" className="flex flex-col items-center gap-0.5 px-2 py-1 text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
                <span className="text-[10px]">記録</span>
              </a>
            </div>
          </nav>
        </ThemeProvider>
      </body>
    </html>
  );
}
