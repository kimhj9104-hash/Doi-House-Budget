import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RecurringTransaction, TransactionType } from "@/lib/types";

export type RecurringInput = {
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  paymentMethodId: string | null;
  memo: string;
  note: string;
  dayOfMonth: number;
  active: boolean;
};

export async function addRecurring(
  householdId: string,
  input: RecurringInput,
  sortOrder: number,
) {
  await addDoc(collection(db, "households", householdId, "recurringTransactions"), {
    ...input,
    sortOrder,
    createdAt: Date.now(),
  });
}

export async function updateRecurring(
  householdId: string,
  recurringId: string,
  input: RecurringInput,
) {
  await updateDoc(
    doc(db, "households", householdId, "recurringTransactions", recurringId),
    { ...input },
  );
}

export async function deleteRecurring(householdId: string, recurringId: string) {
  await deleteDoc(doc(db, "households", householdId, "recurringTransactions", recurringId));
}

export async function reorderRecurring(
  householdId: string,
  orderedItems: RecurringTransaction[],
) {
  const batch = writeBatch(db);
  orderedItems.forEach((item, index) => {
    batch.update(doc(db, "households", householdId, "recurringTransactions", item.id), {
      sortOrder: index,
    });
  });
  await batch.commit();
}
