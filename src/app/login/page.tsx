"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet2 } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

function translateError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "이메일 또는 비밀번호가 올바르지 않아요";
    case "auth/email-already-in-use":
      return "이미 가입된 이메일이에요. 로그인 해주세요";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 해요";
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않아요";
    default:
      return "문제가 발생했어요. 잠시 후 다시 시도해주세요";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
      }
      router.push("/dashboard");
    } catch (err) {
      const code = err instanceof Error && "code" in err ? String((err as { code: string }).code) : "";
      setError(translateError(code));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet2 size={28} strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-bold text-foreground">두이네 가계부</h1>
          <p className="text-sm text-muted-foreground">
            부부가 함께 쓰는 우리집 가계부
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface p-2 shadow-sm">
          <div className="mb-3 flex gap-1 rounded-xl bg-background p-1">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "login"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setError("");
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                tab === "signup"
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              회원가입
            </button>
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-expense-soft px-3 py-2 text-xs font-medium text-expense">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-2">
            {tab === "signup" && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  이름 (배우자에게 보여질 이름)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={20}
                  placeholder="예: 민수"
                  className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                이메일
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                비밀번호
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6자 이상"
                className="rounded-xl border border-border-strong bg-white px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading
                ? "처리 중..."
                : tab === "login"
                  ? "로그인"
                  : "회원가입"}
            </button>
          </form>

          <p className="mt-1 px-2 pb-2 text-center text-xs leading-relaxed text-subtle-foreground">
            로그인 후 배우자를 초대 코드로 초대하거나,
            <br />
            초대받은 코드로 참여할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
