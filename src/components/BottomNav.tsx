"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

const LEFT = NAV_ITEMS.slice(0, 2);
const RIGHT = NAV_ITEMS.slice(2);

export default function BottomNav() {
  const pathname = usePathname();

  const renderItem = (item: (typeof NAV_ITEMS)[number]) => {
    const active =
      pathname === item.href || pathname.startsWith(item.href + "/");
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
      >
        <Icon
          size={21}
          strokeWidth={active ? 2.4 : 2}
          className={active ? "text-primary" : "text-subtle-foreground"}
        />
        <span
          className={`text-[10px] font-medium ${
            active ? "text-primary" : "text-subtle-foreground"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-border bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {LEFT.map(renderItem)}

      <div className="flex flex-1 items-center justify-center">
        <Link
          href="/transactions/new"
          className="-mt-6 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
          style={{ height: "3.25rem", width: "3.25rem" }}
        >
          <Plus size={24} strokeWidth={2.5} />
        </Link>
      </div>

      {RIGHT.map(renderItem)}
    </nav>
  );
}
