"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { renameHousehold } from "@/lib/data/household";
import { cardClass } from "@/lib/ui";
import InviteCodeCard from "@/components/InviteCodeCard";

export default function SettingsPage() {
  const router = useRouter();
  const { user, household, householdId, members } = useAuth();
  const [name, setName] = useState(household?.name ?? "");
  const [saving, setSaving] = useState(false);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !name.trim()) return;
    setSaving(true);
    await renameHousehold(householdId, name.trim());
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  if (!household) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-5 md:px-8 md:py-8">
      <h1 className="mb-5 text-lg font-bold text-foreground md:text-xl">설정</h1>

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
        <h2 className="mb-1 text-sm font-bold text-foreground">초대 코드</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          배우자에게 이 코드를 공유하면 같은 가계부에 함께 참여할 수 있어요.
        </p>
        <InviteCodeCard code={household.inviteCode} />
      </div>

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
