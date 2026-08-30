"use client";

import { formatWon } from "@/lib/format";
import { evaluateExpression, hasCalcOperator, resolveAmount } from "@/lib/calc";

type Props = {
  // 원문 상태: 단순 숫자("12000") 또는 계산식("12000-3000")을 그대로 보관한다.
  value: string;
  onChange: (next: string) => void;
};

const OPS = [
  { label: "＋", sym: "+" },
  { label: "－", sym: "-" },
  { label: "×", sym: "*" },
  { label: "÷", sym: "/" },
];

// 허용 문자: 숫자, 소수점, 콤마, 공백, 사칙연산 기호, 괄호
const ALLOWED_RE = /[^0-9.,+\-*/xX×÷() ]/g;

export default function AmountField({ value, onChange }: Props) {
  const isExpr = hasCalcOperator(value);
  const preview = isExpr ? evaluateExpression(value) : null;

  const displayValue = isExpr
    ? value
    : value
      ? Number(value.replace(/[^0-9]/g, "")).toLocaleString("ko-KR")
      : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(ALLOWED_RE, "");
    onChange(hasCalcOperator(cleaned) ? cleaned : cleaned.replace(/[^0-9]/g, ""));
  }

  function handleBlur() {
    // 계산식이면 확정된 숫자로 정리한다(잘못된 식은 그대로 두어 오류를 보여줌).
    if (!isExpr) return;
    const n = resolveAmount(value);
    if (n !== null) onChange(String(n));
  }

  function append(sym: string) {
    onChange(value + sym);
  }

  function backspace() {
    onChange(value.slice(0, -1));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center rounded-xl border border-border-strong bg-white px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-soft">
        <input
          inputMode={isExpr ? "text" : "numeric"}
          placeholder="0"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          className="w-full bg-transparent text-lg font-bold text-foreground outline-none"
        />
        <span className="ml-2 shrink-0 text-sm font-semibold text-muted-foreground">
          원
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {OPS.map((op) => (
          <button
            key={op.sym}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => append(op.sym)}
            className="flex h-8 w-9 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-muted-foreground transition hover:bg-surface-hover"
          >
            {op.label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={backspace}
          className="flex h-8 w-9 items-center justify-center rounded-lg border border-border bg-surface text-sm font-bold text-muted-foreground transition hover:bg-surface-hover"
        >
          ⌫
        </button>
        {isExpr && (
          <span
            className={`ml-1 text-xs font-semibold ${
              preview !== null ? "text-primary" : "text-expense"
            }`}
          >
            {preview !== null
              ? `= ${formatWon(Math.round(preview))}`
              : "계산식을 확인해주세요"}
          </span>
        )}
      </div>
    </div>
  );
}
