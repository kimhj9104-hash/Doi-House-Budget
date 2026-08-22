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
import { reorderPaymentMethods } from "@/lib/data/paymentMethods";
import type { PaymentMethod } from "@/lib/types";

export default function PaymentMethodsPage() {
  const { paymentMethods, householdId } = useAuth();
  const [order, setOrder] = useState<string[]>(paymentMethods.map((m) => m.id));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync local drag order when Firestore adds/removes a payment method
    setOrder((prev) => {
      const nextIds = paymentMethods.map((m) => m.id);
      const prevSet = new Set(prev);
      const sameSet =
        nextIds.length === prev.length && nextIds.every((id) => prevSet.has(id));
      return sameSet ? prev : nextIds;
    });
  }, [paymentMethods]);

  const ordered = useMemo(() => {
    const map = new Map(paymentMethods.map((m) => [m.id, m]));
    return order.map((id) => map.get(id)).filter((m): m is PaymentMethod => !!m);
  }, [order, paymentMethods]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  async function handleDragEnd(e: DragEndEvent) {
    if (!householdId) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(order, oldIndex, newIndex);
    setOrder(newOrder);
    const map = new Map(paymentMethods.map((m) => [m.id, m]));
    const newItems = newOrder.map((id) => map.get(id)).filter((m): m is PaymentMethod => !!m);
    await reorderPaymentMethods(householdId, newItems);
  }

  if (!householdId) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          결제수단
        </h1>
        <Link
          href="/payment-methods/new"
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          <Plus size={14} strokeWidth={2.5} />
          추가
        </Link>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        거래를 등록할 때 어떤 카드/계좌로 썼는지 선택할 수 있어요 (선택 항목). 항목을 드래그해서 순서를 바꿀 수 있어요.
      </p>

      {ordered.length === 0 ? (
        <div className={`${cardClass} divide-y divide-border`}>
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            결제수단이 없어요
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={order} strategy={verticalListSortingStrategy}>
            <div className={`${cardClass} divide-y divide-border`}>
              {ordered.map((m) => (
                <SortableRow key={m.id} id={m.id}>
                  <Link
                    href={`/payment-methods/${m.id}/edit`}
                    className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
                  >
                    <CategoryIcon icon={m.icon} color={m.color} size={16} />
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{m.name}</span>
                      {m.note && (
                        <span className="block truncate text-xs text-subtle-foreground">
                          {m.note}
                        </span>
                      )}
                    </div>
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
