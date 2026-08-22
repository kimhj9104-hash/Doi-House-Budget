"use client";

import { useAuth } from "@/contexts/AuthContext";
import RecurringForm from "@/components/RecurringForm";
import { addRecurring, type RecurringInput } from "@/lib/data/recurring";

export default function NewRecurringPage() {
  const { householdId, categories, paymentMethods, recurringTransactions } = useAuth();

  async function handleSubmit(input: RecurringInput) {
    if (!householdId) return;
    const sortOrder = recurringTransactions.filter((r) => r.type === input.type).length;
    await addRecurring(householdId, input, sortOrder);
  }

  return (
    <RecurringForm
      title="고정 수입/지출 추가"
      categories={categories}
      paymentMethods={paymentMethods}
      onSubmit={handleSubmit}
      initial={{
        name: "",
        type: "expense",
        amount: 0,
        categoryId: null,
        paymentMethodId: null,
        memo: "",
        note: "",
        dayOfMonth: 1,
        active: true,
      }}
    />
  );
}
