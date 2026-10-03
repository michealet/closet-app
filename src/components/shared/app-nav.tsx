"use client";

import {
  CalendarDaysIcon,
  HouseIcon,
  LayersIcon,
  ShirtIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_DISPLAY_NAME } from "@/lib/app-config";
import { cn } from "@/lib/utils";

/** Primary navigation (FRD NV-1). */
export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HouseIcon },
  { href: "/closet", label: "Closet", icon: ShirtIcon },
  { href: "/outfits", label: "Outfits", icon: LayersIcon },
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/profile", label: "Profile", icon: UserRoundIcon },
] as const;

/** Home matches only "/"; other tabs also match their sub-pages. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Phone: fixed tab bar with icon and label (NV-2). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground transition-colors",
                  active && "text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "text-brand")}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Desktop: sidebar (NV-2). */
export function SideNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r bg-sidebar px-4 py-6 md:flex">
      <Link href="/" className="px-3 font-heading text-2xl">
        {APP_DISPLAY_NAME}
      </Link>
      {children}
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    active && "bg-accent font-medium text-accent-foreground",
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "text-brand")}
                    aria-hidden
                  />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
