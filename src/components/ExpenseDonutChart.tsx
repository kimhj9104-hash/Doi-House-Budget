"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatWon } from "@/lib/format";

export type CategorySlice = {
  name: string;
  value: number;
  color: string;
};

export default function ExpenseDonutChart({
  data,
  total,
}: {
  data: CategorySlice[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-subtle-foreground">
        이번 달 지출 내역이 없어요
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="100%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((slice, i) => (
              <Cell key={i} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium text-muted-foreground">
          총 지출
        </span>
        <span className="text-lg font-bold text-foreground">
          {formatWon(total)}
        </span>
      </div>
    </div>
  );
}
