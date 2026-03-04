import { getSeriesList, getBooks } from "@/lib/actions/books";
import Link from "next/link";
import BookCoverImage from "@/components/BookCoverImage";

export default async function SeriesListPage() {
  const { series } = await getSeriesList();
  const { books } = await getBooks();

  // シリーズごとに本をグループ化
  const seriesMap = new Map<string, typeof books>();
  for (const s of series) {
    const seriesBooks = books
      .filter((b) => b.series_name === s)
      .sort((a, b) => (a.series_order ?? 999) - (b.series_order ?? 999));
    seriesMap.set(s, seriesBooks);
  }

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          <path d="M8 2v20" />
        </svg>
        シリーズ一覧
      </h1>

      {series.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 h-12 w-12 text-muted-foreground">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
          </svg>
          <p className="text-muted-foreground">シリーズがまだありません</p>
          <p className="mt-2 text-sm text-muted-foreground">
            AI仕分けを実行すると、シリーズが自動的に検出されます。
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {series.map((seriesName) => {
            const seriesBooks = seriesMap.get(seriesName) || [];
            return (
              <section key={seriesName} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <Link
                    href={`/series/${encodeURIComponent(seriesName)}`}
                    className="flex items-center gap-2 text-lg font-bold text-foreground hover:text-primary"
                  >
                    {seriesName}
                    <span className="text-sm font-normal text-muted-foreground">
                      ({seriesBooks.length}冊)
                    </span>
                  </Link>
                  <Link
                    href={`/series/${encodeURIComponent(seriesName)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    すべて見る →
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {seriesBooks.slice(0, 8).map((book) => (
                    <Link
                      key={book.id}
                      href={`/books/${book.id}`}
                      className="flex-shrink-0"
                    >
                      <div className="relative h-36 w-24 overflow-hidden rounded-lg bg-muted shadow">
                        <BookCoverImage
                          src={book.cover_image_url}
                          isbn={book.isbn_13}
                          alt={book.title}
                          className="h-full w-full object-cover transition-transform hover:scale-105"
                          iconSize="sm"
                        />
                        {book.series_order && (
                          <span className="absolute bottom-1 right-1 rounded-full bg-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                            {book.series_order}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
