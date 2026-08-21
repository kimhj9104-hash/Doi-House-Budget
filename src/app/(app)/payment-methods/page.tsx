"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cardClass } from "@/lib/ui";
import CategoryIcon from "@/components/CategoryIcon";
import { swapPaymentMethodOrder } from "@/lib/data/paymentMethods";

export default function PaymentMethodsPage() {
  const { paymentMethods, householdId } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    if (!householdId) return;
    const other = paymentMethods[index + direction];
    const current = paymentMethods[index];
    if (!other) return;
    setPendingId(current.id);
    try {
      await swapPaymentMethodOrder(householdId, current, other);
    } finally {
      setPendingId(null);
    }
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
        거래를 등록할 때 어떤 카드/계좌로 썼는지 선택할 수 있어요 (선택 항목).
      </p>

      <div className={`${cardClass} divide-y divide-border`}>
        {paymentMethods.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-subtle-foreground">
            결제수단이 없어요
          </p>
        ) : (
          paymentMethods.map((m, i) => (
            <div key={m.id} className="flex items-center gap-2 px-2 py-1.5">
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
                  disabled={i === paymentMethods.length - 1 || pendingId !== null}
                  onClick={() => move(i, 1)}
                  className="flex h-5 w-6 items-center justify-center text-subtle-foreground transition hover:text-foreground disabled:opacity-25"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              <Link
                href={`/payment-methods/${m.id}/edit`}
                className="flex flex-1 items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-hover"
              >
                <CategoryIcon icon={m.icon} color={m.color} size={16} />
                <span className="text-sm font-medium text-foreground">{m.name}</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
