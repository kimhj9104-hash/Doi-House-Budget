import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { currentMonthStr, monthRange } from "@/lib/format";
import type { RecurringTransaction } from "@/lib/types";

function clampedDateForMonth(monthStr: string, dayOfMonth: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(dayOfMonth, 1), lastDay);
  return `${monthStr}-${String(day).padStart(2, "0")}`;
}

/**
 * 이번 달에 아직 생성되지 않은 활성 고정 수입/지출 항목을 자동으로 거래 내역에 추가한다.
 * Firebase 무료 플랜에는 서버 스케줄러(Cloud Functions)가 없어서, 앱을 열 때마다
 * 클라이언트에서 "이번 달 거래에 이 recurringId가 이미 있는지" 확인하는 방식으로 처리한다.
 */
export async function applyDueRecurringTransactions(
  householdId: string,
  uid: string,
  recurringItems: RecurringTransaction[],
) {
  const active = recurringItems.filter((r) => r.active);
  if (active.length === 0) return;

  const month = currentMonthStr();
  const { start, end } = monthRange(month);

  const snap = await getDocs(
    query(
      collection(db, "households", householdId, "transactions"),
      where("occurredOn", ">=", start),
      where("occurredOn", "<=", end),
    ),
  );

  const appliedRecurringIds = new Set(
    snap.docs.map((d) => d.data().recurringId).filter(Boolean),
  );

  const due = active.filter((r) => !appliedRecurringIds.has(r.id));
  if (due.length === 0) return;

  const transactionsRef = collection(db, "households", householdId, "transactions");
  const batch = writeBatch(db);
  for (const r of due) {
    batch.set(doc(transactionsRef), {
      type: r.type,
      amount: r.amount,
      categoryId: r.categoryId,
      paymentMethodId: r.paymentMethodId ?? null,
      occurredOn: clampedDateForMonth(month, r.dayOfMonth),
      memo: r.memo || r.name,
      note: r.note ?? "",
      uid,
      createdAt: Date.now(),
      recurringId: r.id,
    });
  }
  await batch.commit();
}
