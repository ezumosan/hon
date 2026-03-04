"use client";

type Props = {
  dailyCounts: Record<string, number>;
  year: number;
};

const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const DAY_LABELS = ["月", "", "水", "", "金", "", ""];

function getColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-emerald-200 dark:bg-emerald-900";
  if (count === 2) return "bg-emerald-400 dark:bg-emerald-700";
  if (count <= 4) return "bg-emerald-500 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-400";
}

export default function ContributionGraph({ dailyCounts, year }: Props) {
  // 1年分の週ごとのグリッドを構築
  // 1月1日から12月31日まで
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // 1月1日の曜日（0=日, 1=月, ... 6=土）→ 月曜始まりに変換
  const startDow = (startDate.getDay() + 6) % 7; // 月=0, 火=1, ... 日=6

  // 週ごとのデータを構築
  type CellData = { date: string; count: number } | null;
  const weeks: CellData[][] = [];
  let currentWeek: CellData[] = [];

  // 最初の週の空白セルを埋める
  for (let i = 0; i < startDow; i++) {
    currentWeek.push(null);
  }

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const count = dailyCounts[dateStr] || 0;
    currentWeek.push({ date: dateStr, count });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }

  // 最後の週が7未満なら null で埋める
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // 月ラベルの位置を計算
  const monthPositions: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    for (const cell of weeks[w]) {
      if (cell) {
        const month = parseInt(cell.date.slice(5, 7), 10) - 1;
        if (month !== lastMonth) {
          monthPositions.push({ label: MONTH_LABELS[month], weekIndex: w });
          lastMonth = month;
        }
        break;
      }
    }
  }

  const maxCount = Math.max(1, ...Object.values(dailyCounts));

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-foreground">{year}年 読了コントリビューション</h2>

      {/* グラフ */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-[720px]">
          {/* 月ラベル */}
          <div className="mb-1 flex" style={{ paddingLeft: "28px" }}>
            {monthPositions.map((mp, i) => {
              const nextWeek = i + 1 < monthPositions.length ? monthPositions[i + 1].weekIndex : weeks.length;
              const span = nextWeek - mp.weekIndex;
              return (
                <div
                  key={mp.label + mp.weekIndex}
                  className="text-xs text-muted-foreground"
                  style={{ width: `${span * 14}px` }}
                >
                  {mp.label}
                </div>
              );
            })}
          </div>

          {/* グリッド */}
          <div className="flex gap-0">
            {/* 曜日ラベル */}
            <div className="mr-1 flex flex-col gap-[2px]" style={{ width: "24px" }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex h-[12px] items-center justify-end text-[9px] text-muted-foreground"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 週カラム */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell ? `${cell.date}: ${cell.count}冊` : ""}
                    className={`h-[12px] w-[12px] rounded-sm transition-colors ${
                      cell ? getColor(cell.count) : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            <span>少</span>
            <div className={`h-[10px] w-[10px] rounded-sm ${getColor(0)}`} />
            <div className={`h-[10px] w-[10px] rounded-sm ${getColor(1)}`} />
            <div className={`h-[10px] w-[10px] rounded-sm ${getColor(2)}`} />
            <div className={`h-[10px] w-[10px] rounded-sm ${getColor(3)}`} />
            <div className={`h-[10px] w-[10px] rounded-sm ${getColor(5)}`} />
            <span>多</span>
          </div>
        </div>
      </div>
    </div>
  );
}
