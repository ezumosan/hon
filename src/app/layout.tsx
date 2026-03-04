import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {/* ヘッダー */}
          <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
              <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                </svg>
                Hon
              </a>
              <nav className="flex items-center gap-1 text-sm">
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
                <a href="/books/scan" className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:block">
                  スキャン
                </a>
              </nav>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="animate-fade-in">{children}</div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
