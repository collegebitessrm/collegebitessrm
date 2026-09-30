"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt, User, Utensils } from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Food", Icon: Utensils },
  { href: "/orders", label: "Orders", Icon: Receipt },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

/** Drill-down screens the bar slides away on (and back in from). */
const DRILL_DOWN = ["/restaurants/", "/orders/"];

function tabIndex(pathname: string) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/orders")) return 1;
  if (pathname.startsWith("/profile")) return 2;
  return -1;
}

/**
 * The floating bottom bar for the three top-level student screens. It
 * lives in the root layout rather than in each page, so it stays mounted
 * across tab changes: the lit pill slides (with a little spring) to the tab
 * you tapped, and the new tab's icon pops in filled. It shows on exactly
 * "/", "/orders" and "/profile"; on a menu or an order's ticket it slides
 * down out of the way (and comes back up when you return); everywhere else
 * (sign-in, admin, legal pages) it isn't rendered at all.
 *
 * Tapping the tab you're already on scrolls that page back to the top.
 */
export function TabBar() {
  const pathname = usePathname();
  const onTab = pathname === "/" || pathname === "/orders" || pathname === "/profile";
  const drillDown = DRILL_DOWN.some((prefix) => pathname.startsWith(prefix));
  if (!onTab && !drillDown) return null;

  const active = tabIndex(pathname);
  // Where the pill sits: the active tab, or — while hidden on a drill-down
  // screen — the tab it came from, so it doesn't visibly jump on the way out.
  const pill = Math.max(active, 0);

  function scrollToTopIfActive(event: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (!isActive) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <div
      aria-hidden={onTab ? undefined : true}
      inert={!onTab}
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-(--dur-base)",
        onTab ? "ease-out-expo" : "translate-y-[calc(100%+1rem)] opacity-0 ease-in-quad",
      )}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto relative mx-auto grid w-full max-w-md grid-cols-3 rounded-full border bg-card/85 p-1.5 shadow-raised backdrop-blur-xl"
      >
        {/* The lit pill. The outer span slides between tabs (translateX by
            whole tab widths — the pill is exactly one tab wide); the inner
            one, keyed by tab, squashes and settles as it lands. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)] transition-transform duration-(--dur-slow) ease-spring"
          style={{ transform: `translateX(${pill * 100}%)` }}
        >
          <span
            key={pill}
            className="animate-tab-stretch block size-full rounded-full bg-primary surface-primary glow-neon"
          />
        </span>

        {TABS.map(({ href, label, Icon }, i) => {
          const isActive = i === active;
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => scrollToTopIfActive(event, isActive)}
              className={cn(
                "pressable relative z-10 flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                key={isActive ? "on" : "off"}
                className={cn("size-5.5 shrink-0", isActive && "animate-tab-pop")}
                weight={isActive ? "fill" : "duotone"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
