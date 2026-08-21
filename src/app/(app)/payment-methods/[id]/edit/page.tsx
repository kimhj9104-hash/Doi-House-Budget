"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PaymentMethodForm from "@/components/PaymentMethodForm";
import {
  updatePaymentMethod,
  deletePaymentMethod,
  type PaymentMethodInput,
} from "@/lib/data/paymentMethods";

export default function EditPaymentMethodPage() {
  const { id } = useParams<{ id: string }>();
  const { householdId, paymentMethods } = useAuth();
  const method = paymentMethods.find((m) => m.id === id);

  if (!method) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-subtle-foreground">
        결제수단을 찾을 수 없어요
      </div>
    );
  }

  async function handleSubmit(input: PaymentMethodInput) {
    if (!householdId) return;
    await updatePaymentMethod(householdId, id, input);
  }

  async function handleDelete() {
    if (!householdId) return;
    await deletePaymentMethod(householdId, id);
  }

  return (
    <PaymentMethodForm
      title="결제수단 수정"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initial={{ name: method.name, color: method.color, icon: method.icon }}
    />
  );
}
