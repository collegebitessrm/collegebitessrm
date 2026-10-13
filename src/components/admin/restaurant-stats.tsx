"use client";

import { useState } from "react";
import { Check, Copy } from "@/components/icons";
import type { AdminRestaurant } from "@/lib/data/admin";
import type { RestaurantStats } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

type Props = {
  restaurants: AdminRestaurant[];
  stats: Record<string, RestaurantStats>;
};

/**
 * Per-restaurant stats grid on the admin dashboard. Each card shows daily,
 * weekly, total, delivered, cancelled, deleted, fulls, singles and starters
 * counts. A "Copy weekly summary" button at the bottom copies a compact
 * text block for all restaurants to the clipboard.
 */
export function RestaurantStatsGrid({ restaurants, stats }: Props) {
  const [copied, setCopied] = useState(false);

  const weeklyLines = restaurants.map((r) => {
    const s = stats[r.id];
    return `${r.name}: ${s.weekly} orders, ₹${s.weeklyRevenue.toLocaleString("en-IN")}`;
  });
  const totalWeeklyOrders = restaurants.reduce((sum, r) => sum + stats[r.id].weekly, 0);
  const totalWeeklyRevenue = restaurants.reduce((sum, r) => sum + stats[r.id].weeklyRevenue, 0);
  const summaryText = `Weekly summary (${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}):\n${weeklyLines.join("\n")}\n\nTotal: ${totalWeeklyOrders} orders, ₹${totalWeeklyRevenue.toLocaleString("en-IN")}`;

  function copySummary() {
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-title font-bold">Restaurant stats</h2>
        <button
          type="button"
          onClick={copySummary}
          className={cn(
            "flex h-9 items-center gap-1.5 rounded-full border bg-card px-3.5 text-sm font-semibold shadow-card outline-none hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80",
          )}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-success" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy weekly summary
            </>
          )}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <RestaurantStatCard key={r.id} restaurant={r} stats={stats[r.id]} />
        ))}
      </div>
    </section>
  );
}

function RestaurantStatCard({
  restaurant,
  stats,
}: {
  restaurant: AdminRestaurant;
  stats: RestaurantStats;
}) {
  return (
    <div className="rounded-3xl border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "size-2 rounded-full",
            restaurant.is_active ? "bg-success" : "bg-destructive",
          )}
          aria-hidden="true"
        />
        <h3 className="truncate font-heading text-base font-bold">{restaurant.name}</h3>
      </div>

      {/* Time-scoped order counts */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <MiniStat label="Today" value={stats.daily} />
        <MiniStat label="This week" value={stats.weekly} />
        <MiniStat label="All time" value={stats.total} />
      </div>

      {/* Revenue — only counts delivered orders */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <MiniStat label="Today" value={`₹${stats.dailyRevenue.toLocaleString("en-IN")}`} />
        <MiniStat label="This week" value={`₹${stats.weeklyRevenue.toLocaleString("en-IN")}`} />
        <MiniStat label="All time" value={`₹${stats.revenue.toLocaleString("en-IN")}`} />
      </div>

      {/* Status breakdowns */}
      <div className="mb-3 grid grid-cols-3 gap-2">
        <MiniStat label="Delivered" value={stats.delivered} tone="success" />
        <MiniStat label="Cancelled" value={stats.cancelled} tone="destructive" />
        <MiniStat label="Deleted" value={stats.deleted} tone="muted" />
      </div>

      {/* Item-type breakdowns — only show non-zero */}
      {(stats.fulls > 0 || stats.singles > 0 || stats.starters > 0) && (
        <div className="grid grid-cols-3 gap-2">
          {stats.fulls > 0 && <MiniStat label="Fulls" value={stats.fulls} />}
          {stats.singles > 0 && <MiniStat label="Singles" value={stats.singles} />}
          {stats.starters > 0 && <MiniStat label="Starters" value={stats.starters} />}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "success" | "destructive" | "muted";
}) {
  return (
    <div className="rounded-2xl bg-secondary/50 px-2.5 py-2 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-heading text-xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}