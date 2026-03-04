import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { GENRES } from "@/types/book";

// ============================================================
// AI 仕分け API
// POST /api/ai/classify
// Gemini 2.5 Flash を使って未分類の本にジャンルとシリーズ名を付与する
// ============================================================

// Vercel タイムアウト拡張（Hobby: 最大60秒）
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const GENRE_LIST = GENRES.join(", ");

// 1回のリクエストで処理する最大冊数（タイムアウト対策）
const MAX_BOOKS_PER_REQUEST = 40;

type ClassifyResult = {
  id: string;
  genre: string;
  series_name: string;
  series_order: number | null;
};

export async function POST(request: NextRequest) {
  // オプション: Cron からの呼び出し時の認証
  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

  // 手動呼び出しは常に許可、Cron は CRON_SECRET で認証
  const body = await request.json().catch(() => ({}));
  const forceAll = body.forceAll === true;
  const bookIds: string[] | undefined = body.bookIds;

  const supabase = await createClient();

  // AI未分類の本を取得
  let query = supabase
    .from("books")
    .select("id, title, author, publisher, description")
    .order("created_at", { ascending: false });

  if (bookIds && bookIds.length > 0) {
    // 特定の本のみ対象（本棚の再分類用）
    query = query.in("id", bookIds);
  } else if (!forceAll) {
    query = query.eq("ai_classified", false);
  }

  const { data: books, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!books || books.length === 0) {
    return NextResponse.json({ message: "分類が必要な本はありません", processed: 0 });
  }

  // タイムアウト対策: 1回のリクエストで処理する冊数を制限
  const booksToProcess = books.slice(0, MAX_BOOKS_PER_REQUEST);
  const remaining = books.length - booksToProcess.length;

  // バッチ処理（最大20冊ずつ）
  const BATCH_SIZE = 20;
  const results: ClassifyResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < booksToProcess.length; i += BATCH_SIZE) {
    const batch = booksToProcess.slice(i, i + BATCH_SIZE);

    const bookList = batch
      .map(
        (b, idx) =>
          `[${idx + 1}] タイトル: ${b.title} | 著者: ${b.author} | 出版社: ${b.publisher} | 概要: ${(b.description || "").slice(0, 100)}`
      )
      .join("\n");

    const prompt = `あなたは日本の書籍分類の専門家です。以下の蔵書リストを分析して、各本にジャンルとシリーズ情報を付与してください。

使用可能なジャンル一覧: ${GENRE_LIST}

ルール:
1. ジャンルは上記の一覧から最も適切な1つだけを選んでください。どれにも当てはまらない場合は「その他」を使用してください。
2. シリーズ名: 本がシリーズ物（漫画・小説シリーズ等）の一部である場合、シリーズ名を付与してください。シリーズでない場合は空文字にしてください。
   - 例: 「進撃の巨人 1」→ シリーズ名: "進撃の巨人", 巻数: 1
   - 例: 「ハリー・ポッターと賢者の石」→ シリーズ名: "ハリー・ポッター", 巻数: 1
   - 例: 「火花」→ シリーズ名: "", 巻数: null（単巻の作品）
3. 巻数が判別できない場合は null にしてください。

蔵書リスト:
${bookList}

以下のJSON配列形式で返答してください。コードブロックやマークダウンは不要です。純粋なJSONのみ返してください:
[
  { "index": 1, "genre": "ジャンル名", "series_name": "シリーズ名", "series_order": 1 },
  ...
]`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // JSON 部分を抽出（コードブロック対策）
      let jsonText = responseText;
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      let parsed: { index: number; genre: string; series_name: string; series_order: number | null }[];
      const raw = JSON.parse(jsonText);
      // 単一オブジェクトが返された場合の対応
      parsed = Array.isArray(raw) ? raw : [raw];

      for (const item of parsed) {
        // index が 0 始まりで返される場合の補正
        const idx = parsed.length === 1 ? 0 : (item.index ?? 1) - 1;
        const book = batch[idx];
        if (!book) continue;

        // ジャンルの検証
        const validGenre = GENRES.includes(item.genre as typeof GENRES[number])
          ? item.genre
          : "その他";

        results.push({
          id: book.id,
          genre: validGenre,
          series_name: item.series_name || "",
          series_order: item.series_order != null ? Math.round(item.series_order) : null,
        });
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Gemini API error:", errMsg);
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errMsg}`);
      // バッチが失敗しても残りは続行
      continue;
    }
  }

  // DB 更新
  let updated = 0;
  const updateErrors: string[] = [];
  for (const r of results) {
    const { error: updateError } = await supabase
      .from("books")
      .update({
        genre: r.genre,
        series_name: r.series_name,
        series_order: r.series_order,
        ai_classified: true,
      })
      .eq("id", r.id);

    if (!updateError) {
      updated++;
    } else {
      updateErrors.push(`${r.id}: ${updateError.message}`);
    }
  }

  return NextResponse.json({
    message: updated > 0 ? `${updated}冊を分類しました` : errors.length > 0 ? `AI分類に失敗しました: ${errors[0]}` : "分類対象がありません",
    processed: updated,
    total: books.length,
    remaining,
    resultsCount: results.length,
    ...(errors.length > 0 && { errors }),
    ...(updateErrors.length > 0 && { updateErrors }),
  });
}
