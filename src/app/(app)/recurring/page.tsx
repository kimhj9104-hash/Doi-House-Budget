"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import { formatWon } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";
import type { RecurringTransaction } from "@/lib/types";

function RecurringSection({
  title,
  items,
  categoryMap,
}: {
  title: string;
  items: RecurringTransaction[];
  categoryMap: Map<string, { name: string; color: string; icon: string }>;
}) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>
      <div className={`${cardClass} divide-y divide-border`}>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            등록된 항목이 없어요
          </p>
        ) : (
          items.map((r) => {
            const cat = r.categoryId ? categoryMap.get(r.categoryId) : null;
            return (
              <Link
                key={r.id}
                href={`/recurring/${r.id}/edit`}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-hover"
              >
                <CategoryIcon icon={cat?.icon ?? "circle"} color={cat?.color ?? "#6b7280"} size={16} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.name}
                    {!r.active && (
                      <span className="ml-1.5 text-xs font-normal text-subtle-foreground">
                        (일시정지)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-subtle-foreground">매월 {r.dayOfMonth}일</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold ${
                    r.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {formatWon(r.amount)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function RecurringPage() {
  const { recurringTransactions, categories } = useAuth();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const expense = recurringTransactions.filter((r) => r.type === "expense");
  const income = recurringTransactions.filter((r) => r.type === "income");

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          고정 수입/지출
        </h1>
        <Link
          href="/recurring/new"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} strokeWidth={2.5} />
          추가
        </Link>
      </div>
      <p className="mb-5 text-xs text-muted-foreground">
        여기 등록해두면 매달 자동으로 거래 내역에 추가돼요 (앱을 열 때 그 달에 아직 없으면 추가됩니다).
      </p>

      <RecurringSection title="고정 지출" items={expense} categoryMap={categoryMap} />
      <RecurringSection title="고정 수입" items={income} categoryMap={categoryMap} />
    </div>
  );
}
