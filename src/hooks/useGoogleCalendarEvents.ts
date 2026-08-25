"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { fetchGoogleCalendarEvents } from "@/lib/data/googleCalendar";
import type { GoogleCalendarEvent } from "@/lib/types";

export function useGoogleCalendarEvents(
  householdId: string | null,
  start: string,
  end: string,
  enabled: boolean,
) {
  const [eventsByDay, setEventsByDay] = useState<Map<string, GoogleCalendarEvent[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId || !enabled || !auth.currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale events when disconnected or household/range changes
      setEventsByDay(new Map());
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);

    auth.currentUser
      .getIdToken()
      .then((idToken) => fetchGoogleCalendarEvents(idToken, householdId, start, end))
      .then(({ events }) => {
        if (ignore) return;
        const map = new Map<string, GoogleCalendarEvent[]>();
        for (const event of events) {
          const list = map.get(event.date) ?? [];
          list.push(event);
          map.set(event.date, list);
        }
        setEventsByDay(map);
      })
      .catch((err) => {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Google 캘린더 일정을 불러오지 못했어요");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [householdId, start, end, enabled]);

  return { eventsByDay, loading, error };
}
