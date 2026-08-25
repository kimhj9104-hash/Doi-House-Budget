"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronRight, CreditCard, LogOut, Repeat, Tags, Users } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { renameHousehold, updateFiscalStartDay } from "@/lib/data/household";
import {
  disconnectGoogleCalendar,
  getGoogleCalendarConnectUrl,
} from "@/lib/data/googleCalendar";
import { useGoogleCalendarIntegration } from "@/hooks/useGoogleCalendarIntegration";
import { cardClass } from "@/lib/ui";
import InviteCodeCard from "@/components/InviteCodeCard";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, household, householdId, members } = useAuth();
  const [name, setName] = useState(household?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [fiscalStartDay, setFiscalStartDay] = useState(household?.fiscalStartDay ?? 1);
  const [savingFiscalDay, setSavingFiscalDay] = useState(false);

  const { integration: googleIntegration } = useGoogleCalendarIntegration(householdId);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const googleCalendarStatus = searchParams.get("googleCalendar");

  useEffect(() => {
    if (googleCalendarStatus === "error") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- surfaces the ?googleCalendar=error redirect from the OAuth callback route
      setGoogleError("Google 캘린더 연동에 실패했어요. 다시 시도해주세요");
    }
  }, [googleCalendarStatus]);

  async function handleGoogleConnect() {
    if (!householdId || !user) return;
    setGoogleError("");
    setGoogleBusy(true);
    try {
      const idToken = await user.getIdToken();
      const url = await getGoogleCalendarConnectUrl(idToken, householdId);
      window.location.href = url;
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "연동을 시작하지 못했어요");
      setGoogleBusy(false);
    }
  }

  async function handleGoogleDisconnect() {
    if (!householdId || !user) return;
    if (!confirm("Google 캘린더 연동을 해제할까요?")) return;
    setGoogleError("");
    setGoogleBusy(true);
    try {
      const idToken = await user.getIdToken();
      await disconnectGoogleCalendar(idToken, householdId);
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "연동 해제에 실패했어요");
    } finally {
      setGoogleBusy(false);
    }
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !name.trim()) return;
    setSaving(true);
    await renameHousehold(householdId, name.trim());
    setSaving(false);
  }

  async function handleSaveFiscalStartDay(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;
    setSavingFiscalDay(true);
    await updateFiscalStartDay(householdId, fiscalStartDay);
    setSavingFiscalDay(false);
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (!household) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5">
      <h1 className="mb-5 text-lg font-bold text-foreground">설정</h1>

      <div className={`${cardClass} mb-4 p-5`}>
        <h2 className="mb-3 text-sm font-bold text-foreground">가구 이름</h2>
        <form onSubmit={handleRename} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="flex-1 rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            저장
          </button>
        </form>
      </div>

      <div className={`${cardClass} mb-4 p-5`}>
        <h2 className="mb-1 text-sm font-bold text-foreground">회계 월 시작일</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          대시보드와 거래내역의 &quot;월&quot;이 시작되는 날짜를 설정해요. 예를 들어 25일로
          설정하면 8월 25일부터 9월 24일까지가 &quot;8월&quot;로 표시돼요.
        </p>
        <form onSubmit={handleSaveFiscalStartDay} className="flex gap-2">
          <select
            value={fiscalStartDay}
            onChange={(e) => setFiscalStartDay(Number(e.target.value))}
            className="flex-1 rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day}>
                {day === 1 ? "1일 (매월 1일 시작)" : `${day}일`}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={savingFiscalDay}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60"
          >
            저장
          </button>
        </form>
      </div>

      <div className={`${cardClass} mb-4 p-5`}>
        <h2 className="mb-1 text-sm font-bold text-foreground">초대 코드</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          배우자에게 이 코드를 공유하면 같은 가계부에 함께 참여할 수 있어요.
        </p>
        <InviteCodeCard code={household.inviteCode} />
      </div>

      <div className={`${cardClass} mb-4 p-5`}>
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <CalendarDays size={15} />
          Google 캘린더 연동
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          연동하면 거래내역 캘린더에서 Google 캘린더 일정도 함께 볼 수 있어요.
        </p>
        {googleError && (
          <p className="mb-3 rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
            {googleError}
          </p>
        )}
        {googleIntegration?.connected ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                연결됨{googleIntegration.calendarSummary ? ` · ${googleIntegration.calendarSummary}` : ""}
              </p>
              {googleIntegration.connectedAt && (
                <p className="text-xs text-subtle-foreground">
                  {new Date(googleIntegration.connectedAt).toLocaleDateString("ko-KR")} 연결
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleGoogleDisconnect}
              disabled={googleBusy}
              className="shrink-0 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-expense transition hover:bg-expense-soft disabled:opacity-60"
            >
              연결 해제
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleGoogleConnect}
            disabled={googleBusy}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
          >
            {googleBusy ? "이동 중..." : "Google 캘린더 연결하기"}
          </button>
        )}
      </div>

      <Link
        href="/recurring"
        className={`${cardClass} mb-4 flex items-center gap-3 p-5 transition hover:bg-surface-hover`}
      >
        <Repeat size={17} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">고정 수입/지출 관리</p>
          <p className="text-xs text-muted-foreground">
            매달 반복되는 월급, 월세, 구독료를 등록해두면 자동으로 추가돼요
          </p>
        </div>
        <ChevronRight size={16} className="text-subtle-foreground" />
      </Link>

      <Link
        href="/payment-methods"
        className={`${cardClass} mb-4 flex items-center gap-3 p-5 transition hover:bg-surface-hover`}
      >
        <CreditCard size={17} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">결제수단 관리</p>
          <p className="text-xs text-muted-foreground">
            카드/현금/계좌이체 등 거래 등록 시 고를 결제수단을 관리해요
          </p>
        </div>
        <ChevronRight size={16} className="text-subtle-foreground" />
      </Link>

      <Link
        href="/categories"
        className={`${cardClass} mb-4 flex items-center gap-3 p-5 transition hover:bg-surface-hover`}
      >
        <Tags size={17} className="text-primary" />
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">카테고리 관리</p>
          <p className="text-xs text-muted-foreground">
            거래 등록 시 고를 지출/수입 카테고리를 관리해요
          </p>
        </div>
        <ChevronRight size={16} className="text-subtle-foreground" />
      </Link>

      <div className={`${cardClass} mb-4 p-5`}>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Users size={15} />
          구성원 ({members.length}명)
        </h2>
        <ul className="flex flex-col gap-3">
          {members.map((m) => (
            <li key={m.uid} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {(m.displayName || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {m.displayName || "이름 없음"}
                  {m.uid === user?.uid && (
                    <span className="ml-1.5 text-xs font-normal text-subtle-foreground">
                      (나)
                    </span>
                  )}
                </p>
                <p className="text-xs text-subtle-foreground">
                  {new Date(m.joinedAt).toLocaleDateString("ko-KR")} 참여
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSignOut}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-expense transition hover:bg-expense-soft"
      >
        <LogOut size={15} />
        로그아웃
      </button>
    </div>
  );
}
