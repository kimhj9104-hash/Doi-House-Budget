"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon } from "@/lib/format";

export type PaymentMethodSlice = {
  id: string;
  name: string;
  value: number;
  color: string;
};

export default function PaymentMethodBarChart({
  data,
  onBarClick,
}: {
  data: PaymentMethodSlice[];
  onBarClick?: (id: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-subtle-foreground">
        이번 달 지출 내역이 없어요
      </div>
    );
  }

  const height = Math.max(data.length * 40, 120);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={84}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            formatter={(value) => formatWon(Number(value))}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            barSize={16}
            onClick={
              onBarClick
                ? (entry) => {
                    const id = (entry.payload as PaymentMethodSlice | undefined)?.id;
                    if (id) onBarClick(id);
                  }
                : undefined
            }
            className={onBarClick ? "cursor-pointer" : ""}
          >
            {data.map((slice, i) => (
              <Cell key={i} fill={slice.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
