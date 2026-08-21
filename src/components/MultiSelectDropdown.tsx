"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
};

export default function MultiSelectDropdown({ label, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
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

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const buttonLabel =
    selected.length === 0
      ? `${label} 전체`
      : selected.length === options.length
        ? `${label} 전체`
        : `${label} ${selected.length}개`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          selected.length > 0
            ? "border-primary bg-primary-soft text-primary"
            : "border-border bg-surface text-muted-foreground"
        }`}
      >
        {buttonLabel}
        <ChevronDown size={13} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-20 max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => onChange([])}
            className="mb-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary transition hover:bg-surface-hover"
          >
            전체 보기
            {selected.length === 0 && <Check size={14} />}
          </button>
          <div className="my-1 border-t border-border" />
          {options.map((opt) => {
            const checked = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-foreground transition hover:bg-surface-hover"
              >
                <span className="truncate">{opt.label}</span>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-border-strong"
                  }`}
                >
                  {checked && <Check size={11} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
