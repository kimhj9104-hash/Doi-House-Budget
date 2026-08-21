"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import CategoryIcon, { CATEGORY_ICON_OPTIONS } from "./CategoryIcon";
import type { PaymentMethodInput } from "@/lib/data/paymentMethods";

const COLOR_OPTIONS = [
  "#2f6fed",
  "#e0433f",
  "#f59e0b",
  "#16a34a",
  "#8b5cf6",
  "#0891b2",
  "#db2777",
  "#7c3aed",
  "#059669",
  "#ca8a04",
  "#64748b",
  "#6b7280",
];

type Props = {
  onSubmit: (input: PaymentMethodInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  initial?: { name: string; color: string; icon: string };
  title: string;
};

export default function PaymentMethodForm({ onSubmit, onDelete, initial, title }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? "credit-card");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    setError("");
    setPending(true);
    try {
      await onSubmit({ name: name.trim(), color, icon });
      router.push("/payment-methods");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했어요");
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("이 결제수단을 삭제할까요? 관련 거래는 그대로 남아있어요.")) return;
    setPending(true);
    try {
      await onDelete();
      router.push("/payment-methods");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제하지 못했어요");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4 md:px-8 md:py-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-bold text-foreground">{title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && (
          <p className="rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <CategoryIcon icon={icon} color={color} size={22} />
          <span className="text-sm text-muted-foreground">미리보기</span>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            이름
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={20}
            placeholder="예: 삼성카드, 카카오페이"
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">색상</span>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={15} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">아이콘</span>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICON_OPTIONS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIcon(i)}
                className={`flex items-center justify-center rounded-xl border p-2 ${
                  icon === i ? "border-primary bg-primary-soft" : "border-border bg-white"
                }`}
              >
                <CategoryIcon icon={i} color={color} size={16} />
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>

        {onDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-semibold text-expense transition hover:bg-expense-soft"
          >
            <Trash2 size={15} />
            삭제하기
          </button>
        )}
      </form>
    </div>
  );
}
