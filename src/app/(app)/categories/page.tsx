"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import type { Category } from "@/lib/types";

function CategorySection({ title, items }: { title: string; items: Category[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>
      <div className={`${cardClass} divide-y divide-border`}>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            카테고리가 없어요
          </p>
        ) : (
          items.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.id}/edit`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-surface-hover"
            >
              <CategoryIcon icon={c.icon} color={c.color} size={16} />
              <span className="text-sm font-medium text-foreground">{c.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { categories } = useAuth();
  const expense = categories.filter((c) => c.type === "expense");
  const income = categories.filter((c) => c.type === "income");

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground md:text-xl">
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

      <CategorySection title="지출" items={expense} />
      <CategorySection title="수입" items={income} />
    </div>
  );
}
