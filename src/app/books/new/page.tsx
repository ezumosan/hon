import { Suspense } from "react";
import NewBookForm from "@/components/NewBookForm";

export default function NewBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <NewBookForm />
    </Suspense>
  );
}
