"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { monthRange } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function useMonthTransactions(householdId: string | null, month: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show loading while switching months instead of stale data
    setLoading(true);
    const { start, end } = monthRange(month);

    const q = query(
      collection(db, "households", householdId, "transactions"),
      where("occurredOn", ">=", start),
      where("occurredOn", "<=", end),
      orderBy("occurredOn", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, "id">) }))
          .sort((a, b) => {
            if (a.occurredOn !== b.occurredOn) return a.occurredOn < b.occurredOn ? 1 : -1;
            return (b.createdAt ?? 0) - (a.createdAt ?? 0);
          });
        setTransactions(rows);
        setLoading(false);
      },
      (err) => {
        setError(err instanceof Error ? err.message : "거래 내역을 불러오지 못했어요");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, month]);

  return { transactions, loading, error };
}
