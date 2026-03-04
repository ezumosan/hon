import { getWishlist } from "@/lib/actions/wishlist";
import WishlistClient from "@/components/WishlistClient";
import WishlistAddForm from "@/components/WishlistAddForm";

export default async function WishlistPage() {
  const { items } = await getWishlist();

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
        ほしい本リスト
        {items.length > 0 && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
            {items.length}件
          </span>
        )}
      </h1>

      <div className="mb-8">
        <WishlistAddForm />
      </div>

      <WishlistClient items={items} />
    </div>
  );
}
