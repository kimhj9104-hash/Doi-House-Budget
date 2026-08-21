"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthTransactions } from "@/hooks/useMonthTransactions";
import { currentMonthStr, formatSignedWon, formatWon, shiftMonth } from "@/lib/format";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import ExpenseDonutChart, { type CategorySlice } from "@/components/ExpenseDonutChart";
import PaymentMethodBarChart, {
  type PaymentMethodSlice,
} from "@/components/PaymentMethodBarChart";
import DailyExpenseBarChart, {
  type DailyExpensePoint,
} from "@/components/DailyExpenseBarChart";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { householdId, members, categories, paymentMethods } = useAuth();
  const month = searchParams.get("month") ?? currentMonthStr();
  const { transactions } = useMonthTransactions(householdId, month);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.uid, m.displayName])),
    [members],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const paymentMethodMap = useMemo(
    () => new Map(paymentMethods.map((m) => [m.id, m])),
    [paymentMethods],
  );

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expense;

  const chartData = useMemo(() => {
    const map = new Map<string, CategorySlice>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
      const key = cat?.name ?? "기타";
      const color = cat?.color ?? "#6b7280";
      const existing = map.get(key);
      if (existing) existing.value += Number(t.amount);
      else map.set(key, { name: key, value: Number(t.amount), color });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, categoryMap]);

  const paymentMethodData = useMemo(() => {
    const map = new Map<string, PaymentMethodSlice>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const method = t.paymentMethodId ? paymentMethodMap.get(t.paymentMethodId) : null;
      const key = method?.name ?? "미지정";
      const color = method?.color ?? "#6b7280";
      const existing = map.get(key);
      if (existing) existing.value += Number(t.amount);
      else map.set(key, { name: key, value: Number(t.amount), color });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, paymentMethodMap]);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;

  const dailyExpenseData = useMemo<DailyExpensePoint[]>(() => {
    const daysInMonth = new Date(y, m, 0).getDate();
    const totals = new Array(daysInMonth).fill(0);
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const day = Number(t.occurredOn.slice(8, 10));
      if (day >= 1 && day <= daysInMonth) totals[day - 1] += Number(t.amount);
    }
    return totals.map((value, i) => ({ day: i + 1, value }));
  }, [transactions, y, m]);
  const recent = transactions.slice(0, 8);

  function goToMonth(next: string) {
    router.push(`/dashboard?month=${next}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          대시보드
        </h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToMonth(shiftMonth(month, -1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="min-w-[92px] text-center text-sm font-semibold text-foreground">
            {monthLabel}
          </span>
          <button
            onClick={() => goToMonth(shiftMonth(month, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        className={`${cardClass} grid grid-cols-1 divide-y divide-border`}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">수입</p>
          <p className="text-base font-bold text-income">
            {formatWon(income)}
          </p>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">지출</p>
          <p className="text-base font-bold text-expense">
            {formatWon(expense)}
          </p>
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <p className="text-xs font-medium text-muted-foreground">잔액</p>
          <p className="text-base font-bold text-foreground">
            {formatWon(balance)}
          </p>
        </div>
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <h2 className="mb-2 text-sm font-bold text-foreground">
          카테고리별 지출
        </h2>
        <ExpenseDonutChart data={chartData} total={expense} />
        {chartData.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {chartData.slice(0, 6).map((slice) => (
              <div key={slice.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-muted-foreground">{slice.name}</span>
                <span className="ml-auto shrink-0 font-semibold text-foreground">
                  {formatWon(slice.value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <h2 className="mb-2 text-sm font-bold text-foreground">
          결제수단별 지출
        </h2>
        <PaymentMethodBarChart data={paymentMethodData} />
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <h2 className="mb-2 text-sm font-bold text-foreground">
          일별 지출 추이
        </h2>
        <DailyExpenseBarChart data={dailyExpenseData} />
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">최근 거래</h2>
          <Link
            href="/transactions"
            className="flex items-center gap-0.5 text-xs font-semibold text-primary"
          >
            전체보기
            <ArrowRight size={13} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="py-8 text-center text-sm text-subtle-foreground">
            아직 등록된 거래가 없어요
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((t) => {
              const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
              return (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <CategoryIcon
                    icon={cat?.icon ?? "circle"}
                    color={cat?.color ?? "#6b7280"}
                    size={16}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {cat?.name ?? "미분류"}
                      {t.memo ? ` · ${t.memo}` : ""}
                    </p>
                    <p className="text-xs text-subtle-foreground">
                      {memberMap.get(t.uid) || "가족"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      t.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {formatSignedWon(Number(t.amount), t.type)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
