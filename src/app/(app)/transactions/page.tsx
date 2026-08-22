"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, List, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactionsInRange } from "@/hooks/useMonthTransactions";
import {
  currentMonthStr,
  formatDateLabel,
  formatSignedWon,
  formatWon,
  monthRange,
  shiftMonth,
} from "@/lib/format";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import CalendarView from "@/components/CalendarView";
import MultiSelectDropdown from "@/components/MultiSelectDropdown";
import DateRangeDropdown from "@/components/DateRangeDropdown";
import type { Category, Transaction, TransactionType } from "@/lib/types";

const FILTERS: { key: "all" | TransactionType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "expense", label: "지출" },
  { key: "income", label: "수입" },
];

function TransactionRow({
  t,
  categoryMap,
}: {
  t: Transaction;
  categoryMap: Map<string, Category>;
}) {
  const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
  return (
    <Link
      href={`/transactions/${t.id}/edit`}
      className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-hover"
    >
      <CategoryIcon icon={cat?.icon ?? "circle"} color={cat?.color ?? "#6b7280"} size={16} />
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
    </Link>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { householdId, categories, paymentMethods } = useAuth();
  const month = searchParams.get("month") ?? currentMonthStr();
  const filter = (searchParams.get("filter") ?? "all") as "all" | TransactionType;
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilterIds, setCategoryFilterIds] = useState<string[]>(() => {
    const id = searchParams.get("categoryId");
    return id ? [id] : [];
  });
  const [paymentMethodFilterIds, setPaymentMethodFilterIds] = useState<string[]>(() => {
    const id = searchParams.get("paymentMethodId");
    return id ? [id] : [];
  });
  const [rangeStart, setRangeStart] = useState(() => searchParams.get("occurredOn") ?? "");
  const [rangeEnd, setRangeEnd] = useState(() => searchParams.get("occurredOn") ?? "");
  const hasRange = Boolean(rangeStart && rangeEnd);

  const fetchRange = hasRange ? { start: rangeStart, end: rangeEnd } : monthRange(month);
  const { transactions } = useTransactionsInRange(householdId, fetchRange.start, fetchRange.end);

  function setDateRange(start: string, end: string) {
    setRangeStart(start);
    setRangeEnd(end);
    setSelectedDay(null);
    if (!start || !end) return;
    if (view === "calendar") setView("list");
  }

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );
  const paymentMethodMap = useMemo(
    () => new Map(paymentMethods.map((m) => [m.id, m])),
    [paymentMethods],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "none", label: "미분류" },
      ...categories
        .map((c) => ({ value: c.id, label: `${c.type === "income" ? "수입" : "지출"} · ${c.name}`, type: c.type, name: c.name }))
        .sort((a, b) => {
          if (a.type !== b.type) return a.type === "expense" ? -1 : 1;
          return a.name.localeCompare(b.name, "ko");
        }),
    ],
    [categories],
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

  const filtered = useMemo(() => {
    let list = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

    if (categoryFilterIds.length > 0) {
      list = list.filter((t) => categoryFilterIds.includes(t.categoryId ?? "none"));
    }
    if (paymentMethodFilterIds.length > 0) {
      list = list.filter((t) => paymentMethodFilterIds.includes(t.paymentMethodId ?? "none"));
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
        const method = t.paymentMethodId ? paymentMethodMap.get(t.paymentMethodId) : null;
        return (
          (t.memo ?? "").toLowerCase().includes(q) ||
          (t.note ?? "").toLowerCase().includes(q) ||
          !!cat?.name.toLowerCase().includes(q) ||
          !!method?.name.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [
    transactions,
    filter,
    categoryFilterIds,
    paymentMethodFilterIds,
    search,
    categoryMap,
    paymentMethodMap,
  ]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.occurredOn) ?? [];
      list.push(t);
      map.set(t.occurredOn, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const dayTransactions = selectedDay
    ? filtered.filter((t) => t.occurredOn === selectedDay)
    : [];

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netTotal = totalIncome - totalExpense;

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;

  function updateParams(next: { month?: string; filter?: string }) {
    const params = new URLSearchParams({
      month: next.month ?? month,
      filter: next.filter ?? filter,
    });
    setSelectedDay(null);
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          거래내역
        </h1>
        {hasRange ? (
          <button
            type="button"
            onClick={() => setDateRange("", "")}
            className="flex items-center gap-1 rounded-full border border-primary bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary"
          >
            {rangeStart === rangeEnd
              ? formatDateLabel(rangeStart)
              : `${formatDateLabel(rangeStart)} ~ ${formatDateLabel(rangeEnd)}`}
            <X size={12} />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateParams({ month: shiftMonth(month, -1) })}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[92px] text-center text-sm font-semibold text-foreground">
              {monthLabel}
            </span>
            <button
              onClick={() => updateParams({ month: shiftMonth(month, 1) })}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="relative mb-3">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="메모, 특이사항, 카테고리, 결제수단으로 검색"
          className="w-full rounded-xl border border-border-strong bg-white py-2.5 pl-9 pr-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <MultiSelectDropdown
          label="카테고리"
          options={categoryOptions}
          selected={categoryFilterIds}
          onChange={setCategoryFilterIds}
        />
        <MultiSelectDropdown
          label="결제수단"
          options={paymentMethodOptions}
          selected={paymentMethodFilterIds}
          onChange={setPaymentMethodFilterIds}
        />
        <DateRangeDropdown startDate={rangeStart} endDate={rangeEnd} onChange={setDateRange} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => updateParams({ filter: f.key })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {!hasRange && (
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
            <button
              onClick={() => setView("list")}
              className={`flex h-6 w-6 items-center justify-center rounded transition ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex h-6 w-6 items-center justify-center rounded transition ${
                view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <CalendarDays size={13} />
            </button>
          </div>
        )}
      </div>

      <div
        className={`${cardClass} mb-4 grid grid-cols-3 divide-x divide-border text-center`}
      >
        <div className="px-2 py-3">
          <p className="text-xs font-medium text-muted-foreground">수입</p>
          <p className="mt-0.5 text-sm font-bold text-income">{formatWon(totalIncome)}</p>
        </div>
        <div className="px-2 py-3">
          <p className="text-xs font-medium text-muted-foreground">지출</p>
          <p className="mt-0.5 text-sm font-bold text-expense">{formatWon(totalExpense)}</p>
        </div>
        <div className="px-2 py-3">
          <p className="text-xs font-medium text-muted-foreground">합계 ({filtered.length}건)</p>
          <p className="mt-0.5 text-sm font-bold text-foreground">
            {formatSignedWon(Math.abs(netTotal), netTotal >= 0 ? "income" : "expense")}
          </p>
        </div>
      </div>

      {view === "calendar" && !hasRange ? (
        <div className="flex flex-col gap-4">
          <div className={`${cardClass} p-3`}>
            <CalendarView
              month={month}
              transactions={filtered}
              selectedDay={selectedDay}
              onSelectDay={(d) => setSelectedDay(d === selectedDay ? null : d)}
            />
          </div>
          {selectedDay && (
            <div>
              <p className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">
                {formatDateLabel(selectedDay)}
              </p>
              <div className={`${cardClass} divide-y divide-border`}>
                {dayTransactions.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
                    이 날은 거래 내역이 없어요
                  </p>
                ) : (
                  dayTransactions.map((t) => (
                    <TransactionRow
                      key={t.id}
                      t={t}
                      categoryMap={categoryMap}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardClass} px-5 py-16 text-center`}>
          <p className="text-sm text-subtle-foreground">
            {hasRange ? "선택한 기간에는 거래 내역이 없어요" : "이 달에는 거래 내역이 없어요"}
          </p>
          <Link
            href="/transactions/new"
            className="mt-3 inline-block text-sm font-semibold text-primary"
          >
            + 거래 추가하기
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([date, items]) => (
            <div key={date}>
              <p className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">
                {formatDateLabel(date)}
              </p>
              <div className={`${cardClass} divide-y divide-border`}>
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    t={t}
                    categoryMap={categoryMap}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
