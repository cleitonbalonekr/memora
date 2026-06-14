"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsFor } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Fixed mobile bottom nav. Hidden at md and up (the sidebar takes over). Needs
// the current path for active-state, so it is a client component. Items come
// from the shared nav-config.
export function BottomNav() {
  const pathname = usePathname();
  const items = navItemsFor("bottom");

  return (
    <nav className="fixed bottom-0 left-0 z-20 flex w-full justify-around border-t border-outline-variant bg-surface/90 py-sm backdrop-blur-md md:hidden">
      {items.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-xs transition-colors ${
              active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
            href={href}
            key={href}
          >
            <Icon aria-hidden="true" className="h-6 w-6" />
            <span className="text-label-sm">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
