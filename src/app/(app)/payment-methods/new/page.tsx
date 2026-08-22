"use client";

import { useAuth } from "@/contexts/AuthContext";
import PaymentMethodForm from "@/components/PaymentMethodForm";
import { addPaymentMethod, type PaymentMethodInput } from "@/lib/data/paymentMethods";

export default function NewPaymentMethodPage() {
  const { householdId, paymentMethods } = useAuth();

  async function handleSubmit(input: PaymentMethodInput) {
    if (!householdId) return;
    await addPaymentMethod(householdId, input, paymentMethods.length + 1);
  }

  return (
    <PaymentMethodForm
      title="결제수단 추가"
      onSubmit={handleSubmit}
      initial={{ name: "", color: "#2f6fed", icon: "credit-card", note: "" }}
    />
  );
}
