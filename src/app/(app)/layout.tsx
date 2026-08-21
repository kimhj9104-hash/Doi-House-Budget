"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppShell from "@/components/AppShell";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { ready, error, user, householdId, household } = useAuth();

  useEffect(() => {
    if (!ready || error) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!householdId) {
      router.replace("/onboarding");
    }
  }, [ready, error, user, householdId, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <AlertTriangle size={24} className="text-expense" />
          <p className="text-sm text-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!ready || !user || !householdId || !household) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <AppShell householdName={household.name}>{children}</AppShell>;
}
