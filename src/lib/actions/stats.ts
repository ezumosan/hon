"use server";

import { createClient } from "@/lib/supabase/server";

export type ReadingStats = {
  /** 日付 → 読了冊数 マップ (YYYY-MM-DD) */
  dailyCounts: Record<string, number>;
  /** 年間の読了冊数 */
  yearTotal: number;
  /** 今月の読了冊数 */
  monthTotal: number;
  /** 最長連続日数 */
  maxStreak: number;
  /** 現在の連続日数 */
  currentStreak: number;
};

/** 読了データからコントリビューショングラフ用の統計を取得 */
export async function getReadingStats(year?: number): Promise<ReadingStats> {
  const supabase = await createClient();
  const targetYear = year ?? new Date().getFullYear();

  const startDate = `${targetYear}-01-01T00:00:00.000Z`;
  const endDate = `${targetYear}-12-31T23:59:59.999Z`;

  const { data: books } = await supabase
    .from("books")
    .select("id, read_at")
    .eq("status", "read")
    .not("read_at", "is", null)
    .gte("read_at", startDate)
    .lte("read_at", endDate)
    .order("read_at", { ascending: true });

  const dailyCounts: Record<string, number> = {};

  if (books) {
    for (const book of books) {
      if (!book.read_at) continue;
      const day = book.read_at.slice(0, 10); // YYYY-MM-DD
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }
  }

  // 年間合計
  const yearTotal = Object.values(dailyCounts).reduce((s, c) => s + c, 0);

  // 今月の合計
  const now = new Date();
  const currentMonth = `${targetYear}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTotal = Object.entries(dailyCounts)
    .filter(([d]) => d.startsWith(currentMonth))
    .reduce((s, [, c]) => s + c, 0);

  // 連続日数計算
  const sortedDays = Object.keys(dailyCounts).sort();
  let maxStreak = 0;
  let currentStreak = 0;
  let streak = 0;
  let prevDate: Date | null = null;

  const todayStr = now.toISOString().slice(0, 10);

  for (const day of sortedDays) {
    const date = new Date(day + "T00:00:00");
    if (prevDate) {
      const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        streak = 1;
      }
    } else {
      streak = 1;
    }
    if (streak > maxStreak) maxStreak = streak;
    prevDate = date;
  }

  // 現在の連続日数（今日 or 昨日から遡る）
  currentStreak = 0;
  const checkDate = new Date(now);
  // 今日に読了がなければ昨日からチェック
  if (!dailyCounts[todayStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const key = checkDate.toISOString().slice(0, 10);
    if (dailyCounts[key]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { dailyCounts, yearTotal, monthTotal, maxStreak, currentStreak };
}
