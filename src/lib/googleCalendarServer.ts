import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import type { GoogleCalendarEvent } from "@/lib/types";

const STATE_TTL_MS = 10 * 60 * 1000;
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export class InvalidGrantError extends Error {}
export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

// 요청의 Firebase ID 토큰을 검증하고, 그 사용자가 해당 가구의 구성원인지 확인한다.
// 모든 google-calendar API 라우트가 공통으로 쓰는 인증 관문.
export async function requireHouseholdMember(req: Request, householdId: string): Promise<string> {
  const authHeader = req.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) throw new UnauthorizedError();

  const decoded = await getAdminAuth().verifyIdToken(idToken).catch(() => null);
  if (!decoded) throw new UnauthorizedError();

  const memberSnap = await getAdminDb().doc(`households/${householdId}/members/${decoded.uid}`).get();
  if (!memberSnap.exists) throw new ForbiddenError();

  return decoded.uid;
}

type StatePayload = {
  householdId: string;
  uid: string;
  nonce: string;
  expiresAt: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function signature(payload: string): string {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET;
  if (!secret) throw new Error("GOOGLE_OAUTH_STATE_SECRET이 설정되지 않았어요");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function signState(householdId: string, uid: string): string {
  const payload: StatePayload = {
    householdId,
    uid,
    nonce: randomBytes(12).toString("hex"),
    expiresAt: Date.now() + STATE_TTL_MS,
  };
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${signature(encoded)}`;
}

export function verifyState(raw: string): { householdId: string; uid: string } | null {
  const [encoded, sig] = raw.split(".");
  if (!encoded || !sig) return null;

  const expected = signature(encoded);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as StatePayload;
    if (payload.expiresAt < Date.now()) return null;
    return { householdId: payload.householdId, uid: payload.uid };
  } catch {
    return null;
  }
}

export function redirectUri(): string {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL이 설정되지 않았어요");
  return `${base}/api/google-calendar/callback`;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: CALENDAR_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  error?: string;
};

async function tokenRequest(body: URLSearchParams): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as TokenResponse;
  if (!res.ok || data.error) {
    if (data.error === "invalid_grant") throw new InvalidGrantError(data.error);
    throw new Error(data.error ?? "구글 토큰 요청에 실패했어요");
  }
  return data;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<{ accessToken: string; refreshToken: string | null; expiresIn: number }> {
  const data = await tokenRequest(
    new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  );
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const data = await tokenRequest(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  );
  return data.access_token;
}

export async function revokeToken(token: string): Promise<void> {
  try {
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }),
    });
  } catch {
    // 폐기는 최선 노력(best-effort)만 — 실패해도 연동 해제 자체는 계속 진행
  }
}

export async function fetchPrimaryCalendarSummary(accessToken: string): Promise<string | undefined> {
  try {
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { summary?: string };
    return data.summary;
  } catch {
    return undefined;
  }
}

type GoogleEventItem = {
  id: string;
  summary?: string;
  start?: { date?: string; dateTime?: string };
};

export async function fetchPrimaryCalendarEvents(
  accessToken: string,
  start: string,
  end: string,
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: `${start}T00:00:00+09:00`,
    timeMax: `${end}T23:59:59+09:00`,
    timeZone: "Asia/Seoul",
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error("구글 캘린더 일정을 불러오지 못했어요");

  const data = (await res.json()) as { items?: GoogleEventItem[] };
  return (data.items ?? [])
    .filter((item) => item.start?.date || item.start?.dateTime)
    .map((item) => {
      const isAllDay = Boolean(item.start?.date);
      const date = isAllDay ? item.start!.date! : item.start!.dateTime!.slice(0, 10);
      const time = isAllDay
        ? undefined
        : new Date(item.start!.dateTime!).toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Seoul",
          });
      return { id: item.id, date, title: item.summary ?? "(제목 없음)", time };
    });
}
