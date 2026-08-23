"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactWon, formatDateShort, formatWon } from "@/lib/format";

export type DailyExpensePoint = {
  date: string;
  label: string;
  value: number;
};

export default function DailyExpenseBarChart({
  data,
  onBarClick,
}: {
  data: DailyExpensePoint[];
  onBarClick?: (date: string) => void;
}) {
  const hasData = data.some((d) => d.value > 0);
  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-subtle-foreground">
        이번 달 지출 내역이 없어요
      </div>
    );
  }

  const interval = Math.max(0, Math.ceil(data.length / 8) - 1);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={interval}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            width={48}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompactWon(Number(v))}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as DailyExpensePoint | undefined;
              return point ? formatDateShort(point.date) : "";
            }}
            formatter={(value) => formatWon(Number(value))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="value"
            fill="var(--expense)"
            radius={[4, 4, 0, 0]}
            onClick={
              onBarClick
                ? (entry) => {
                    const date = (entry.payload as DailyExpensePoint | undefined)?.date;
                    if (date) onBarClick(date);
                  }
                : undefined
            }
            className={onBarClick ? "cursor-pointer" : ""}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
