import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  ForbiddenError,
  InvalidGrantError,
  UnauthorizedError,
  fetchPrimaryCalendarEvents,
  refreshAccessToken,
  requireHouseholdMember,
} from "@/lib/googleCalendarServer";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const householdId = params.get("householdId");
  const start = params.get("start");
  const end = params.get("end");

  if (!householdId || !start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
    return NextResponse.json({ error: "householdId, start, end가 필요해요" }, { status: 400 });
  }

  try {
    await requireHouseholdMember(req, householdId);

    const db = getAdminDb();
    const tokenRef = db.doc(`googleCalendarTokens/${householdId}`);
    const tokenSnap = await tokenRef.get();
    if (!tokenSnap.exists) {
      return NextResponse.json({ connected: false, events: [] });
    }

    const { refreshToken } = tokenSnap.data() as { refreshToken: string };

    try {
      const accessToken = await refreshAccessToken(refreshToken);
      const events = await fetchPrimaryCalendarEvents(accessToken, start, end);
      return NextResponse.json({ connected: true, events });
    } catch (err) {
      if (err instanceof InvalidGrantError) {
        await Promise.all([
          tokenRef.delete(),
          db
            .doc(`households/${householdId}/integrations/googleCalendar`)
            .set({ connected: false }, { merge: true }),
        ]);
        return NextResponse.json({ connected: false, events: [], revoked: true });
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "가구 구성원만 볼 수 있어요" }, { status: 403 });
    }
    throw err;
  }
}
