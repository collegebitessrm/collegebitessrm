"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Receipt, User, Utensils } from "@/components/icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Food", Icon: Utensils },
  { href: "/orders", label: "Orders", Icon: Receipt },
  { href: "/profile", label: "Profile", Icon: User },
] as const;

/** Drill-down screens the bar slides away on (and back in from). */
const DRILL_DOWN = ["/restaurants/", "/orders/"];

/** How far a finger has to move sideways before a press becomes a drag. */
const DRAG_START_PX = 8;

function tabIndex(pathname: string) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/orders")) return 1;
  if (pathname.startsWith("/profile")) return 2;
  return -1;
}

type Drag = { pointerId: number; startX: number; dragging: boolean };

/**
 * The floating bottom bar for the three top-level student screens. It
 * lives in the root layout rather than in each page, so it stays mounted
 * across tab changes: the lit pill slides (with a little spring) to the tab
 * you tapped, and the new tab's icon pops in filled. It shows on exactly
 * "/", "/orders" and "/profile"; on a menu or an order's ticket it slides
 * down out of the way (and comes back up when you return); everywhere else
 * (sign-in, admin, legal pages) it isn't rendered at all.
 *
 * It's also a real slider: press anywhere on the bar and slide sideways —
 * the pill lifts and follows your finger, the tab under it lights up (with
 * a tiny buzz on phones that support it), and letting go snaps the pill to
 * that tab and opens it. A press that doesn't move sideways is still an
 * ordinary tap; vertical movement still scrolls the page (touch-action:
 * pan-y). Keyboard users get the plain links.
 *
 * Tapping the tab you're already on scrolls that page back to the top.
 */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Drag | null>(null);
  // Swallow the click that follows a drag's pointerup.
  const suppressClickRef = useRef(false);
  // While dragging: the pill's left edge (px from the first slot) and the
  // tab under it. Worked out in the pointer handlers, since measuring the
  // bar during render isn't allowed.
  const [held, setHeld] = useState<{ x: number; tab: number } | null>(null);

  const onTab = pathname === "/" || pathname === "/orders" || pathname === "/profile";
  const drillDown = DRILL_DOWN.some((prefix) => pathname.startsWith(prefix));
  if (!onTab && !drillDown) return null;

  const active = tabIndex(pathname);
  // Where the pill sits: the active tab, or — while hidden on a drill-down
  // screen — the tab it came from, so it doesn't visibly jump on the way out.
  const pill = Math.max(active, 0);

  /** The width of one tab slot (the pill is exactly one slot wide). */
  function slotWidth() {
    const nav = navRef.current;
    if (!nav) return 0;
    // 0.375rem (p-1.5) of padding on each side.
    const pad = parseFloat(getComputedStyle(nav).paddingLeft) || 6;
    return (nav.clientWidth - pad * 2) / TABS.length;
  }

  /** The pill's left edge (px from the first slot) centred under the finger, clamped to the bar. */
  function pillXFor(clientX: number) {
    const nav = navRef.current!;
    const slot = slotWidth();
    const pad = parseFloat(getComputedStyle(nav).paddingLeft) || 6;
    const x = clientX - nav.getBoundingClientRect().left - pad - slot / 2;
    return Math.min(Math.max(x, 0), slot * (TABS.length - 1));
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, dragging: false };
  }

  function onPointerMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.dragging) {
      if (Math.abs(e.clientX - drag.startX) < DRAG_START_PX) return;
      drag.dragging = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const x = pillXFor(e.clientX);
    const tab = Math.round(x / Math.max(slotWidth(), 1));
    if (tab !== (held?.tab ?? pill)) navigator.vibrate?.(8);
    setHeld({ x, tab });
  }

  function endDrag(e: PointerEvent<HTMLElement>, commit: boolean) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (!drag.dragging) return;
    suppressClickRef.current = true;
    const target = Math.round(pillXFor(e.clientX) / Math.max(slotWidth(), 1));
    setHeld(null);
    if (commit && target !== active) router.push(TABS[target].href);
  }

  function onLinkClick(event: MouseEvent<HTMLAnchorElement>, isActive: boolean) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      return;
    }
    if (!isActive) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  const dragging = held !== null;
  const lit = held?.tab ?? active;

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
        ref={navRef}
        aria-label="Primary"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        className="pointer-events-auto relative mx-auto grid w-full max-w-md touch-pan-y grid-cols-3 rounded-full border bg-card/85 p-1.5 shadow-raised backdrop-blur-xl select-none"
      >
        {/* The lit pill. The outer span slides between tabs (translateX by
            whole tab widths — the pill is exactly one tab wide), or follows
            the finger 1:1 while dragged; the inner one, keyed by tab,
            squashes and settles as it lands, and lifts while held. */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-y-1.5 left-1.5 w-[calc((100%-0.75rem)/3)]",
            !dragging && "transition-transform duration-(--dur-slow) ease-spring",
          )}
          style={{ transform: held ? `translateX(${held.x}px)` : `translateX(${pill * 100}%)` }}
        >
          <span
            key={pill}
            className={cn(
              "animate-tab-stretch block size-full rounded-full bg-primary surface-primary glow-neon transition-transform duration-(--dur-quick)",
              dragging && "scale-y-110 scale-x-105",
            )}
          />
        </span>

        {TABS.map(({ href, label, Icon }, i) => {
          const isActive = i === active;
          const isLit = i === lit;
          return (
            <Link
              key={href}
              href={href}
              draggable={false}
              aria-current={isActive ? "page" : undefined}
              onClick={(event) => onLinkClick(event, isActive)}
              className={cn(
                "pressable relative z-10 flex h-12 items-center justify-center gap-1.5 rounded-full text-sm font-semibold outline-none transition-colors duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
                isLit ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                key={isLit ? "on" : "off"}
                className={cn("size-5.5 shrink-0", isLit && "animate-tab-pop")}
                weight={isLit ? "fill" : "duotone"}
              />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
