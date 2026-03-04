import { getBooks } from "@/lib/actions/books";
import BookList from "@/components/BookList";

export const metadata = { title: "蔵書一覧 - Hon" };

export default async function BooksPage() {
  const { books } = await getBooks();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">蔵書一覧</h1>
      <BookList books={books} />
    </div>
  );
}
