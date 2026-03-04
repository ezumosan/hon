import { NextRequest, NextResponse } from "next/server";

// ============================================================
// ISBN / JAN コードから書籍情報を取得する API Route
// GET /api/books/lookup?code=9784xxxxx
//
// 検索優先順:
//   1. openBD (日本語書籍に強い、無料、認証不要)
//   2. Google Books API - isbn: プレフィックス検索
//   3. 国立国会図書館サーチ (NDL Search) - 日本の出版物をほぼ網羅
//   4. Google Books API - ブロード検索 (isbn: なし、教科書等を拾う)
//   5. フォールバック: ISBN出版者記号から出版社名を特定して仮登録
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
  _partial?: boolean;
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

// ---- 国立国会図書館サーチ (NDL Search) ----
function extractXmlTag(xml: string, tag: string): string | null {
  // namespace prefix 付きのタグも対応 (例: dc:title, dcterms:issued)
  const patterns = [
    new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]></${tag}>`, "i"),
  ];
  for (const re of patterns) {
    const match = xml.match(re);
    if (match) return match[1].trim();
  }
  return null;
}

function extractAllXmlTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "gi");
  const results: string[] = [];
  let match;
  while ((match = re.exec(xml)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

async function fetchFromNDL(isbn: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://ndlsearch.ndl.go.jp/api/opensearch?isbn=${isbn}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;

    const xml = await res.text();

    // 検索結果なし
    const totalResults = extractXmlTag(xml, "openSearch:totalResults");
    if (!totalResults || totalResults === "0") return null;

    // <item>…</item> を抽出
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return null;
    const item = itemMatch[1];

    // タイトル
    const title = extractXmlTag(item, "dc:title") || extractXmlTag(item, "title") || "";

    // 著者（dc:creator を全て取得）
    const creators = extractAllXmlTags(item, "dc:creator");
    // 姓名の間のカンマを除去して整形
    const author = creators
      .map((c) => c.replace(/,\s*/g, " ").trim())
      .join(", ");

    // 出版社
    const publisher = extractXmlTag(item, "dc:publisher") || "";

    // 出版日
    const publishedDate =
      extractXmlTag(item, "dcterms:issued") ||
      extractXmlTag(item, "dc:date") ||
      "";

    // 説明
    const descriptions = extractAllXmlTags(item, "dc:description");
    const description = descriptions.join(" ");

    // openBD から書影を試みる（NDLは書影を提供しない）
    let coverUrl = "";
    if (isbn.length === 13) {
      coverUrl = `https://cover.openbd.jp/${isbn}.jpg`;
    }

    return {
      title,
      author,
      publisher,
      published_date: publishedDate,
      description,
      page_count: null,
      isbn_13: isbn,
      isbn_10: null,
      cover_image_url: coverUrl,
    };
  } catch {
    return null;
  }
}

// ---- Google Books API (ブロード検索: isbn: なし) ----
// 教科書等、isbn: prefix で見つからない書籍を拾う
async function fetchFromGoogleBooksBroad(code: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${code}&maxResults=3`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.items || data.items.length === 0) return null;

    // ISBN が一致する結果を優先的に探す
    for (const item of data.items) {
      const vol = item.volumeInfo;
      const identifiers = vol.industryIdentifiers || [];
      const matchesISBN = identifiers.some(
        (id: { type: string; identifier: string }) =>
          id.identifier === code
      );
      if (!matchesISBN) continue;

      let isbn13: string | null = null;
      let isbn10: string | null = null;
      for (const id of identifiers) {
        if (id.type === "ISBN_13") isbn13 = id.identifier;
        if (id.type === "ISBN_10") isbn10 = id.identifier;
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
        cover_image_url:
          vol.imageLinks?.thumbnail?.replace("http:", "https:") || "",
      };
    }

    // ISBN 完全一致がなければ最初の結果を返す（ただし partial フラグ付き）
    const vol = data.items[0].volumeInfo;
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
      cover_image_url:
        vol.imageLinks?.thumbnail?.replace("http:", "https:") || "",
    };
  } catch {
    return null;
  }
}

// ---- ISBN 出版者記号 → 出版社名マッピング ----
// 日本の主要出版社の ISBN 出版者記号（978-4-XXX）
// 参考: https://isbn.jpo.or.jp/
const JP_PUBLISHER_CODES: Record<string, string> = {
  // 2桁コード
  "00": "岩波書店",
  "01": "旺文社",
  "02": "朝倉書店",
  "03": "偕成社",
  "04": "角川書店/KADOKAWA",
  "05": "学研",
  "06": "講談社",
  "07": "主婦の友社",
  "08": "集英社",
  "09": "小学館",
  "10": "有斐閣",
  "12": "中央公論新社",
  "13": "筑摩書房",
  "14": "日本放送出版協会/NHK出版",
  "15": "早川書房",
  "16": "文藝春秋",
  "17": "プレジデント社",
  "18": "東洋経済新報社",
  "19": "徳間書店",
  "20": "白泉社",
  "21": "新潮社",
  "22": "河出書房新社",
  "23": "三省堂",
  "25": "日本評論社",
  "26": "光文社",
  "27": "ダイヤモンド社",
  "30": "双葉社",
  "31": "PHP研究所",
  "33": "新星出版社",
  "34": "日経BP",
  "35": "中央経済社",
  "38": "日本文芸社",
  "39": "実業之日本社",
  "40": "青林堂/青林工藝舎",
  "41": "ベネッセコーポレーション",
  "42": "創元社",
  "43": "紀伊國屋書店",
  "44": "医学書院",
  "46": "朝日新聞出版",
  "47": "祥伝社",
  "48": "秋田書店",
  "49": "幻冬舎",
  "50": "オライリー・ジャパン",
  "56": "翔泳社",
  "59": "ナツメ社",
  "62": "SBクリエイティブ",
  "63": "宝島社",
  "65": "日本経済新聞出版",
  "72": "扶桑社",
  "75": "ポプラ社",
  "7": "日本能率協会マネジメントセンター",
  "76": "飛鳥新社",
  "77": "技術評論社",
  "78": "ソフトバンククリエイティブ",
  "87": "毎日新聞出版",
  "88": "日本実業出版社",
  "89": "星海社",
  "91": "かんき出版",
  "93": "インプレス",
  "97": "CCCメディアハウス",
  // 3桁コード
  "101": "増進堂・受験研究社",
  "103": "実教出版",
  "106": "フォレスト出版",
  "107": "好学社",
  "111": "山川出版社",
  "116": "朝日出版社",
  "121": "草思社",
  "122": "日本実業出版社",
  "130": "南江堂",
  "140": "白水社",
  "141": "平凡社",
  "150": "金子書房",
  "152": "紀伊国屋書店出版部",
  "163": "新曜社",
  "166": "みすず書房",
  "167": "東京大学出版会",
  "172": "勁草書房",
  "198": "ミネルヴァ書房",
  "260": "吉川弘文館",
  "264": "岩崎書店",
  "265": "一迅社",
  "267": "マイナビ出版",
  "274": "メディアワークス文庫",
  "295": "リットーミュージック",
  "309": "エムディエヌコーポレーション",
  "334": "星雲社",
  "344": "日本教文社",
  "396": "クレヨンハウス",
  "401": "新興出版社啓林館",
  "408": "自由国民社",
  "410": "数研出版",
  "418": "慶應義塾大学出版会",
  "422": "日科技連出版社",
  "469": "大修館書店",
  "478": "福音館書店",
  "480": "柏書房",
  "487": "永岡書店",
  "488": "東京書籍",
  "502": "日外アソシエーツ",
  "522": "情報センター出版局",
  "532": "語研",
  "535": "東京化学同人",
  "537": "同成社",
  "560": "桐原書店",
  "569": "京都大学学術出版会",
  "575": "培風館",
  "585": "アルク",
  "588": "サンマーク出版",
  "620": "スクウェア・エニックス",
  "635": "丸善出版",
  "636": "日経ナショナル ジオグラフィック",
  "651": "芳文社",
  "652": "少年画報社",
  "653": "竹書房",
  "655": "メディアファクトリー",
  "662": "JICC出版局",
  "704": "東京堂出版",
  "7511": "メディカ出版",
  "7565": "まんがタイムきらら",
  "758": "アスキー・メディアワークス",
  "770": "アスコム",
  "7741": "文響社",
  "7804": "日本能率協会マネジメントセンター",
  "7855": "エクスナレッジ",
  "7993": "KADOKAWA",
  "8002": "マガジンハウス",
  "8014": "ソシム",
  "8058": "日本標準",
  "8156": "中央法規出版",
  "8163": "世界文化社",
  "8222": "清水書院",
  "8291": "明石書店",
  "8340": "工学社",
  "8399": "オーム社",
  "8401": "新書館",
  "8443": "コロナ社",
  "8451": "技報堂出版",
  "8459": "森北出版",
};

/**
 * ISBN-13 (978-4-XXX...) から日本の出版社名を推定する
 */
function guessPublisherFromISBN(isbn: string): string {
  // 978-4-XXXX... 形式のみ対応
  if (!isbn.startsWith("9784") || isbn.length !== 13) return "";

  const afterPrefix = isbn.slice(4); // "4" 以降の部分

  // 長いコードから順にマッチングを試みる (4桁 → 3桁 → 2桁)
  for (let len = 4; len >= 2; len--) {
    const code = afterPrefix.slice(0, len);
    if (JP_PUBLISHER_CODES[code]) {
      return JP_PUBLISHER_CODES[code];
    }
  }

  return "";
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

  // 2) openBD でヒットしなければ Google Books (isbn: prefix)
  if (!bookInfo) {
    bookInfo = await fetchFromGoogleBooks(cleaned);
  }

  // 3) それでもなければ国立国会図書館サーチ
  if (!bookInfo) {
    bookInfo = await fetchFromNDL(cleaned);
  }

  // 4) Google Books ブロード検索（isbn: prefix なし）
  //    教科書等、isbn: で引っかからない書籍を拾う
  if (!bookInfo) {
    bookInfo = await fetchFromGoogleBooksBroad(cleaned);
  }

  if (!bookInfo) {
    // 全APIでヒットしない場合でも、ISBNだけで仮データを返す
    // (検定教科書・同人誌など一般DBに未登録の書籍向け)
    // ISBN 出版者記号から出版社名を自動特定する
    const guessedPublisher = guessPublisherFromISBN(cleaned);
    bookInfo = {
      title: guessedPublisher
        ? `${guessedPublisher}の書籍 (ISBN: ${cleaned})`
        : `ISBN: ${cleaned}`,
      author: "",
      publisher: guessedPublisher,
      published_date: "",
      description: guessedPublisher
        ? `ISBN出版者記号から「${guessedPublisher}」と判定しました。詳細ページからタイトル等を編集してください。`
        : "",
      page_count: null,
      isbn_13: cleaned.length === 13 ? cleaned : null,
      isbn_10: cleaned.length === 10 ? cleaned : null,
      cover_image_url: "",
      _partial: true,
    };
  }

  return NextResponse.json(bookInfo);
}
