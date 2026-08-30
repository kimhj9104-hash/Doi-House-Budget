// 금액 입력칸에서 "50000-3000", "12000+4500*2" 같은 계산식을 직접 입력할 수 있도록
// eval 없이 안전하게 사칙연산을 계산한다. 지원: + - * / ( ), 곱셈 기호 x·× , 나눗셈 기호 ÷

const OPERATOR_RE = /[+\-*/x×÷()]/;

// 값이 단순 숫자가 아니라 계산식인지(연산자·괄호 포함) 판별한다.
export function hasCalcOperator(raw: string): boolean {
  return OPERATOR_RE.test(raw.replace(/^\s*-/, "")); // 맨 앞 음수 부호만 있는 건 계산식으로 보지 않음
}

// 계산식을 평가한다. 유효하지 않으면 null.
export function evaluateExpression(raw: string): number | null {
  const s = raw
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/[xX×]/g, "*")
    .replace(/÷/g, "/");
  if (!s || !/^[0-9.+\-*/()]+$/.test(s)) return null;

  let i = 0;
  const peek = () => s[i];

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    if (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const v = parseFactor();
      if (v === null) return null;
      return op === "-" ? -v : v;
    }
    if (peek() === "(") {
      i++;
      const v = parseExpr();
      if (v === null || peek() !== ")") return null;
      i++;
      return v;
    }
    const start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    if (i === start) return null;
    const num = Number(s.slice(start, i));
    return Number.isFinite(num) ? num : null;
  }

  const result = parseExpr();
  if (result === null || i !== s.length || !Number.isFinite(result)) return null;
  return result;
}

// 입력 원문(단순 숫자 또는 계산식)을 최종 금액(정수)으로 변환한다. 유효하지 않으면 null.
export function resolveAmount(raw: string): number | null {
  if (!raw) return null;
  if (hasCalcOperator(raw)) {
    const v = evaluateExpression(raw);
    return v === null ? null : Math.round(v);
  }
  const digits = raw.replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}
