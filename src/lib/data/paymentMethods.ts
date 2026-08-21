import {
  doc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PaymentMethod } from "@/lib/types";

export type PaymentMethodInput = {
  name: string;
  icon: string;
  color: string;
};

export async function addPaymentMethod(
  householdId: string,
  input: PaymentMethodInput,
  sortOrder: number,
) {
  await addDoc(collection(db, "households", householdId, "paymentMethods"), {
    ...input,
    sortOrder,
  });
}

export async function updatePaymentMethod(
  householdId: string,
  paymentMethodId: string,
  input: PaymentMethodInput,
) {
  await updateDoc(
    doc(db, "households", householdId, "paymentMethods", paymentMethodId),
    { ...input },
  );
}

export async function deletePaymentMethod(householdId: string, paymentMethodId: string) {
  await deleteDoc(doc(db, "households", householdId, "paymentMethods", paymentMethodId));
}

export async function reorderPaymentMethods(householdId: string, orderedItems: PaymentMethod[]) {
  const batch = writeBatch(db);
  orderedItems.forEach((item, index) => {
    batch.update(doc(db, "households", householdId, "paymentMethods", item.id), {
      sortOrder: index,
    });
  });
  await batch.commit();
}
