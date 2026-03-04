import { getBook } from "@/lib/actions/books";
import { notFound } from "next/navigation";
import BookDetail from "@/components/BookDetail";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { book, error } = await getBook(id);

  if (error || !book) notFound();

  return <BookDetail book={book} />;
}
