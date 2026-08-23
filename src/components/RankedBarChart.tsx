"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCompactWon, formatWon } from "@/lib/format";

export type RankedSlice = {
  id: string;
  name: string;
  value: number;
  color: string;
};

const BAR_HEIGHT = 40;
const VISIBLE_BARS = 8;

export default function RankedBarChart({
  data,
  total,
  emptyLabel = "이번 달 지출 내역이 없어요",
  onBarClick,
}: {
  data: RankedSlice[];
  total: number;
  emptyLabel?: string;
  onBarClick?: (id: string) => void;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-subtle-foreground">
        {emptyLabel}
      </div>
    );
  }

  const chartHeight = Math.max(data.length * BAR_HEIGHT, 120);
  const scrolls = data.length > VISIBLE_BARS;

  return (
    <div
      className={scrolls ? "overflow-y-auto pr-1" : undefined}
      style={{ maxHeight: scrolls ? VISIBLE_BARS * BAR_HEIGHT : undefined }}
    >
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 84, bottom: 0, left: 0 }}
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
                      const id = (entry.payload as RankedSlice | undefined)?.id;
                      if (id) onBarClick(id);
                    }
                  : undefined
              }
              className={onBarClick ? "cursor-pointer" : ""}
              label={(props: unknown) => {
                const { x, y, width, height, value } = props as {
                  x: number;
                  y: number;
                  width: number;
                  height: number;
                  value: number;
                };
                const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0;
                return (
                  <text
                    x={x + width + 8}
                    y={y + height / 2}
                    dy={4}
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--foreground)"
                  >
                    {`${formatCompactWon(Number(value))} (${pct}%)`}
                  </text>
                );
              }}
            >
              {data.map((slice, i) => (
                <Cell key={i} fill={slice.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
