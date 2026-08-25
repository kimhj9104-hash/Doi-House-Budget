import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  exchangeCodeForTokens,
  fetchPrimaryCalendarSummary,
  verifyState,
} from "@/lib/googleCalendarServer";

function settingsRedirect(req: Request, status: "connected" | "error") {
  return NextResponse.redirect(new URL(`/settings?googleCalendar=${status}`, req.url));
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const code = params.get("code");
  const rawState = params.get("state");

  if (params.get("error") || !code || !rawState) {
    return settingsRedirect(req, "error");
  }

  const state = verifyState(rawState);
  if (!state) return settingsRedirect(req, "error");

  const memberSnap = await getAdminDb()
    .doc(`households/${state.householdId}/members/${state.uid}`)
    .get();
  if (!memberSnap.exists) return settingsRedirect(req, "error");

  const tokens = await exchangeCodeForTokens(code).catch(() => null);
  if (!tokens || !tokens.refreshToken) return settingsRedirect(req, "error");

  const calendarSummary = await fetchPrimaryCalendarSummary(tokens.accessToken);
  const connectedAt = Date.now();

  const db = getAdminDb();
  await Promise.all([
    db.doc(`googleCalendarTokens/${state.householdId}`).set({
      refreshToken: tokens.refreshToken,
      connectedByUid: state.uid,
      connectedAt,
    }),
    db.doc(`households/${state.householdId}/integrations/googleCalendar`).set({
      connected: true,
      connectedByUid: state.uid,
      connectedAt,
      calendarSummary: calendarSummary ?? null,
    }),
  ]);

  return settingsRedirect(req, "connected");
}
