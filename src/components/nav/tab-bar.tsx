"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, User, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Food", Icon: Utensils, match: (p: string) => p === "/" },
  { href: "/orders", label: "Orders", Icon: Receipt, match: (p: string) => p.startsWith("/orders") },
  { href: "/profile", label: "Profile", Icon: User, match: (p: string) => p.startsWith("/profile") },
] as const;

/**
 * Persistent bottom navigation for the 3 top-level student screens.
 * Detail/drill-down screens (menu, order tracking) don't render this —
 * they use a back arrow instead, matching the design reference.
 */
export function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto grid w-full max-w-md grid-cols-3 border-t bg-card pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg py-1 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/80",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
