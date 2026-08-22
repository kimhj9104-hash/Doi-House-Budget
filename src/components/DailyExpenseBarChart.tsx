"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon } from "@/lib/format";

export type DailyExpensePoint = {
  day: number;
  value: number;
};

export default function DailyExpenseBarChart({
  data,
  onBarClick,
}: {
  data: DailyExpensePoint[];
  onBarClick?: (day: number) => void;
}) {
  const hasData = data.some((d) => d.value > 0);
  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-subtle-foreground">
        이번 달 지출 내역이 없어요
      </div>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            interval={4}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <YAxis hide />
          <Tooltip
            labelFormatter={(day) => `${day}일`}
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
                    const day = (entry.payload as DailyExpensePoint | undefined)?.day;
                    if (day) onBarClick(day);
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
