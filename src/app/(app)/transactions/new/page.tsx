"use client";

import { useAuth } from "@/contexts/AuthContext";
import { todayISODate } from "@/lib/format";
import TransactionForm from "@/components/TransactionForm";
import { addTransaction, type TransactionInput } from "@/lib/data/transactions";

export default function NewTransactionPage() {
  const { householdId, user, categories } = useAuth();

  async function handleSubmit(input: TransactionInput) {
    if (!householdId || !user) return;
    await addTransaction(householdId, user.uid, input);
  }

  return (
    <TransactionForm
      title="거래 추가"
      categories={categories}
      onSubmit={handleSubmit}
      initial={{
        type: "expense",
        amount: 0,
        categoryId: null,
        occurredOn: todayISODate(),
        memo: "",
      }}
    />
  );
}
