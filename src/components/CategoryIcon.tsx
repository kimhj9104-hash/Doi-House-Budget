import {
  Utensils,
  Coffee,
  Car,
  Home,
  Smartphone,
  ShoppingBag,
  Film,
  HeartPulse,
  Gift,
  MoreHorizontal,
  Wallet,
  TrendingUp,
  HandCoins,
  Circle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  coffee: Coffee,
  car: Car,
  home: Home,
  smartphone: Smartphone,
  "shopping-bag": ShoppingBag,
  film: Film,
  "heart-pulse": HeartPulse,
  gift: Gift,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
  "trending-up": TrendingUp,
  "hand-coins": HandCoins,
  circle: Circle,
};

export function getCategoryIcon(icon: string): LucideIcon {
  return ICON_MAP[icon] ?? Circle;
}

export const CATEGORY_ICON_OPTIONS = Object.keys(ICON_MAP);

export default function CategoryIcon({
  icon,
  color,
  size = 18,
  className = "",
}: {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? Circle;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size * 1.9,
        height: size * 1.9,
        backgroundColor: color + "1f",
        color,
      }}
    >
      <Icon size={size} strokeWidth={2} />
    </span>
  );
}
