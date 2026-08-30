import { type NextRequest } from "next/server";
import { DEFAULT_ICONS, MANIFEST_BASE } from "@/lib/appManifest";
import { getAppIconByToken } from "@/lib/appIconServer";

// 크롬(안드로이드)이 홈 화면 아이콘을 만들 때 읽는 매니페스트.
// 로그인한 클라이언트가 <link rel="manifest"> 를 /api/manifest?t=<token> 으로 바꿔주면
// 해당 가구의 아이콘으로 icons 를 갈아끼워 응답한다. 토큰이 없거나 아이콘이 없으면 기본값.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t");

  let icons: Record<string, string>[] = DEFAULT_ICONS;
  try {
    const icon = await getAppIconByToken(token);
    if (icon) {
      // v 파라미터로 아이콘 변경 시 크롬 캐시를 무효화한다.
      const src = `/api/app-icon?t=${encodeURIComponent(token as string)}&v=${icon.updatedAt}`;
      // 사용자가 올린 사진은 안전영역 여백이 없어 maskable 로 주면 안드로이드가
      // 원형으로 잘라 얼굴이 잘릴 수 있다. "any" 만 제공해 이미지 전체가 보이게 한다.
      icons = [{ src, sizes: "512x512", type: icon.mime, purpose: "any" }];
    }
  } catch {
    // 조회 실패 시엔 기본 아이콘으로 응답 (매니페스트 자체는 항상 유효해야 함)
  }

  return Response.json(
    { ...MANIFEST_BASE, icons },
    {
      headers: {
        "Content-Type": "application/manifest+json",
        "Cache-Control": "no-cache",
      },
    },
  );
}
