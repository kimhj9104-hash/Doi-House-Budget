"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import type { Category, TransactionType } from "@/lib/types";
import type { RecurringInput } from "@/lib/data/recurring";

type Props = {
  categories: Category[];
  onSubmit: (input: RecurringInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  initial?: {
    name: string;
    type: TransactionType;
    amount: number;
    categoryId: string | null;
    memo: string;
    dayOfMonth: number;
    active: boolean;
  };
  title: string;
};

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function RecurringForm({
  categories,
  onSubmit,
  onDelete,
  initial,
  title,
}: Props) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [amountDisplay, setAmountDisplay] = useState(
    initial?.amount ? String(initial.amount) : "",
  );
  const [dayOfMonth, setDayOfMonth] = useState(initial?.dayOfMonth ?? 1);
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

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
    if (!name.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    if (!amount || amount <= 0) {
      setError("금액을 올바르게 입력해주세요");
      return;
    }
    setError("");
    setPending(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        amount,
        categoryId: categoryId || null,
        memo: memo.trim(),
        dayOfMonth,
        active,
      });
      router.push("/recurring");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장하지 못했어요");
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("이 고정 항목을 삭제할까요? 이미 등록된 거래 내역은 남아있어요.")) return;
    setPending(true);
    try {
      await onDelete();
      router.push("/recurring");
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
            고정 지출
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
            고정 수입
          </button>
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
            maxLength={30}
            placeholder="예: 월급, 넷플릭스 구독료, 월세"
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

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

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            매월 며칠
          </span>
          <select
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Number(e.target.value))}
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                매월 {d}일
              </option>
            ))}
          </select>
          <span className="text-xs text-subtle-foreground">
            선택한 날짜가 없는 달(예: 2월 31일)에는 그 달의 마지막 날로 등록돼요.
          </span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground">
            메모 (선택)
          </span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="비워두면 이름이 메모로 사용돼요"
            maxLength={80}
            className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
        </label>

        <label className="flex items-center justify-between rounded-xl border border-border-strong bg-white px-3.5 py-3">
          <span className="text-sm font-medium text-foreground">
            자동 등록 사용
          </span>
          <button
            type="button"
            onClick={() => setActive(!active)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              active ? "bg-primary" : "bg-border-strong"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                active ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
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
