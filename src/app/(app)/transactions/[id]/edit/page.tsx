"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import TransactionForm from "@/components/TransactionForm";
import {
  updateTransaction,
  deleteTransaction,
  type TransactionInput,
} from "@/lib/data/transactions";
import type { Transaction } from "@/lib/types";

export default function EditTransactionPage() {
  const { id } = useParams<{ id: string }>();
  const { householdId, categories } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null | undefined>(undefined);

  useEffect(() => {
    if (!householdId) return;
    getDoc(doc(db, "households", householdId, "transactions", id)).then((snap) => {
      setTransaction(
        snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Transaction, "id">) }) : null,
      );
    });
  }, [householdId, id]);

  if (transaction === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={22} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (transaction === null) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-subtle-foreground">
        거래를 찾을 수 없어요
      </div>
    );
  }

  async function handleSubmit(input: TransactionInput) {
    if (!householdId) return;
    await updateTransaction(householdId, id, input);
  }

  async function handleDelete() {
    if (!householdId) return;
    await deleteTransaction(householdId, id);
  }

  return (
    <TransactionForm
      title="거래 수정"
      categories={categories}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initial={{
        type: transaction.type,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId,
        occurredOn: transaction.occurredOn,
        memo: transaction.memo,
      }}
    />
  );
}
