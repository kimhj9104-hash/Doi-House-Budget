import Link from "next/link";
import { Wallet2 } from "lucide-react";

export default function TopBar({ householdName }: { householdName: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Wallet2 size={16} strokeWidth={2.25} />
      </div>
      <p className="truncate text-[15px] font-bold text-foreground">
        {householdName}
      </p>
      <Link
        href="/settings"
        className="ml-auto text-xs font-medium text-muted-foreground"
      >
        설정
      </Link>
    </header>
  );
}
