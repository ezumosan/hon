import { getBooks } from "@/lib/actions/books";
import Link from "next/link";
import BookCoverImage from "@/components/BookCoverImage";

type Props = {
  params: Promise<{ name: string }>;
};

export default async function SeriesDetailPage({ params }: Props) {
  const { name } = await params;
  const seriesName = decodeURIComponent(name);
  const { books } = await getBooks({ series: seriesName });

  const sorted = books.sort(
    (a, b) => (a.series_order ?? 999) - (b.series_order ?? 999)
  );

  return (
    <div className="animate-fade-in">
      <Link
        href="/series"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
        シリーズ一覧に戻る
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-foreground">{seriesName}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{sorted.length}冊</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {sorted.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="card-hover group rounded-2xl border border-border bg-card p-3"
          >
            <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg bg-muted">
              <BookCoverImage
                src={book.cover_image_url}
                isbn={book.isbn_13}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {book.series_order && (
                <span className="absolute bottom-2 right-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow">
                  {book.series_order}巻
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium leading-tight text-foreground">
              {book.title}
            </p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {book.author}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
