import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  ForbiddenError,
  UnauthorizedError,
  requireHouseholdMember,
  revokeToken,
} from "@/lib/googleCalendarServer";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { householdId?: string } | null;
  const householdId = body?.householdId;
  if (!householdId) {
    return NextResponse.json({ error: "householdId가 필요해요" }, { status: 400 });
  }

  try {
    await requireHouseholdMember(req, householdId);

    const db = getAdminDb();
    const tokenRef = db.doc(`googleCalendarTokens/${householdId}`);
    const tokenSnap = await tokenRef.get();
    if (tokenSnap.exists) {
      const { refreshToken } = tokenSnap.data() as { refreshToken: string };
      await revokeToken(refreshToken);
      await tokenRef.delete();
    }

    await db
      .doc(`households/${householdId}/integrations/googleCalendar`)
      .set({ connected: false }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "가구 구성원만 연동을 해제할 수 있어요" }, { status: 403 });
    }
    throw err;
  }
}
