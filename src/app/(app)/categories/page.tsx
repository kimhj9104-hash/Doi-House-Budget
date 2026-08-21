"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import { swapCategoryOrder } from "@/lib/data/categories";
import type { Category } from "@/lib/types";

function CategorySection({
  title,
  items,
  householdId,
}: {
  title: string;
  items: Category[];
  householdId: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const other = items[index + direction];
    const current = items[index];
    if (!other) return;
    setPendingId(current.id);
    try {
      await swapCategoryOrder(householdId, current, other);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>
      <div className={`${cardClass} divide-y divide-border`}>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            카테고리가 없어요
          </p>
        ) : (
          items.map((c, i) => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={i === 0 || pendingId !== null}
                  onClick={() => move(i, -1)}
                  className="flex h-5 w-6 items-center justify-center text-subtle-foreground transition hover:text-foreground disabled:opacity-25"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1 || pendingId !== null}
                  onClick={() => move(i, 1)}
                  className="flex h-5 w-6 items-center justify-center text-subtle-foreground transition hover:text-foreground disabled:opacity-25"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <Link
                href={`/categories/${c.id}/edit`}
                className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
              >
                <CategoryIcon icon={c.icon} color={c.color} size={16} />
                <span className="text-sm font-medium text-foreground">{c.name}</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories, householdId } = useAuth();
  const expense = categories
    .filter((c) => c.type === "expense")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const income = categories
    .filter((c) => c.type === "income")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!householdId) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          카테고리
        </h1>
        <Link
          href="/categories/new"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} strokeWidth={2.5} />
          추가
        </Link>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        화살표를 눌러 순서를 바꿀 수 있어요. 거래 등록 화면에 이 순서대로 표시돼요.
      </p>

      <CategorySection title="지출" items={expense} householdId={householdId} />
      <CategorySection title="수입" items={income} householdId={householdId} />
    </div>
  );
}
