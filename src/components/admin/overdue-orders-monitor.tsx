"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  MessageCircle,
  PencilSimple,
  Timer,
} from "@/components/icons";
import type { AdminOrder } from "@/lib/data/admin";
import { deliveryDue, formatOrderTimestamp, formatTime } from "@/lib/date";
import { whatsAppRestaurantDelayInquiry } from "@/lib/orders/admin-text";
import { formatOrderNumber, statusBadge } from "@/lib/orders/status";
import { whatsAppLink } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  DelayReportModal,
  getMinutesOverdue,
  getOverdueState,
  OverdueBadge,
} from "./delay-report-modal";

type MonitorFilter = "all" | "approaching" | "overdue" | "delayed" | "awaiting";

const MONITOR_FILTERS: { id: MonitorFilter; label: string }[] = [
  { id: "all", label: "All active orders" },
  { id: "overdue", label: "Overdue" },
  { id: "approaching", label: "Approaching ETA" },
  { id: "delayed", label: "Delay reported" },
  { id: "awaiting", label: "Awaiting confirmation" },
];

export function OverdueOrdersMonitor({
  orders,
  className,
}: {
  orders: AdminOrder[];
  className?: string;
}) {
  const [filter, setFilter] = useState<MonitorFilter>("all");
  const [selectedOrderForDelay, setSelectedOrderForDelay] = useState<AdminOrder | null>(null);

  // Active orders only (not delivered, not cancelled)
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  }, [orders]);

  // Classified & sorted: Most overdue first, then approaching, then rest
  const processedOrders = useMemo(() => {
    const now = new Date();
    return activeOrders
      .map((order) => {
        const originalEta = deliveryDue(order.createdAt, order.deliveryMinutes, order.restaurantName);
        const currentEta = order.updatedEta ? new Date(order.updatedEta) : originalEta;
        const overdueState = getOverdueState(order, now);
        const minutesOverdue = getMinutesOverdue(order, now);
        const isApproaching = overdueState === "approaching";
        const isOverdue = overdueState === "overdue";
        const hasDelay = !!order.delayReason;
        const isAwaiting = order.awaitingEtaConfirmation || (hasDelay && !order.updatedEta);

        return {
          order,
          originalEta,
          currentEta,
          overdueState,
          minutesOverdue,
          isApproaching,
          isOverdue,
          hasDelay,
          isAwaiting,
        };
      })
      .filter((item) => {
        if (filter === "approaching") return item.isApproaching;
        if (filter === "overdue") return item.isOverdue;
        if (filter === "delayed") return item.hasDelay;
        if (filter === "awaiting") return item.isAwaiting;
        return true;
      })
      .sort((a, b) => {
        // Most overdue first
        if (a.minutesOverdue !== b.minutesOverdue) {
          return b.minutesOverdue - a.minutesOverdue;
        }
        // Then by current ETA earliest first
        return a.currentEta.getTime() - b.currentEta.getTime();
      });
  }, [activeOrders, filter]);

  // Counts for summary pills
  const counts = useMemo(() => {
    const now = new Date();
    let overdueCount = 0;
    let approachingCount = 0;
    let delayedCount = 0;
    let awaitingCount = 0;

    for (const o of activeOrders) {
      const state = getOverdueState(o, now);
      if (state === "overdue") overdueCount++;
      if (state === "approaching") approachingCount++;
      if (o.delayReason) delayedCount++;
      if (o.awaitingEtaConfirmation || (o.delayReason && !o.updatedEta)) awaitingCount++;
    }

    return {
      all: activeOrders.length,
      overdue: overdueCount,
      approaching: approachingCount,
      delayed: delayedCount,
      awaiting: awaitingCount,
    };
  }, [activeOrders]);

  return (
    <section className={cn("rounded-3xl border bg-card p-4 shadow-card sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Timer className="size-4" />
            </span>
            <h2 className="font-heading text-title font-bold text-foreground">
              Overdue & Delay Monitor
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monitor orders approaching or exceeding their ETA, report restaurant delays, and inform customers.
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {counts.overdue > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 font-bold text-destructive">
              <AlertCircle className="size-3" />
              {counts.overdue} Overdue
            </span>
          )}
          {counts.approaching > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
              <Timer className="size-3" />
              {counts.approaching} Approaching
            </span>
          )}
          {counts.delayed > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 font-bold text-orange-800 dark:bg-orange-500/15 dark:text-orange-400">
              {counts.delayed} Delayed
            </span>
          )}
          {counts.awaiting > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 font-semibold text-muted-foreground">
              {counts.awaiting} Awaiting confirmation
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MONITOR_FILTERS.map((f) => {
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95",
                filter === f.id
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
              )}
            >
              <span>{f.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums",
                  filter === f.id ? "bg-background/20 text-background" : "bg-card text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Monitor Order List */}
      <div className="mt-4 flex flex-col divide-y divide-border/60">
        {processedOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No active orders matching &quot;{MONITOR_FILTERS.find((f) => f.id === filter)?.label}&quot;.
          </div>
        ) : (
          processedOrders.map(
            ({
              order,
              originalEta,
              currentEta,
              overdueState,
              minutesOverdue,
              hasDelay,
              isAwaiting,
            }) => {
              const badge = statusBadge(order.status);
              const delayMessage = whatsAppRestaurantDelayInquiry(order);

              return (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 py-3.5 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Order info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-heading text-lg font-bold tabular-nums text-foreground hover:underline"
                      >
                        {formatOrderNumber(order.dailyNumber)}
                      </Link>
                      <span className="text-sm font-semibold text-muted-foreground">
                        · {order.restaurantName}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        ({order.studentName})
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", badge.className)}>
                        {badge.label}
                      </span>
                      {overdueState && <OverdueBadge state={overdueState} />}
                      {hasDelay && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-400">
                          Delay reported
                        </span>
                      )}
                    </div>

                    {/* Timing & Delay Reason */}
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span>Placed: {formatOrderTimestamp(order.createdAt)}</span>
                      <span>
                        Orig ETA: <strong className="text-foreground">{formatTime(originalEta.toISOString())}</strong>
                      </span>
                      <span>
                        Current ETA:{" "}
                        <strong className="text-foreground">
                          {order.updatedEta
                            ? formatTime(order.updatedEta)
                            : isAwaiting
                              ? "Awaiting confirmation"
                              : formatTime(originalEta.toISOString())}
                        </strong>
                      </span>
                      {minutesOverdue > 0 && (
                        <span className="font-bold text-destructive">
                          +{minutesOverdue}m overdue
                        </span>
                      )}
                      {order.delayUpdatedAt && (
                        <span>Updated: {formatTime(order.delayUpdatedAt)}</span>
                      )}
                    </div>

                    {order.delayReason && (
                      <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                        Reason: {order.delayReason}
                      </p>
                    )}
                  </div>

                  {/* Actions for this order */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {/* Report Delay / Update ETA */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForDelay(order)}
                      className="flex h-8 items-center gap-1 rounded-full border border-amber-300/80 bg-amber-50 px-2.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      title={hasDelay ? "Update ETA or reason" : "Report a delay"}
                    >
                      <PencilSimple className="size-3.5" />
                      <span>{hasDelay ? "Update ETA" : "Report Delay"}</span>
                    </button>

                    {/* Ask Restaurant for Update via WhatsApp */}
                    {order.restaurantPhone && (
                      <a
                        href={whatsAppLink(order.restaurantPhone, delayMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 items-center gap-1 rounded-full bg-primary/10 px-2.5 text-xs font-semibold text-primary hover:bg-primary/20"
                        title="Ask restaurant for ETA via WhatsApp"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Ask Restaurant</span>
                      </a>
                    )}

                    {/* View Order Link */}
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex h-8 items-center gap-1 rounded-full border bg-card px-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Open order details"
                    >
                      <span>View</span>
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </div>
              );
            },
          )
        )}
      </div>

      {/* Delay / ETA Modal */}
      {selectedOrderForDelay && (
        <DelayReportModal
          order={selectedOrderForDelay}
          open={!!selectedOrderForDelay}
          onOpenChange={(open) => {
            if (!open) setSelectedOrderForDelay(null);
          }}
          onDelayUpdated={(updated) => {
            selectedOrderForDelay.delayReason = updated.delayReason;
            selectedOrderForDelay.updatedEta = updated.updatedEta;
            selectedOrderForDelay.delayUpdatedAt = updated.delayUpdatedAt;
            selectedOrderForDelay.awaitingEtaConfirmation = updated.awaitingEtaConfirmation;
            setSelectedOrderForDelay(null);
          }}
        />
      )}
    </section>
  );
}
