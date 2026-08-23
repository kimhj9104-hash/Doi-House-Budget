"use client";

import { useEffect, useRef } from "react";

/**
 * 뒤로가기로 돌아왔을 때 스크롤 위치를 복원한다.
 * 거래내역처럼 데이터가 비동기로 로드되는 페이지는 Next.js의 기본 스크롤 복원이
 * 콘텐츠가 채워지기 전(로딩 중)에 실행되어 실패하므로, 데이터 로드가 끝난 뒤(ready)
 * sessionStorage에 저장해둔 위치로 직접 스크롤한다.
 */
export function useScrollRestoration(key: string, ready: boolean) {
  const restoredForKey = useRef<string | null>(null);

  useEffect(() => {
    function handleScroll() {
      sessionStorage.setItem(key, String(window.scrollY));
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [key]);

  useEffect(() => {
    if (!ready || restoredForKey.current === key) return;
    restoredForKey.current = key;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      requestAnimationFrame(() => window.scrollTo(0, Number(saved)));
    }
  }, [key, ready]);
}
