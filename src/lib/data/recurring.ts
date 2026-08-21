import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TransactionType } from "@/lib/types";

export type RecurringInput = {
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  memo: string;
  dayOfMonth: number;
  active: boolean;
};

export async function addRecurring(householdId: string, input: RecurringInput) {
  await addDoc(collection(db, "households", householdId, "recurringTransactions"), {
    ...input,
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
