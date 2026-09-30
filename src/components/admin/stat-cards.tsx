import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/*
 * The dashboard's one sunset hero block — the same member-card treatment as the
 * student profile: today's numbers across the top, and (via `children`)
 * the campus-wide ordering switch as its footer row, instead of five
 * separate stat tiles plus a second dark banner for the kill switch.
 * Scoped to today's IST orders, same as before (getOrderCounts(startOfTodayIST())).
 */
export function StatCards({
  todayLabel,
  totalOrders,
  confirmedOrders,
  completedOrders,
  activeRestaurants,
  totalRestaurants,
  children,
}: {
  /** "Sat 19 Sep" — shown under the heading. */
  todayLabel: string;
  totalOrders: number;
  confirmedOrders: number;
  completedOrders: number;
  activeRestaurants: number;
  totalRestaurants: number;
  /** Footer row — the ordering kill switch. */
  children?: ReactNode;
}) {
  return (
    <section className="surface-hero glow-sun rounded-3xl bg-hero text-hero-foreground">
      <div className="px-5 pt-5 sm:px-6">
        <h2 className="font-heading text-title font-bold">Today</h2>
        <p className="text-sm text-hero-foreground/85">{todayLabel} · Gate 3</p>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-y-4 px-5 pb-5 sm:grid-cols-4 sm:px-6">
        <Stat label="Orders" value={totalOrders} />
        <Stat label="Confirmed" value={confirmedOrders} />
        <Stat label="Completed" value={completedOrders} tone="success" />
        <Stat
          label="Restaurants open"
          value={
            <>
              {activeRestaurants}
              <span className="text-hero-foreground/85">/{totalRestaurants}</span>
            </>
          }
        />
      </dl>
      {children && <div className="border-t border-hero-foreground/15 px-5 py-4 sm:px-6">{children}</div>}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "success" }) {
  return (
    <div className="flex flex-col-reverse justify-end">
      <dt className="text-sm text-hero-foreground/85">{label}</dt>
      <dd className={cn("font-heading text-3xl font-bold tabular-nums", tone === "success" && "text-hero-success")}>
        {value}
      </dd>
    </div>
  );
}
