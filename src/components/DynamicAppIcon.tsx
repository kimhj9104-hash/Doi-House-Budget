"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// 가구 문서에 등록된 앱 아이콘(data URL)이 있으면 브라우저 탭 파비콘과
// apple-touch-icon을 그 이미지로 교체한다. 홈 화면(PWA manifest) 아이콘은
// 정적 파일이라 여기서 바꾸지 못하고, 재배포로만 반영된다.
export default function DynamicAppIcon() {
  const { household } = useAuth();
  const iconUrl = household?.appIconDataUrl;

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

  return null;
}
