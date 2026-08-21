"use client";

import { useAuth } from "@/contexts/AuthContext";
import RecurringForm from "@/components/RecurringForm";
import { addRecurring, type RecurringInput } from "@/lib/data/recurring";

export default function NewRecurringPage() {
  const { householdId, categories } = useAuth();

  async function handleSubmit(input: RecurringInput) {
    if (!householdId) return;
    await addRecurring(householdId, input);
  }

  return (
    <RecurringForm
      title="고정 수입/지출 추가"
      categories={categories}
      onSubmit={handleSubmit}
      initial={{
        name: "",
        type: "expense",
        amount: 0,
        categoryId: null,
        memo: "",
        dayOfMonth: 1,
        active: true,
      }}
    />
  );
}
