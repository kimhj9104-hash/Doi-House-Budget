"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RecurringForm from "@/components/RecurringForm";
import {
  updateRecurring,
  deleteRecurring,
  type RecurringInput,
} from "@/lib/data/recurring";

export default function EditRecurringPage() {
  const { id } = useParams<{ id: string }>();
  const { householdId, categories, recurringTransactions } = useAuth();
  const item = recurringTransactions.find((r) => r.id === id);

  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-subtle-foreground">
        항목을 찾을 수 없어요
      </div>
    );
  }

  async function handleSubmit(input: RecurringInput) {
    if (!householdId) return;
    await updateRecurring(householdId, id, input);
  }

  async function handleDelete() {
    if (!householdId) return;
    await deleteRecurring(householdId, id);
  }

  return (
    <RecurringForm
      title="고정 수입/지출 수정"
      categories={categories}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initial={{
        name: item.name,
        type: item.type,
        amount: item.amount,
        categoryId: item.categoryId,
        memo: item.memo,
        dayOfMonth: item.dayOfMonth,
        active: item.active,
      }}
    />
  );
}
