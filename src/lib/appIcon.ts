// 설정 화면에서 올린 이미지를 앱 아이콘용 정사각형 data URL로 변환한다.
// - 가운데 기준으로 정사각형 크롭 후 512x512로 리사이즈
// - PNG가 Firestore 문서에 넣기엔 너무 크면 JPEG로 단계적으로 압축
// 홈 화면(PWA) 아이콘용 정적 파일은 이 data URL을 받아 별도로 커밋한다.

export const APP_ICON_SIZE = 512;
// Firestore 문서 상한(1MB)에서 다른 필드 여유를 두고 잡은 data URL 최대 크기
const MAX_ICON_DATA_URL_BYTES = 900_000;

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // 일부 브라우저는 imageOrientation 옵션을 지원하지 않음
    return await createImageBitmap(file);
  }
}

export async function fileToAppIconDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일을 선택해주세요");
  }

  const bitmap = await loadBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = APP_ICON_SIZE;
  canvas.height = APP_ICON_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 처리할 수 없어요");

  const crop = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - crop) / 2;
  const sy = (bitmap.height - crop) / 2;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, crop, crop, 0, 0, APP_ICON_SIZE, APP_ICON_SIZE);
  bitmap.close?.();

  let dataUrl = canvas.toDataURL("image/png");
  if (dataUrlBytes(dataUrl) > MAX_ICON_DATA_URL_BYTES) {
    for (const quality of [0.92, 0.85, 0.75, 0.6]) {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlBytes(dataUrl) <= MAX_ICON_DATA_URL_BYTES) break;
    }
  }
  if (dataUrlBytes(dataUrl) > MAX_ICON_DATA_URL_BYTES) {
    throw new Error("이미지 용량이 너무 커요. 더 단순한 이미지를 사용해주세요");
  }
  return dataUrl;
}
