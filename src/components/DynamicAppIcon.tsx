"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// 가구 문서에 등록된 앱 아이콘이 있으면:
//  - 브라우저 탭 파비콘 / apple-touch-icon(아이폰 홈 화면) 을 그 이미지(data URL)로 교체
//  - <link rel="manifest"> 를 가구별 동적 매니페스트로 교체 → 안드로이드 홈 화면 아이콘 반영
// (안드로이드 크롬은 매니페스트의 icons 만 보고, apple-touch-icon 이나 이 컴포넌트 코드는 보지 않는다.
//  그래서 매니페스트 자체를 가구별로 갈아끼워야 한다. 반영에는 PWA 재설치 + 크롬 캐시 갱신이 필요.)
export default function DynamicAppIcon() {
  const { household } = useAuth();
  const iconUrl = household?.appIconDataUrl;
  const iconToken = household?.appIconToken;

  useEffect(() => {
    if (!iconUrl) return;
    const created: HTMLLinkElement[] = [];
    const restored: { el: HTMLLinkElement; href: string }[] = [];

    for (const rel of ["icon", "apple-touch-icon"]) {
      let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (link) {
        restored.push({ el: link, href: link.href });
      } else {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
        created.push(link);
      }
      link.href = iconUrl;
    }

    return () => {
      for (const { el, href } of restored) el.href = href;
      for (const el of created) el.remove();
    };
  }, [iconUrl]);

  useEffect(() => {
    if (!iconToken) return;
    const link = document.head.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    const original = link.getAttribute("href");
    link.setAttribute("href", `/api/manifest?t=${encodeURIComponent(iconToken)}`);

    return () => {
      if (original !== null) link.setAttribute("href", original);
    };
  }, [iconToken]);

  return null;
}
