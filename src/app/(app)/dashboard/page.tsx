"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthTransactions } from "@/hooks/useMonthTransactions";
import {
  currentMonthStr,
  dateToISO,
  formatDateShort,
  formatSignedWon,
  formatWon,
  monthRange,
  shiftMonth,
} from "@/lib/format";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import RankedBarChart, { type RankedSlice } from "@/components/RankedBarChart";
import DailyExpenseBarChart, {
  type DailyExpensePoint,
} from "@/components/DailyExpenseBarChart";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { householdId, household, categories, paymentMethods } = useAuth();
  const fiscalStartDay = household?.fiscalStartDay ?? 1;
  const month = searchParams.get("month") ?? currentMonthStr(fiscalStartDay);
  const { transactions: allTransactions } = useMonthTransactions(
    householdId,
    month,
    fiscalStartDay,
  );

  const [paymentMethodFilterIds, setPaymentMethodFilterIds] = useState<string[]>([]);
  const [recurringFilterIds, setRecurringFilterIds] = useState<string[]>([]);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const paymentMethodMap = useMemo(
    () => new Map(paymentMethods.map((m) => [m.id, m])),
    [paymentMethods],
  );

  const paymentMethodOptions = useMemo(
    () => [
      { value: "none", label: "미지정" },
      ...[...paymentMethods]
        .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        .map((m) => ({ value: m.id, label: m.name })),
    ],
    [paymentMethods],
  );
  const recurringOptions = useMemo(
    () => [
      { value: "recurring", label: "고정" },
      { value: "none", label: "비고정" },
    ],
    [],
  );

  const transactions = useMemo(() => {
    let list = allTransactions;
    if (paymentMethodFilterIds.length > 0) {
      list = list.filter((t) =>
        paymentMethodFilterIds.includes(t.paymentMethodId ?? "none"),
      );
    }
    if (recurringFilterIds.length > 0) {
      list = list.filter((t) =>
        recurringFilterIds.includes(t.recurringId ? "recurring" : "none"),
      );
    }
    return list;
  }, [allTransactions, paymentMethodFilterIds, recurringFilterIds]);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = income - expense;

  const chartData = useMemo(() => {
    const map = new Map<string, RankedSlice>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
      const id = t.categoryId ?? "none";
      const name = cat?.name ?? "기타";
      const color = cat?.color ?? "#6b7280";
      const existing = map.get(id);
      if (existing) existing.value += Number(t.amount);
      else map.set(id, { id, name, value: Number(t.amount), color });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, categoryMap]);

  const paymentMethodData = useMemo(() => {
    const map = new Map<string, RankedSlice>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const method = t.paymentMethodId ? paymentMethodMap.get(t.paymentMethodId) : null;
      const id = t.paymentMethodId ?? "none";
      const name = method?.name ?? "미지정";
      const color = method?.color ?? "#6b7280";
      const existing = map.get(id);
      if (existing) existing.value += Number(t.amount);
      else map.set(id, { id, name, value: Number(t.amount), color });
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [transactions, paymentMethodMap]);

  function goToFilteredTransactions(kind: "categoryId" | "paymentMethodId", id: string) {
    const params = new URLSearchParams({ month, filter: "expense", [kind]: id });
    router.push(`/transactions?${params.toString()}`);
  }

  function goToDayTransactions(occurredOn: string) {
    const params = new URLSearchParams({ month, filter: "expense", occurredOn });
    router.push(`/transactions?${params.toString()}`);
  }

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;
  const fiscalRange = useMemo(() => monthRange(month, fiscalStartDay), [month, fiscalStartDay]);

  const dailyExpenseData = useMemo<DailyExpensePoint[]>(() => {
    const totalsByDate = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      totalsByDate.set(t.occurredOn, (totalsByDate.get(t.occurredOn) ?? 0) + Number(t.amount));
    }
    const start = new Date(fiscalRange.start + "T00:00:00");
    const end = new Date(fiscalRange.end + "T00:00:00");
    const points: DailyExpensePoint[] = [];
    for (const cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
      const date = dateToISO(cur);
      const day = cur.getDate();
      points.push({
        date,
        label: day === 1 ? `${cur.getMonth() + 1}/${day}` : `${day}`,
        value: totalsByDate.get(date) ?? 0,
      });
    }
    return points;
  }, [transactions, fiscalRange]);
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

      {fiscalStartDay !== 1 && (
        <p className="-mt-3 mb-4 text-right text-xs text-subtle-foreground">
          {formatDateShort(fiscalRange.start)} ~ {formatDateShort(fiscalRange.end)}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <MultiSelectDropdown
          label="결제수단"
          options={paymentMethodOptions}
          selected={paymentMethodFilterIds}
          onChange={setPaymentMethodFilterIds}
        />
        <MultiSelectDropdown
          label="고정"
          options={recurringOptions}
          selected={recurringFilterIds}
          onChange={setRecurringFilterIds}
        />
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
        <RankedBarChart
          data={chartData}
          total={expense}
          onBarClick={(id) => goToFilteredTransactions("categoryId", id)}
        />
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <h2 className="mb-2 text-sm font-bold text-foreground">
          결제수단별 지출
        </h2>
        <RankedBarChart
          data={paymentMethodData}
          total={expense}
          onBarClick={(id) => goToFilteredTransactions("paymentMethodId", id)}
        />
      </div>

      <div className={`${cardClass} mt-4 p-5`}>
        <h2 className="mb-2 text-sm font-bold text-foreground">
          일별 지출 추이
        </h2>
        <DailyExpenseBarChart data={dailyExpenseData} onBarClick={goToDayTransactions} />
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
