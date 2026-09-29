import type { OrderStatus } from "@/lib/data/types";

/**
 * The order's display token, e.g. "#3" — its `daily_number` (position
 * that IST calendar day, campus-wide, reset every midnight — see
 * `orders.daily_number` / `set_daily_order_number` trigger). Shown to
 * both the student (pickup) and the admin (order list), so they always
 * agree; never used to look up an order (routes use the full id for that).
 */
export function formatOrderNumber(dailyNumber: number): string {
  return `#${dailyNumber}`;
}

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery"];

/** True while the order is still on its way (not delivered or cancelled). */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function statusBadge(status: OrderStatus): { label: string; className: string } {
  switch (status) {
    case "pending":
      return { label: "Placed", className: "bg-brand-soft text-brand-soft-foreground" };
    case "confirmed":
      return { label: "Confirmed", className: "bg-brand-soft text-brand-soft-foreground" };
    case "preparing":
      return { label: "Preparing", className: "bg-brand-soft text-brand-soft-foreground" };
    case "out_for_delivery":
      return { label: "Out for delivery", className: "bg-brand-soft text-brand-soft-foreground" };
    case "delivered":
      return { label: "Delivered", className: "bg-success-soft text-success" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-destructive/10 text-destructive" };
  }
}

/**
 * The two admin-driven jumps: confirm with the restaurant, then mark
 * delivered. `preparing`/`out_for_delivery` stay valid enum values (and
 * still show on the student timeline) but aren't clicked through
 * individually — delivery timing runs on fixed ETA slots, not admin
 * clicks, so there's nothing for a "start preparing" / "out for delivery"
 * button to actually decide.
 */
export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "delivered"];

/** The next status after `status` in STATUS_FLOW, or null if there isn't one (delivered/cancelled). */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i === -1 || i === STATUS_FLOW.length - 1 ? null : STATUS_FLOW[i + 1];
}

/** Button copy for advancing *out of* `status`, or null once there's nowhere left to advance to. */
export function advanceLabel(status: OrderStatus): string | null {
  switch (status) {
    case "pending":
      return "Confirm";
    case "confirmed":
      return "Mark delivered";
    case "preparing":
    case "out_for_delivery":
    case "delivered":
    case "cancelled":
      return null;
  }
}

export type TimelineStepState = "done" | "current" | "upcoming";
export type TimelineStep = { label: string; state: TimelineStepState };

/**
 * The 3-row student-facing timeline. Collapses preparing/out_for_delivery
 * into one row — we don't have a per-status timestamp to show a 4th step
 * meaningfully. Callers handle 'cancelled' separately (no timeline for it).
 */
export function orderTimeline(status: OrderStatus): TimelineStep[] {
  let confirmed: TimelineStepState;
  let preparing: TimelineStepState;

  switch (status) {
    case "pending":
      confirmed = "current";
      preparing = "upcoming";
      break;
    case "confirmed":
      confirmed = "done";
      preparing = "current";
      break;
    case "preparing":
    case "out_for_delivery":
      confirmed = "done";
      preparing = "current";
      break;
    case "delivered":
      confirmed = "done";
      preparing = "done";
      break;
    default:
      // 'cancelled' has no timeline — callers branch on it before calling this.
      confirmed = "upcoming";
      preparing = "upcoming";
  }

  return [
    { label: "Order placed", state: "done" },
    // Only claims "confirmed" once it's true; while pending it's still waiting.
    { label: confirmed === "current" ? "Pending confirmation" : "Restaurant confirmed", state: confirmed },
    { label: "Preparing & out for delivery", state: preparing },
  ];
}
