import {
  BarChart3,
  LayoutDashboard,
  Layers,
  type LucideIcon,
  PlusCircle,
  Settings,
} from "lucide-react";

// Which chrome surface(s) a nav item appears on. The desktop sidebar and the
// mobile bottom nav intentionally differ (Analytics is desktop-only; Create is
// promoted on mobile), so each item declares where it shows. Both surfaces read
// this one config, so they cannot drift.
export type NavSurface = "sidebar" | "bottom" | "both";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  surface: NavSurface;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    surface: "both",
  },
  { label: "Library", href: "/decks", icon: Layers, surface: "both" },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    surface: "sidebar",
  },
  { label: "Create", href: "/decks/new", icon: PlusCircle, surface: "bottom" },
  { label: "Settings", href: "/settings", icon: Settings, surface: "both" },
];

export function navItemsFor(surface: Exclude<NavSurface, "both">): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => item.surface === surface || item.surface === "both",
  );
}

// The sidebar pins this as a prominent action at the bottom rather than listing
// it inline; the bottom nav surfaces the same destination as a "Create" item.
export const CREATE_DECK_HREF = "/decks/new";
