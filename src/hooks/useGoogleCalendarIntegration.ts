"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { GoogleCalendarIntegration } from "@/lib/types";

export function useGoogleCalendarIntegration(householdId: string | null) {
  const [integration, setIntegration] = useState<GoogleCalendarIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!householdId) return;
    return onSnapshot(
      doc(db, "households", householdId, "integrations", "googleCalendar"),
      (snap) => {
        setIntegration(snap.exists() ? (snap.data() as GoogleCalendarIntegration) : null);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [householdId]);

  return { integration, loading };
}
