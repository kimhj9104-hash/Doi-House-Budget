export function formatWon(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(Math.round(amount)) + "원";
}

export function formatCompactWon(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return `${man % 1 === 0 ? man : man.toFixed(1)}만원`;
  }
  return formatWon(amount);
}

export function formatSignedWon(amount: number, type: "income" | "expense"): string {
  const sign = type === "income" ? "+" : "-";
  return `${sign}${formatWon(Math.abs(amount))}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function toISODate(ts: number): string {
  const d = new Date(ts);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10);
}

export function todayISODate(): string {
  return toISODate(Date.now());
}

// Date 객체를 로컬 타임존 기준 YYYY-MM-DD로 변환 (UTC 왕복 없이)
export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const MAX_FISCAL_START_DAY = 28;

function clampFiscalStartDay(fiscalStartDay: number): number {
  return Math.min(Math.max(Math.round(fiscalStartDay) || 1, 1), MAX_FISCAL_START_DAY);
}

// fiscalStartDay가 1이면 달력상의 월(1일~말일)과 동일하다.
// 1보다 크면 전달 그 날짜에 시작해서 해당 월 같은 날짜 전날에 끝나는 기간을 monthStr(종료월 기준)으로 표현한다.
// 예: monthStr="2026-08", fiscalStartDay=25 -> 2026-07-25 ~ 2026-08-24
export function monthRange(
  monthStr: string,
  fiscalStartDay = 1,
): { start: string; end: string } {
  const [y, m] = monthStr.split("-").map(Number);
  const startDay = clampFiscalStartDay(fiscalStartDay);
  if (startDay === 1) {
    const start = `${monthStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${monthStr}-${String(lastDay).padStart(2, "0")}`;
    return { start, end };
  }
  const start = dateToISO(new Date(y, m - 2, startDay));
  const end = dateToISO(new Date(y, m - 1, startDay - 1));
  return { start, end };
}

export function currentMonthStr(fiscalStartDay = 1): string {
  const startDay = clampFiscalStartDay(fiscalStartDay);
  const today = new Date();
  let y = today.getFullYear();
  let m = today.getMonth() + 1;
  // 종료월 기준이므로, 시작일 이후면 다음 달 이름의 회계월에 속한다.
  if (startDay > 1 && today.getDate() >= startDay) {
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function shiftMonth(monthStr: string, delta: number): string {
  const [y, m] = monthStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
