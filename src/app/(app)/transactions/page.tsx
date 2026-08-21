"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMonthTransactions } from "@/hooks/useMonthTransactions";
import {
  currentMonthStr,
  formatDateLabel,
  formatSignedWon,
  shiftMonth,
} from "@/lib/format";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import type { Transaction, TransactionType } from "@/lib/types";

const FILTERS: { key: "all" | TransactionType; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "expense", label: "지출" },
  { key: "income", label: "수입" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { householdId, members, categories } = useAuth();
  const month = searchParams.get("month") ?? currentMonthStr();
  const filter = (searchParams.get("filter") ?? "all") as "all" | TransactionType;
  const { transactions } = useMonthTransactions(householdId, month);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.uid, m.displayName])),
    [members],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) {
      const list = map.get(t.occurredOn) ?? [];
      list.push(t);
      map.set(t.occurredOn, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `${y}년 ${m}월`;

  function updateParams(next: { month?: string; filter?: string }) {
    const params = new URLSearchParams({
      month: next.month ?? month,
      filter: next.filter ?? filter,
    });
    router.push(`/transactions?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground md:text-xl">
          거래내역
        </h1>
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
      </div>

      <div className="mb-4 flex gap-2">
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

      {filtered.length === 0 ? (
        <div className={`${cardClass} px-5 py-16 text-center`}>
          <p className="text-sm text-subtle-foreground">
            이 달에는 거래 내역이 없어요
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
                {items.map((t) => {
                  const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
                  return (
                    <Link
                      key={t.id}
                      href={`/transactions/${t.id}/edit`}
                      className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-hover"
                    >
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
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
