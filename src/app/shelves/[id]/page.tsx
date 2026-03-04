import { getShelf } from "@/lib/actions/shelves";
import { getBooks } from "@/lib/actions/books";
import Link from "next/link";
import BookCoverImage from "@/components/BookCoverImage";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ShelfDetailPage({ params }: Props) {
  const { id } = await params;
  const { shelf, error } = await getShelf(id);

  if (error || !shelf) return notFound();

  const { books } = await getBooks({ shelfId: id });

  return (
    <div className="animate-fade-in">
      <Link
        href="/shelves"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m15 18-6-6 6-6" /></svg>
        本棚一覧に戻る
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{shelf.name}</h1>
          {shelf.location && (
            <p className="mt-1 text-muted-foreground">{shelf.location}</p>
          )}
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            バーコード: {shelf.barcode}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/shelves/barcode-pdf?id=${shelf.id}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            target="_blank"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            バーコードPDF
          </a>
          <Link
            href="/shelves/manage"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            入庫/出庫
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{books.length} 冊</p>

      {books.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">この本棚にはまだ本がありません</p>
          <Link
            href="/shelves/manage"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            本を入庫する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {books.map((book) => (
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
      )}
    </div>
  );
}
