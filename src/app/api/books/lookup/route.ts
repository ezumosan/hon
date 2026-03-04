import { NextRequest, NextResponse } from "next/server";

// ============================================================
// ISBN / JAN コードから書籍情報を取得する API Route
// GET /api/books/lookup?code=9784xxxxx
//
// 検索優先順:
//   1. openBD (日本語書籍に強い、無料、認証不要)
//   2. Google Books API (洋書・幅広いカバレッジ)
// ============================================================

type BookInfo = {
  title: string;
  author: string;
  publisher: string;
  published_date: string;
  description: string;
  page_count: number | null;
  isbn_13: string | null;
  isbn_10: string | null;
  cover_image_url: string;
};

// ---- openBD ----
async function fetchFromOpenBD(isbn: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`https://api.openbd.jp/v1/get?isbn=${isbn}`, {
      next: { revalidate: 86400 }, // 24h キャッシュ
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.[0]?.summary) return null;

    const summary = data[0].summary;
    const detail = data[0].onix;

    // 書影 URL
    let coverUrl = summary.cover || "";

    // 著者
    const author = summary.author || "";

    // 説明文 (onix から取得を試みる)
    let description = "";
    if (detail?.CollateralDetail?.TextContent) {
      const textContents = detail.CollateralDetail.TextContent;
      const desc = textContents.find(
        (t: { TextType: string; Text: string }) =>
          t.TextType === "02" || t.TextType === "03"
      );
      if (desc) description = desc.Text || "";
    }

    // ページ数
    let pageCount: number | null = null;
    if (detail?.DescriptiveDetail?.Extent) {
      const extent = detail.DescriptiveDetail.Extent.find(
        (e: { ExtentType: string; ExtentValue: string }) =>
          e.ExtentType === "11"
      );
      if (extent) pageCount = parseInt(extent.ExtentValue, 10) || null;
    }

    return {
      title: summary.title || "",
      author,
      publisher: summary.publisher || "",
      published_date: summary.pubdate || "",
      description,
      page_count: pageCount,
      isbn_13: summary.isbn || isbn,
      isbn_10: null,
      cover_image_url: coverUrl,
    };
  } catch {
    return null;
  }
}

// ---- Google Books API ----
async function fetchFromGoogleBooks(code: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${code}&maxResults=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    const vol = data.items[0].volumeInfo;

    // ISBN の抽出
    let isbn13: string | null = null;
    let isbn10: string | null = null;
    if (vol.industryIdentifiers) {
      for (const id of vol.industryIdentifiers) {
        if (id.type === "ISBN_13") isbn13 = id.identifier;
        if (id.type === "ISBN_10") isbn10 = id.identifier;
      }
    }

    return {
      title: vol.title || "",
      author: (vol.authors || []).join(", "),
      publisher: vol.publisher || "",
      published_date: vol.publishedDate || "",
      description: vol.description || "",
      page_count: vol.pageCount ?? null,
      isbn_13: isbn13 || code,
      isbn_10: isbn10,
      cover_image_url: vol.imageLinks?.thumbnail?.replace("http:", "https:") || "",
    };
  } catch {
    return null;
  }
}

// ---- Route Handler ----
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "code パラメータが必要です" },
      { status: 400 }
    );
  }

  const cleaned = code.replace(/[^0-9]/g, "");

  // 1) openBD で検索（日本語書籍優先）
  let bookInfo = await fetchFromOpenBD(cleaned);

  // 2) openBD でヒットしなければ Google Books
  if (!bookInfo) {
    bookInfo = await fetchFromGoogleBooks(cleaned);
  }

  if (!bookInfo) {
    return NextResponse.json(
      { error: "書籍情報が見つかりませんでした", code: cleaned },
      { status: 404 }
    );
  }

  return NextResponse.json(bookInfo);
}
