"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Users, Wallet2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createHousehold, joinHouseholdByCode } from "@/lib/data/household";

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, user, householdId } = useAuth();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (householdId) {
      router.replace("/dashboard");
    }
  }, [ready, user, householdId, router]);

  async function resolveDisplayName(): Promise<string> {
    // 회원가입 화면에서 입력한 이름은 sessionStorage에 남겨뒀다가 여기서 우선 사용한다.
    // auth.currentUser.displayName은 방금 가입한 직후에는 아직 반영 전일 수 있어 신뢰할 수 없다.
    const pending = sessionStorage.getItem("pendingDisplayName");
    if (pending) {
      sessionStorage.removeItem("pendingDisplayName");
      return pending;
    }
    await auth.currentUser?.reload();
    return auth.currentUser?.displayName || user?.email || "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const displayName = await resolveDisplayName();
      await createHousehold(user.uid, displayName, name.trim());
      // 여기서 직접 이동하지 않고, householdId가 실시간 구독으로 반영되면
      // 위 useEffect가 자동으로 /dashboard로 보내준다 (미리 이동하면 아직
      // householdId가 갱신되기 전이라 다시 /onboarding으로 튕기는 문제가 있었음)
    } catch (err) {
      setError(err instanceof Error ? err.message : "가구를 만들지 못했어요");
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      const displayName = await resolveDisplayName();
      await joinHouseholdByCode(user.uid, displayName, code.trim());
      // createHousehold와 동일하게, 위 useEffect가 householdId 반영 후 이동시킨다
    } catch (err) {
      setError(err instanceof Error ? err.message : "가구에 참여하지 못했어요");
      setLoading(false);
    }
  }

  if (!ready || !user || householdId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet2 size={28} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            가구를 설정해주세요
          </h1>
          <p className="text-center text-sm text-muted-foreground">
            새 가구를 만들거나, 배우자의 초대 코드로
            <br />
            함께 가계부를 시작하세요.
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-2 shadow-sm">
          <div className="mb-4 flex gap-1 rounded-xl bg-background p-1">
            <TabButton
              active={tab === "create"}
              onClick={() => {
                setTab("create");
                setError("");
              }}
              icon={<Home size={15} />}
              label="가구 만들기"
            />
            <TabButton
              active={tab === "join"}
              onClick={() => {
                setTab("join");
                setError("");
              }}
              icon={<Users size={15} />}
              label="초대 코드로 참여"
            />
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
              {error}
            </p>
          )}

          {tab === "create" ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-3 p-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  가구 이름
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 도이네"
                  required
                  maxLength={30}
                  className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "만드는 중..." : "가구 만들고 시작하기"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-3 p-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  초대 코드
                </span>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="예: A3F9K2"
                  required
                  maxLength={12}
                  className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm uppercase tracking-widest text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
              >
                {loading ? "참여하는 중..." : "가구 참여하기"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition ${
        active
          ? "bg-surface text-primary shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
