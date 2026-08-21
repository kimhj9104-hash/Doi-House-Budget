import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Category, TransactionType } from "@/lib/types";

export type CategoryInput = {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
};

export async function addCategory(
  householdId: string,
  input: CategoryInput,
  sortOrder: number,
) {
  await addDoc(collection(db, "households", householdId, "categories"), {
    ...input,
    sortOrder,
  });
}

export async function updateCategory(
  householdId: string,
  categoryId: string,
  input: CategoryInput,
) {
  await updateDoc(
    doc(db, "households", householdId, "categories", categoryId),
    { ...input },
  );
}

export async function deleteCategory(householdId: string, categoryId: string) {
  await deleteDoc(doc(db, "households", householdId, "categories", categoryId));
}

export async function swapCategoryOrder(
  householdId: string,
  a: Category,
  b: Category,
) {
  const batch = writeBatch(db);
  batch.update(doc(db, "households", householdId, "categories", a.id), {
    sortOrder: b.sortOrder,
  });
  batch.update(doc(db, "households", householdId, "categories", b.id), {
    sortOrder: a.sortOrder,
  });
  await batch.commit();
}
