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

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "at_gate"];

/** True while the order is still on its way (not delivered or cancelled). */
export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

/** Label + chip colours per status, in the brand sheet's scheme (gold waiting / preparing, cyan confirmed, pink out for delivery, violet at gate). */
export function statusBadge(status: OrderStatus, destination = "Gate 3"): { label: string; className: string } {
  switch (status) {
    case "pending":
      return { label: "Placed", className: "bg-gold/35 text-foreground" };
    case "confirmed":
      return { label: "Confirmed", className: "bg-chip-active/20 text-primary" };
    case "preparing":
      return { label: "Preparing", className: "bg-gold/35 text-foreground" };
    case "out_for_delivery":
      return { label: "Out for delivery", className: "bg-secondary text-foreground" };
    case "at_gate":
      return { label: `At ${destination}`, className: "bg-violet-soft text-violet-soft-foreground" };
    case "delivered":
      return { label: "Delivered", className: "bg-success-soft text-success" };
    case "cancelled":
      return { label: "Cancelled", className: "bg-destructive/10 text-destructive" };
  }
}

/**
 * The full status flow: pending → confirmed → preparing → out_for_delivery → at_gate → delivered.
 * Each step requires a manual admin click (except confirmed → preparing which auto-advances).
 */
export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "out_for_delivery", "at_gate", "delivered"];

/** The next status after `status` in STATUS_FLOW, or null if there isn't one (delivered/cancelled). */
export function nextStatus(status: OrderStatus): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(status);
  return i === -1 || i === STATUS_FLOW.length - 1 ? null : STATUS_FLOW[i + 1];
}

/** Button copy for advancing *out of* `status`, or null once there's nowhere left to advance to. */
export function advanceLabel(status: OrderStatus, destination = "Gate 3"): string | null {
  switch (status) {
    case "pending":
      return "Confirm";
    case "confirmed":
      return "Start preparing";
    case "preparing":
      return "Out for delivery";
    case "out_for_delivery":
      return `Reached ${destination}`;
    case "at_gate":
      return "Mark delivered";
    case "delivered":
    case "cancelled":
      return null;
  }
}

export type TimelineStepState = "done" | "current" | "upcoming";
export type TimelineStep = { label: string; state: TimelineStepState };

/**
 * The 5-row student-facing timeline: placed → confirmed → preparing → out for delivery → at gate → delivered.
 * Callers handle 'cancelled' separately (no timeline for it).
 */
export function orderTimeline(status: OrderStatus, destination = "Gate 3"): TimelineStep[] {
  let confirmed: TimelineStepState;
  let preparing: TimelineStepState;
  let outForDelivery: TimelineStepState;
  let atGate: TimelineStepState;

  switch (status) {
    case "pending":
      confirmed = "current";
      preparing = "upcoming";
      outForDelivery = "upcoming";
      atGate = "upcoming";
      break;
    case "confirmed":
      confirmed = "done";
      preparing = "current";
      outForDelivery = "upcoming";
      atGate = "upcoming";
      break;
    case "preparing":
      confirmed = "done";
      preparing = "current";
      outForDelivery = "upcoming";
      atGate = "upcoming";
      break;
    case "out_for_delivery":
      confirmed = "done";
      preparing = "done";
      outForDelivery = "current";
      atGate = "upcoming";
      break;
    case "at_gate":
      confirmed = "done";
      preparing = "done";
      outForDelivery = "done";
      atGate = "current";
      break;
    case "delivered":
      confirmed = "done";
      preparing = "done";
      outForDelivery = "done";
      atGate = "done";
      break;
    default:
      // 'cancelled' has no timeline — callers branch on it before calling this.
      confirmed = "upcoming";
      preparing = "upcoming";
      outForDelivery = "upcoming";
      atGate = "upcoming";
  }

  const delivered: TimelineStepState = status === "delivered" ? "done" : "upcoming";

  return [
    { label: "Order placed", state: "done" },
    { label: confirmed === "current" ? "Pending confirmation" : "Restaurant confirmed", state: confirmed },
    { label: "Preparing your order", state: preparing },
    { label: `On the way to ${destination}`, state: outForDelivery },
    { label: `Reached ${destination}`, state: atGate },
    { label: "Delivered", state: delivered },
  ];
}
