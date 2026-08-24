"use client";

import { useMemo } from "react";
import { dateToISO } from "@/lib/format";
import type { Transaction } from "@/lib/types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function buildGrid(startDate: string, endDate: string): (string | null)[] {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const startWeekday = start.getDay();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (const cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
    cells.push(dateToISO(cur));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarView({
  startDate,
  endDate,
  transactions,
  selectedDay,
  onSelectDay,
}: {
  startDate: string;
  endDate: string;
  transactions: Transaction[];
  selectedDay: string | null;
  onSelectDay: (dateStr: string) => void;
}) {
  const cells = useMemo(() => buildGrid(startDate, endDate), [startDate, endDate]);
  const firstDateIndex = useMemo(() => cells.findIndex((c) => c !== null), [cells]);

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
        {cells.map((dateStr, i) => {
          if (dateStr === null) return <div key={i} />;
          const [, mo, da] = dateStr.split("-").map(Number);
          const dayLabel = da === 1 || i === firstDateIndex ? `${mo}/${da}` : `${da}`;
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
                className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold ${
                  dayLabel.length > 2 ? "text-[9px]" : "text-[11px]"
                } ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : isSelected
                      ? "text-primary"
                      : "text-foreground"
                }`}
              >
                {dayLabel}
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
  const man = amount / 10000;
  return `${man % 1 === 0 ? man : man.toFixed(1)}만`;
}
