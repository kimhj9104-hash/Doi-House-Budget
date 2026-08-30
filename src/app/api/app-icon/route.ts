import { type NextRequest, NextResponse } from "next/server";
import { getAppIconByToken } from "@/lib/appIconServer";

// 매니페스트 icons[].src 가 가리키는 실제 이미지 바이트.
// 크롬이 앱 JS 없이 직접 받아가므로 인증 헤더가 없다 → 추측 불가능한 t(토큰)로만 식별한다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  let icon = null;
  try {
    icon = await getAppIconByToken(token);
  } catch {
    icon = null;
  }

  if (!icon) {
    // 토큰이 유효하지 않으면 기본 아이콘으로 넘긴다 (매니페스트가 항상 아이콘을 얻도록).
    return NextResponse.redirect(new URL("/icons/icon.svg", req.url));
  }

  return new NextResponse(new Uint8Array(icon.buffer), {
    headers: {
      "Content-Type": icon.mime,
      // src 에 &v=<updatedAt> 가 붙어 있어 오래 캐시해도 안전하다.
      "Cache-Control": "public, max-age=86400",
    },
  });
}
