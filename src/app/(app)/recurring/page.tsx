"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import { formatWon } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";
import SortableRow from "@/components/SortableRow";
import { reorderRecurring } from "@/lib/data/recurring";
import type { RecurringTransaction } from "@/lib/types";

function sortRecurring(items: RecurringTransaction[]): RecurringTransaction[] {
  return [...items].sort((a, b) => {
    const sa = a.sortOrder ?? a.createdAt;
    const sb = b.sortOrder ?? b.createdAt;
    return sa - sb;
  });
}

function RecurringSection({
  title,
  items,
  categoryMap,
  householdId,
}: {
  title: string;
  items: RecurringTransaction[];
  categoryMap: Map<string, { name: string; color: string; icon: string }>;
  householdId: string;
}) {
  const sortedItems = useMemo(() => sortRecurring(items), [items]);
  const [order, setOrder] = useState<string[]>(sortedItems.map((r) => r.id));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync local drag order when Firestore adds/removes an item
    setOrder((prev) => {
      const nextIds = sortedItems.map((r) => r.id);
      const prevSet = new Set(prev);
      const sameSet =
        nextIds.length === prev.length && nextIds.every((id) => prevSet.has(id));
      return sameSet ? prev : nextIds;
    });
  }, [sortedItems]);

  const ordered = useMemo(() => {
    const map = new Map(items.map((r) => [r.id, r]));
    return order.map((id) => map.get(id)).filter((r): r is RecurringTransaction => !!r);
  }, [order, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);
    const map = new Map(items.map((r) => [r.id, r]));
    const newItems = newOrder.map((id) => map.get(id)).filter((r): r is RecurringTransaction => !!r);
    await reorderRecurring(householdId, newItems);
  }

  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>
      {ordered.length === 0 ? (
        <div className={`${cardClass} divide-y divide-border`}>
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            등록된 항목이 없어요
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className={`${cardClass} divide-y divide-border`}>
              {ordered.map((r) => {
                const cat = r.categoryId ? categoryMap.get(r.categoryId) : null;
                return (
                  <SortableRow key={r.id} id={r.id}>
                    <Link
                      href={`/recurring/${r.id}/edit`}
                      className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
                    >
                      <CategoryIcon
                        icon={cat?.icon ?? "circle"}
                        color={cat?.color ?? "#6b7280"}
                        size={16}
                      />
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
                  </SortableRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default function RecurringPage() {
  const { recurringTransactions, categories, householdId } = useAuth();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const expense = recurringTransactions.filter((r) => r.type === "expense");
  const income = recurringTransactions.filter((r) => r.type === "income");

  if (!householdId) return null;

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
        여기 등록해두면 매달 자동으로 거래 내역에 추가돼요 (앱을 열 때 그 달에 아직 없으면 추가됩니다). 항목을 드래그해서 순서를 바꿀 수 있어요.
      </p>

      <RecurringSection title="고정 지출" items={expense} categoryMap={categoryMap} householdId={householdId} />
      <RecurringSection title="고정 수입" items={income} categoryMap={categoryMap} householdId={householdId} />
    </div>
  );
}
