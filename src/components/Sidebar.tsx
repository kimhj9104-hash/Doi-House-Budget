"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet2, Plus, Repeat } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

export default function Sidebar({ householdName }: { householdName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-sidebar-bg md:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet2 size={18} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-sidebar-fg-active">
            {householdName}
          </p>
          <p className="text-[11px] text-sidebar-fg">가계부</p>
        </div>
      </div>

      <Link
        href="/transactions/new"
        className="mx-4 mb-6 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
      >
        <Plus size={16} strokeWidth={2.5} />
        거래 추가
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-sidebar-bg-active text-sidebar-fg-active"
                  : "text-sidebar-fg hover:bg-sidebar-bg-active/60 hover:text-sidebar-fg-active"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/recurring"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            pathname === "/recurring" || pathname.startsWith("/recurring/")
              ? "bg-sidebar-bg-active text-sidebar-fg-active"
              : "text-sidebar-fg hover:bg-sidebar-bg-active/60 hover:text-sidebar-fg-active"
          }`}
        >
          <Repeat size={17} strokeWidth={2} />
          고정 수입/지출
        </Link>
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4">
        <p className="text-[11px] text-sidebar-fg">두이네 가계부 v1.0</p>
      </div>
    </aside>
  );
}
