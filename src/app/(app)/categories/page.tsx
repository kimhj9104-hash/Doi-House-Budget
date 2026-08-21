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
import CategoryIcon from "@/components/CategoryIcon";
import SortableRow from "@/components/SortableRow";
import { reorderCategories } from "@/lib/data/categories";
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
  const [order, setOrder] = useState<string[]>(items.map((c) => c.id));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync local drag order when Firestore adds/removes a category
    setOrder((prev) => {
      const nextIds = items.map((c) => c.id);
      const prevSet = new Set(prev);
      const sameSet =
        nextIds.length === prev.length && nextIds.every((id) => prevSet.has(id));
      return sameSet ? prev : nextIds;
    });
  }, [items]);

  const ordered = useMemo(() => {
    const map = new Map(items.map((c) => [c.id, c]));
    return order.map((id) => map.get(id)).filter((c): c is Category => !!c);
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
    const map = new Map(items.map((c) => [c.id, c]));
    const newItems = newOrder.map((id) => map.get(id)).filter((c): c is Category => !!c);
    await reorderCategories(householdId, newItems);
  }

  return (
    <div className="mb-6">
      <h2 className="mb-2 px-1 text-sm font-bold text-foreground">{title}</h2>
      {ordered.length === 0 ? (
        <div className={`${cardClass} divide-y divide-border`}>
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            카테고리가 없어요
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className={`${cardClass} divide-y divide-border`}>
              {ordered.map((c) => (
                <SortableRow key={c.id} id={c.id}>
                  <Link
                    href={`/categories/${c.id}/edit`}
                    className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
                  >
                    <CategoryIcon icon={c.icon} color={c.color} size={16} />
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                  </Link>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
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
        항목을 드래그해서 순서를 바꿀 수 있어요. 거래 등록 화면에 이 순서대로 표시돼요.
      </p>

      <CategorySection title="지출" items={expense} householdId={householdId} />
      <CategorySection title="수입" items={income} householdId={householdId} />
    </div>
  );
}
