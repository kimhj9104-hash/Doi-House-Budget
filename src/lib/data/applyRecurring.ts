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

const REGISTER_HOUR = 8;

function clampedDay(monthStr: string, dayOfMonth: number): number {
  const [y, m] = monthStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return Math.min(Math.max(dayOfMonth, 1), lastDay);
}

function clampedDateForMonth(monthStr: string, dayOfMonth: number): string {
  return `${monthStr}-${String(clampedDay(monthStr, dayOfMonth)).padStart(2, "0")}`;
}

function scheduledDateTime(monthStr: string, dayOfMonth: number): Date {
  const [y, m] = monthStr.split("-").map(Number);
  return new Date(y, m - 1, clampedDay(monthStr, dayOfMonth), REGISTER_HOUR, 0, 0, 0);
}

/**
 * 이번 달에 아직 생성되지 않았고, 설정한 날짜의 오전 8시가 지난 활성 고정 수입/지출
 * 항목을 자동으로 거래 내역에 추가한다.
 * Firebase 무료 플랜에는 서버 스케줄러(Cloud Functions)가 없어서, 앱을 열 때마다
 * 클라이언트에서 "이번 달 거래에 이 recurringId가 이미 있는지 + 등록 시각이 지났는지"를
 * 확인하는 방식으로 근사한다. 등록 시각이 지난 뒤 앱을 열어야 실제로 생성된다.
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

  const now = new Date();
  const due = active.filter(
    (r) => !appliedRecurringIds.has(r.id) && now >= scheduledDateTime(month, r.dayOfMonth),
  );
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
