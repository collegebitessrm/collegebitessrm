"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Inbox, Search, X } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminOrder, AdminRestaurant } from "@/lib/data/admin";
import { formatAdminDay, istDayKey } from "@/lib/date";
import { formatOrderNumber } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import { ExportOrdersButton } from "./export-orders-button";
import { OrderCard } from "./order-card";
import { adminPill } from "./styles";

const ALL_RESTAURANTS = "all";

type StatusFilter = "all" | "confirmed" | "delivered" | "cancelled";

// "delivered" is what's stored; "Completed" is what the admin sees, same
// wording as the stat card at the top of the page.
const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrderList({
  orders,
  restaurants,
  groupByDate = false,
}: {
  orders: AdminOrder[];
  restaurants: AdminRestaurant[];
  /** Section the (filtered) list by IST calendar day, newest first — for the order-history page. */
  groupByDate?: boolean;
}) {
  const [restaurantFilter, setRestaurantFilter] = useState(ALL_RESTAURANTS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (restaurantFilter !== ALL_RESTAURANTS && o.restaurantId !== restaurantFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q) {
        const haystack = `${formatOrderNumber(o.dailyNumber)} ${o.studentName} ${o.contactPhone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [orders, restaurantFilter, statusFilter, q]);

  // Newest day first; each day's own orders stay in the newest-first order
  // they already arrive in from the data layer.
  const groups = useMemo(() => {
    if (!groupByDate) return null;
    const byDay = new Map<string, AdminOrder[]>();
    for (const order of filtered) {
      const key = istDayKey(order.createdAt);
      const existing = byDay.get(key);
      if (existing) existing.push(order);
      else byDay.set(key, [order]);
    }
    return [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [filtered, groupByDate]);

  const restaurantLabel =
    restaurantFilter === ALL_RESTAURANTS
      ? "all restaurants"
      : (restaurants.find((r) => r.id === restaurantFilter)?.name ?? "all restaurants");
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label ?? "All statuses";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <RestaurantTab active={restaurantFilter === ALL_RESTAURANTS} onClick={() => setRestaurantFilter(ALL_RESTAURANTS)}>
          All restaurants
        </RestaurantTab>
        {restaurants.map((r) => (
          <RestaurantTab key={r.id} active={restaurantFilter === r.id} onClick={() => setRestaurantFilter(r.id)}>
            {r.name}
          </RestaurantTab>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-40 flex-1">
          <span className="sr-only">Search orders by ID, name, or phone</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID, name, phone…"
            className="h-10 w-full rounded-full bg-secondary pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/80 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-border text-foreground outline-none hover:bg-ink hover:text-ink-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
            >
              <X className="size-3.5" />
            </button>
          )}
        </label>

        <DropdownMenu>
          <DropdownMenuTrigger className={adminPill}>
            {statusLabel}
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                  {opt.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <ExportOrdersButton orders={filtered} />
      </div>

      <p className="text-sm text-muted-foreground">
        Showing <strong className="font-semibold text-foreground">{filtered.length}</strong> order
        {filtered.length === 1 ? "" : "s"} for{" "}
        <strong className="font-semibold text-foreground">{restaurantLabel}</strong>
        {statusFilter !== "all" && ` · ${statusLabel}`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState compact icon={Inbox} title="No orders here">
          Nothing matches these filters yet.
        </EmptyState>
      ) : groups ? (
        <div className="flex flex-col gap-6">
          {groups.map(([dayKey, dayOrders]) => (
            <div key={dayKey}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="font-heading text-lg font-bold">{formatAdminDay(dayOrders[0].createdAt)}</h3>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {dayOrders.length} order{dayOrders.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                {dayOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80",
        active ? "bg-ink text-ink-foreground" : "bg-secondary text-secondary-foreground hover:bg-border",
      )}
    >
      {children}
    </button>
  );
}
