"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { CREATE_DECK_HREF, navItemsFor } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Fixed desktop sidebar. Hidden below md (the bottom nav takes over). Needs the
// current path for active-state, so it is a client component. Items come from
// the shared nav-config; the "Create New Deck" action is pinned at the bottom.
export function SideNav() {
  const pathname = usePathname();
  const items = navItemsFor("sidebar");

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col bg-surface p-md shadow-sm md:flex">
      <div className="mb-xl flex items-center gap-sm pl-2">
        <h1 className="text-headline-md font-bold text-primary">Memora</h1>
      </div>

      <nav className="flex-1 space-y-xs">
        {items.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-md rounded-lg px-md py-sm text-label-md transition-colors ${
                active
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
              href={href}
              key={href}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Link
          className="flex w-full items-center justify-center gap-sm rounded-lg bg-primary px-md py-sm text-label-md text-on-primary transition-opacity hover:opacity-90"
          href={CREATE_DECK_HREF}
        >
          <PlusCircle aria-hidden="true" className="h-5 w-5" />
          Create New Deck
        </Link>
      </div>
    </aside>
  );
}
