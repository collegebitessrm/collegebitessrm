import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeMotif } from "@/components/theme/theme-motif";

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
 <section className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
 <ThemeMotif className="-top-14 -right-12 size-44" />
 <div className="relative px-5 pt-5 sm:px-6">
 <h2 className="font-heading text-title font-bold">Today</h2>
 <p className="text-sm text-primary-foreground/85">{todayLabel} · Gate 3</p>
 </div>
 <dl className="relative mt-4 grid grid-cols-2 gap-2 px-5 pb-5 sm:grid-cols-4 sm:px-6">
 <Stat label="Orders" value={totalOrders} />
 <Stat label="Confirmed" value={confirmedOrders} />
 <Stat label="Completed" value={completedOrders} tone="success" />
 <Stat
 label="Restaurants open"
 value={
 <>
 {activeRestaurants}
 <span className="text-primary-foreground/85">/{totalRestaurants}</span>
 </>
 }
 />
 </dl>
 {children && <div className="relative border-t border-hero-foreground/15 px-5 py-4 sm:px-6">{children}</div>}
 </section>
 );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "success" }) {
 return (
 <div className="flex flex-col-reverse justify-end rounded-2xl bg-primary-foreground/10 px-3 py-2.5">
 <dt className="text-sm font-medium">{label}</dt>
 <dd className={cn("font-heading text-3xl font-bold tabular-nums", tone === "success" && "text-success")}>
 {value}
 </dd>
 </div>
 );
}
