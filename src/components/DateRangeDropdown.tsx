"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { formatDateLabel, formatDateShort } from "@/lib/format";

type Props = {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
};

const PANEL_WIDTH = 256; // w-64

export default function DateRangeDropdown({ startDate, endDate, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const active = Boolean(startDate || endDate);
  const buttonLabel =
    startDate && endDate
      ? startDate === endDate
        ? formatDateLabel(startDate)
        : `${formatDateShort(startDate)} ~ ${formatDateShort(endDate)}`
      : "기간 설정";

  function applyAndClose() {
    onChange(draftStart, draftEnd);
    setOpen(false);
  }

  function clearAndClose() {
    setDraftStart("");
    setDraftEnd("");
    onChange("", "");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) {
              setDraftStart(startDate);
              setDraftEnd(endDate);
              if (ref.current) {
                const rect = ref.current.getBoundingClientRect();
                setAlignRight(rect.left + PANEL_WIDTH > window.innerWidth - 8);
              }
            }
            return next;
          });
        }}
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          active
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-surface text-muted-foreground"
        }`}
      >
        <CalendarRange size={13} />
        {buttonLabel}
        <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+6px)] z-20 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">시작일</span>
              <input
                type="date"
                value={draftStart}
                max={draftEnd || undefined}
                onChange={(e) => setDraftStart(e.target.value)}
                className="rounded-lg border border-border-strong bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">종료일</span>
              <input
                type="date"
                value={draftEnd}
                min={draftStart || undefined}
                onChange={(e) => setDraftEnd(e.target.value)}
                className="rounded-lg border border-border-strong bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={applyAndClose}
              disabled={!draftStart || !draftEnd}
              className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              적용
            </button>
            <button
              type="button"
              onClick={clearAndClose}
              className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-surface-hover"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
