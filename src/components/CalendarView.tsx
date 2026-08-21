"use client";

import { useMemo } from "react";
import { formatWon } from "@/lib/format";
import type { Transaction } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildGrid(monthStr: string): (number | null)[] {
  const [y, m] = monthStr.split("-").map(Number);
  const startWeekday = new Date(y, m - 1, 1).getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarView({
  month,
  transactions,
  selectedDay,
  onSelectDay,
}: {
  month: string;
  transactions: Transaction[];
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}) {
  const cells = useMemo(() => buildGrid(month), [month]);

  const dailyTotals = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const t of transactions) {
      const entry = map.get(t.occurredOn) ?? { income: 0, expense: 0 };
      if (t.type === "income") entry.income += Number(t.amount);
      else entry.expense += Number(t.amount);
      map.set(t.occurredOn, entry);
    }
    return map;
  }, [transactions]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[11px] font-semibold text-subtle-foreground">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const dateStr = `${month}-${String(day).padStart(2, "0")}`;
          const totals = dailyTotals.get(dateStr);
          const isSelected = selectedDay === dateStr;
          const isToday = dateStr === todayStr;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDay(dateStr)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition ${
                isSelected ? "bg-primary-soft" : "hover:bg-surface-hover"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : isSelected
                      ? "text-primary"
                      : "text-foreground"
                }`}
              >
                {day}
              </span>
              <span className="flex flex-col gap-0.5">
                {totals?.expense ? (
                  <span className="text-[9px] font-medium leading-none text-expense">
                    -{formatCompact(totals.expense)}
                  </span>
                ) : null}
                {totals?.income ? (
                  <span className="text-[9px] font-medium leading-none text-income">
                    +{formatCompact(totals.income)}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function formatCompact(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만`;
  }
  return formatWon(amount).replace("원", "");
}
