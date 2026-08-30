import { getAdminDb } from "@/lib/firebaseAdmin";

export type StoredAppIcon = {
  mime: string;
  updatedAt: number;
  buffer: Buffer;
};

// appIconToken 으로 가구를 찾아 저장된 아이콘 data URL 을 이미지 바이트로 파싱한다.
// 토큰이 없거나(빈 문자열) 매칭되는 가구·아이콘이 없으면 null.
export async function getAppIconByToken(token: string | null): Promise<StoredAppIcon | null> {
  if (!token || !/^[a-f0-9]{16,64}$/i.test(token)) return null;

  const snap = await getAdminDb()
    .collection("households")
    .where("appIconToken", "==", token)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const data = snap.docs[0].data() as {
    appIconDataUrl?: string;
    appIconUpdatedAt?: number;
  };
  const dataUrl = data.appIconDataUrl;
  if (!dataUrl) return null;

  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) return null;

  return {
    mime: match[1].toLowerCase(),
    updatedAt: data.appIconUpdatedAt ?? 0,
    buffer: Buffer.from(match[2], "base64"),
  };
}
