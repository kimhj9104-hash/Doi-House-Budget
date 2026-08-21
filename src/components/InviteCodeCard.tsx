"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function InviteCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 권한이 없으면 무시
    }
  }

  return (
    <button
      onClick={copy}
      className="flex w-full items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary-soft px-4 py-3.5 transition hover:bg-primary-soft/70"
    >
      <span className="font-mono text-lg font-bold tracking-[0.2em] text-primary">
        {code}
      </span>
      <span className="flex items-center gap-1 text-xs font-semibold text-primary">
        {copied ? (
          <>
            <Check size={14} /> 복사됨
          </>
        ) : (
          <>
            <Copy size={14} /> 복사
          </>
        )}
      </span>
    </button>
  );
}
