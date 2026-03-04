import { NextRequest, NextResponse } from "next/server";

// ============================================================
// Vercel Cron: 毎日 AM 3:00 (JST) に AI 分類を自動実行
// ============================================================

export async function GET(request: NextRequest) {
  // Vercel Cron の認証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // AI 分類 API を内部呼び出し
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/ai/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
      body: JSON.stringify({}),
    });

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch (e) {
    console.error("Cron classify error:", e);
    return NextResponse.json(
      { error: "AI分類の自動実行に失敗しました" },
      { status: 500 }
    );
  }
}
