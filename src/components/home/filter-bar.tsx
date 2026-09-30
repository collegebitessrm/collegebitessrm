import type { ReactNode } from "react";
import { ArrowsDownUp, ChevronDown, Flame, SlidersHorizontal, Timer, X } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import { activeCount, FAST_MINUTES, SORTS, type HomeFilters } from "@/lib/home-filters";
import { cn } from "@/lib/utils";

/**
 * Home's quick-filter chips, sticky under the top of the screen while you
 * scroll: Filters (opens the sheet, with a count of what's on), Sort, then
 * one-tap toggles — Veg / Non-veg (one or the other), Under ₹200, the
 * 40-minute kitchens and, once there's order data, Popular. A lit chip
 * shows a small × and taps off again.
 */
export function FilterBar({
  filters,
  onChange,
  onOpenSheet,
  showPopular,
}: {
  filters: HomeFilters;
  onChange: (next: HomeFilters) => void;
  onOpenSheet: () => void;
  /** Hide the Popular chip until enough dishes have been ordered to mean something. */
  showPopular: boolean;
}) {
  const count = activeCount(filters);
  const sortLabel = filters.sort === "recommended" ? "Sort" : SORTS.find((s) => s.key === filters.sort)?.label;
  const set = (patch: Partial<HomeFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="sticky top-0 z-20 -mx-6 mt-3 bg-background/85 py-2.5 backdrop-blur-lg">
      <ul
        aria-label="Quick filters"
        className="flex gap-2 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <li className="shrink-0">
          <Chip on={count > 0} onClick={onOpenSheet} label={count ? `Filters, ${count} on` : "Filters"} haspopup>
            <SlidersHorizontal className="size-4" />
            Filters
            {count > 0 && (
              <span
                key={count}
                className="animate-pop-in flex size-5 items-center justify-center rounded-full bg-chip-active-foreground text-[0.7rem] font-bold text-chip-active tabular-nums"
              >
                {count}
              </span>
            )}
          </Chip>
        </li>
        <li className="shrink-0">
          <Chip on={filters.sort !== "recommended"} onClick={onOpenSheet} haspopup>
            <ArrowsDownUp className="size-4" />
            {sortLabel}
            <ChevronDown className="size-3.5" />
          </Chip>
        </li>
        <li className="shrink-0">
          <Chip on={filters.diet === "veg"} onClick={() => set({ diet: filters.diet === "veg" ? null : "veg" })} toggle>
            <VegMark isVeg className="size-4 bg-card [&>span]:size-1.5" />
            Veg
          </Chip>
        </li>
        <li className="shrink-0">
          <Chip
            on={filters.diet === "nonveg"}
            danger
            onClick={() => set({ diet: filters.diet === "nonveg" ? null : "nonveg" })}
            toggle
          >
            <VegMark isVeg={false} className="size-4 bg-card [&>span]:size-1.5" />
            Non-veg
          </Chip>
        </li>
        <li className="shrink-0">
          <Chip on={filters.price === "u200"} onClick={() => set({ price: filters.price === "u200" ? null : "u200" })} toggle>
            Under ₹200
          </Chip>
        </li>
        <li className="shrink-0">
          <Chip on={filters.fast} onClick={() => set({ fast: !filters.fast })} toggle>
            <Timer className="size-4" />
            {FAST_MINUTES}-min delivery
          </Chip>
        </li>
        {showPopular && (
          <li className="shrink-0">
            <Chip on={filters.popular} onClick={() => set({ popular: !filters.popular })} toggle>
              <Flame className="icon-tint-gold size-4" />
              Popular
            </Chip>
          </li>
        )}
      </ul>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
  toggle = false,
  danger = false,
  haspopup = false,
  label,
}: {
  on: boolean;
  onClick: () => void;
  children: ReactNode;
  /** A one-tap filter: aria-pressed, and a × while it's on. */
  toggle?: boolean;
  /** Non-veg: red on light red when on, matching the menu's diet toggle. */
  danger?: boolean;
  /** Opens the filter sheet. */
  haspopup?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={toggle ? on : undefined}
      aria-haspopup={haspopup ? "dialog" : undefined}
      aria-label={label}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap outline-none transition-[background-color,color,border-color,box-shadow] duration-(--dur-base) focus-visible:ring-3 focus-visible:ring-ring/80",
        !on && "bg-card text-foreground shadow-card hover:border-ring/50",
        on && !danger && "glow-cyan border-transparent bg-chip-active text-chip-active-foreground",
        on && danger && "border-destructive/40 bg-destructive/10 text-destructive",
      )}
    >
      {children}
      {toggle && on && <X key="x" className="animate-pop-in size-3.5" />}
    </button>
  );
}
