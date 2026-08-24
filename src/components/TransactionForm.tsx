"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import type { Category, PaymentMethod, TransactionType } from "@/lib/types";
import type { TransactionInput } from "@/lib/data/transactions";

type Props = {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  initial?: {
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    paymentMethodId: string | null;
    occurredOn: string;
    memo: string;
    note: string;
  };
  title: string;
};

export default function TransactionForm({
  categories,
  paymentMethods,
  onSubmit,
  onDelete,
  initial,
  title,
}: Props) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [paymentMethodId, setPaymentMethodId] = useState(initial?.paymentMethodId ?? "");
  const [amountDisplay, setAmountDisplay] = useState(
    initial?.amount ? String(initial.amount) : "",
  );
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function returnToList() {
    // 수정/삭제는 리스트에서 진입한 흐름이므로 back()으로 원래 URL(스크롤 위치 포함)을 유지한다.
    // 새 거래 추가는 BottomNav 등 여러 화면에서 진입할 수 있어 목록으로 고정 이동한다.
    if (onDelete) {
      router.back();
    } else {
      router.push("/transactions");
    }
  }

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setAmountDisplay(digits);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(amountDisplay);
    if (!amount || amount <= 0) {
      setError("금액을 올바르게 입력해주세요");
      return;
    }
    if (!occurredOn) {
      setError("날짜를 선택해주세요");
      return;
    }
    setError("");
    setPending(true);
    try {
      await onSubmit({
        type,
        amount,
        categoryId: categoryId || null,
        paymentMethodId: paymentMethodId || null,
        occurredOn,
        memo: memo.trim(),
        note: note.trim(),
      });
      returnToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했어요");
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("이 거래를 삭제할까요?")) return;
    setPending(true);
    try {
      await onDelete();
      returnToList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제하지 못했어요");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
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

        <div className="flex gap-1 rounded-xl bg-surface p-1 border border-border">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategoryId("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              type === "expense"
                ? "bg-expense-soft text-expense"
                : "text-muted-foreground"
            }`}
          >
            지출
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategoryId("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition ${
              type === "income"
                ? "bg-income-soft text-income"
                : "text-muted-foreground"
            }`}
          >
            수입
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            금액
          </span>
          <div className="flex items-center rounded-xl border border-border-strong bg-white px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft">
            <input
              inputMode="numeric"
              placeholder="0"
              value={amountDisplay ? Number(amountDisplay).toLocaleString("ko-KR") : ""}
              onChange={handleAmountChange}
              required
              className="w-full bg-transparent text-lg font-bold text-foreground outline-none"
            />
            <span className="ml-2 shrink-0 text-sm font-semibold text-muted-foreground">
              원
            </span>
          </div>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            카테고리
          </span>
          <div className="grid grid-cols-4 gap-2.5">
            {filteredCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition ${
                  categoryId === c.id
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-white"
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={16} />
                <span className="w-full truncate text-center text-[11px] font-medium text-foreground">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {paymentMethods.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              결제수단 (선택)
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethodId(paymentMethodId === m.id ? "" : m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition ${
                    paymentMethodId === m.id
                      ? "border-primary bg-primary-soft"
                      : "border-border bg-white"
                  }`}
                >
                  <CategoryIcon icon={m.icon} color={m.color} size={16} />
                  <span className="w-full truncate text-center text-[11px] font-medium text-foreground">
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            날짜
          </span>
          <input
            type="date"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            required
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            메모 (선택)
          </span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 이마트 장보기"
            maxLength={80}
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            특이사항 (선택)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 다음 달에 환불 예정, 반반 나눠 낸 금액"
            maxLength={200}
            rows={2}
            className="resize-none rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

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
