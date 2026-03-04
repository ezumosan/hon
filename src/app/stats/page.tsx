import { getReadingStats } from "@/lib/actions/stats";
import ContributionGraph from "@/components/ContributionGraph";

export const metadata = { title: "読書記録 - Hon" };

export default async function StatsPage() {
  const currentYear = new Date().getFullYear();
  const stats = await getReadingStats(currentYear);

  return (
    <div className="animate-fade-in">
      <h1 className="mb-6 text-2xl font-bold text-foreground sm:mb-8">読書記録</h1>

      {/* サマリーカード */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-primary">{stats.yearTotal}</p>
          <p className="mt-1 text-xs text-muted-foreground">{currentYear}年 読了</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-accent">{stats.monthTotal}</p>
          <p className="mt-1 text-xs text-muted-foreground">今月 読了</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{stats.currentStreak}</p>
          <p className="mt-1 text-xs text-muted-foreground">現在の連続日数</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-3xl font-bold text-foreground">{stats.maxStreak}</p>
          <p className="mt-1 text-xs text-muted-foreground">最長連続日数</p>
        </div>
      </div>

      {/* コントリビューショングラフ */}
      <ContributionGraph dailyCounts={stats.dailyCounts} year={currentYear} />
    </div>
  );
}
