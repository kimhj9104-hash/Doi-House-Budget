import {
  LayoutDashboard,
  Receipt,
  Tags,
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
  { href: "/categories", label: "카테고리", icon: Tags },
  { href: "/settings", label: "설정", icon: Settings },
];
