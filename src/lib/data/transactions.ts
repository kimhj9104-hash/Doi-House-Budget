import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TransactionType } from "@/lib/types";

export type TransactionInput = {
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  paymentMethodId: string | null;
  occurredOn: string;
  memo: string;
  note: string;
};

export async function addTransaction(
  householdId: string,
  uid: string,
  input: TransactionInput,
) {
  await addDoc(collection(db, "households", householdId, "transactions"), {
    ...input,
    uid,
    createdAt: Date.now(),
  });
}

export async function updateTransaction(
  householdId: string,
  transactionId: string,
  input: TransactionInput,
) {
  await updateDoc(
    doc(db, "households", householdId, "transactions", transactionId),
    { ...input },
  );
}

export async function deleteTransaction(
  householdId: string,
  transactionId: string,
) {
  await deleteDoc(
    doc(db, "households", householdId, "transactions", transactionId),
  );
}
