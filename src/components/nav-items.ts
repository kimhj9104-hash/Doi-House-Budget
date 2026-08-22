import {
  LayoutDashboard,
  Receipt,
  NotebookPen,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/transactions", label: "거래내역", icon: Receipt },
  { href: "/notes", label: "메모장", icon: NotebookPen },
  { href: "/settings", label: "설정", icon: Settings },
];
