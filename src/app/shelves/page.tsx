import { getShelves } from "@/lib/actions/shelves";
import { getBooks } from "@/lib/actions/books";
import Link from "next/link";
import ShelfListClient from "@/components/ShelfListClient";

export default async function ShelvesPage() {
  const { shelves } = await getShelves();
  const { books } = await getBooks();

  // 各本棚の本の数をカウント
  const shelfBookCounts = new Map<string, number>();
  for (const book of books) {
    if (book.shelf_id) {
      shelfBookCounts.set(book.shelf_id, (shelfBookCounts.get(book.shelf_id) || 0) + 1);
    }
  }
  const unshelvedCount = books.filter((b) => !b.shelf_id).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <rect x="3" y="3" width="7" height="9" />
            <rect x="14" y="3" width="7" height="5" />
            <rect x="14" y="12" width="7" height="9" />
            <rect x="3" y="16" width="7" height="5" />
          </svg>
          本棚管理
        </h1>
        <div className="flex gap-2">
          <Link
            href="/shelves/manage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="16" x2="17" y2="16" /></svg>
            入庫/出庫スキャン
          </Link>
        </div>
      </div>

      {/* 未配置の本 */}
      {unshelvedCount > 0 && (
        <div className="mb-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          本棚に未配置の本が {unshelvedCount} 冊あります
        </div>
      )}

      <ShelfListClient
        shelves={shelves}
        shelfBookCounts={Object.fromEntries(shelfBookCounts)}
      />
    </div>
  );
}
