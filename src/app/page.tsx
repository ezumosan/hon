import { getBooks } from "@/lib/actions/books";
import Link from "next/link";
import BookCoverImage from "@/components/BookCoverImage";

export default async function HomePage() {
  const { books } = await getBooks();
  const totalBooks = books.length;
  const readCount = books.filter((b) => b.status === "read").length;
  const readingCount = books.filter((b) => b.status === "reading").length;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="py-12 text-center sm:py-20">
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          蔵書管理システム
        </h1>
        <p className="mx-auto mb-10 max-w-md text-muted-foreground">
          バーコードスキャンまたは手動入力で、家にある本を簡単に管理できます。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/books/scan"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="16" x2="17" y2="16" /></svg>
            バーコードスキャン
          </Link>
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 font-medium text-foreground shadow-sm transition-all hover:bg-muted hover:-translate-y-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 20h9" /><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" /></svg>
            手動で登録
          </Link>
        </div>
      </section>

      {/* Stats */}
      {totalBooks > 0 && (
        <section className="mb-12 grid grid-cols-3 gap-4 sm:gap-6">
          <div className="card-hover rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-bold text-foreground">{totalBooks}</p>
            <p className="mt-1 text-sm text-muted-foreground">登録済み</p>
          </div>
          <div className="card-hover rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-bold text-accent">{readingCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">読書中</p>
          </div>
          <div className="card-hover rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-3xl font-bold text-primary">{readCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">読了</p>
          </div>
        </section>
      )}

      {/* Recent books */}
      {totalBooks > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">最近登録した本</h2>
            <Link href="/books" className="text-sm text-primary hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {books.slice(0, 10).map((book, i) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="card-hover animate-slide-up group rounded-2xl border border-border bg-card p-3 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg bg-muted">
                  <BookCoverImage
                    src={book.cover_image_url}
                    isbn={book.isbn_13}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
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
        </section>
      )}
    </div>
  );
}
