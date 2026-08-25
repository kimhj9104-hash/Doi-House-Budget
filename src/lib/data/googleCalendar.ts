import type { GoogleCalendarEvent } from "@/lib/types";

// 다른 lib/data/*.ts 파일과 달리 Firestore를 직접 호출하지 않는다 — refresh token은
// 클라이언트가 절대 만질 수 없게 서버(Admin SDK)에만 저장하므로, 아래 함수들은 대신
// src/app/api/google-calendar/** 라우트를 fetch로 호출한다.

export async function getGoogleCalendarConnectUrl(
  idToken: string,
  householdId: string,
): Promise<string> {
  const res = await fetch(`/api/google-calendar/connect?householdId=${householdId}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error("Google 캘린더 연동을 시작하지 못했어요");
  const data = (await res.json()) as { url: string };
  return data.url;
}

export async function fetchGoogleCalendarEvents(
  idToken: string,
  householdId: string,
  start: string,
  end: string,
): Promise<{ connected: boolean; events: GoogleCalendarEvent[] }> {
  const params = new URLSearchParams({ householdId, start, end });
  const res = await fetch(`/api/google-calendar/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!res.ok) throw new Error("Google 캘린더 일정을 불러오지 못했어요");
  return res.json();
}

export async function disconnectGoogleCalendar(
  idToken: string,
  householdId: string,
): Promise<void> {
  const res = await fetch("/api/google-calendar/disconnect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ householdId }),
  });
  if (!res.ok) throw new Error("Google 캘린더 연동 해제에 실패했어요");
}
