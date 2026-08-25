import { NextResponse } from "next/server";
import {
  ForbiddenError,
  UnauthorizedError,
  buildAuthorizeUrl,
  requireHouseholdMember,
  signState,
} from "@/lib/googleCalendarServer";

export async function GET(req: Request) {
  const householdId = new URL(req.url).searchParams.get("householdId");
  if (!householdId) {
    return NextResponse.json({ error: "householdId가 필요해요" }, { status: 400 });
  }

  try {
    const uid = await requireHouseholdMember(req, householdId);
    const url = buildAuthorizeUrl(signState(householdId, uid));
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "가구 구성원만 연동할 수 있어요" }, { status: 403 });
    }
    throw err;
  }
}
