// 웹 앱 매니페스트의 단일 출처.
// - 로그인 전/JS 실행 전에는 정적 파일 public/manifest.webmanifest 가 사용된다(이 값과 동일하게 유지할 것).
// - 로그인 후에는 클라이언트가 <link rel="manifest"> 를 /api/manifest?t=<token> 로 바꾸고,
//   그 라우트가 아래 base 에 가구별 icons 만 갈아끼워 응답한다.

export const DEFAULT_ICONS = [
  { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
  { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
];

// icons 를 제외한 모든 필드. 동적 매니페스트도 이 필드들을 그대로 써야
// 크롬이 "같은 앱"으로 인식한다(start_url, id, scope, name 등이 달라지면 별도 앱 취급).
export const MANIFEST_BASE = {
  name: "도이네 가게부",
  short_name: "가게부",
  description: "부부가 함께 쓰는 가계부",
  start_url: "/dashboard",
  display: "standalone",
  background_color: "#f4f5f7",
  theme_color: "#161d34",
  orientation: "portrait",
  lang: "ko",
} as const;
