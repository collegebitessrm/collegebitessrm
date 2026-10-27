"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, MessageCircle, Trash2 } from "@/components/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BlurImage } from "@/components/blur-image";
import { advanceOrderStatus, cancelOrder, deleteOrder } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import type { OrderStatus } from "@/lib/data/types";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { itemLine, orderDetailsText, whatsAppConfirmation, whatsAppRestaurantConfirmation } from "@/lib/orders/admin-text";
import { advanceLabel, formatOrderNumber, nextStatus, statusBadge } from "@/lib/orders/status";
import { formatStoredMobile, whatsAppLink } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Local status for an order card / detail page. Tracks the prop so a fresh
 * server re-fetch (e.g. "Mark all delivered" changing this order from
 * elsewhere) can resync — set during render, not an effect, so there's no
 * extra render/flash. See "Adjusting state based on a prop change" in the
 * React docs.
 */
export function useOrderStatus(propStatus: OrderStatus) {
  const [status, setStatus] = useState(propStatus);
  const [prevPropStatus, setPrevPropStatus] = useState(propStatus);
  if (propStatus !== prevPropStatus) {
    setPrevPropStatus(propStatus);
    setStatus(propStatus);
  }
  return [status, setStatus] as const;
}

export function OrderCard({ order }: { order: AdminOrder }) {
  const [status, setStatus] = useOrderStatus(order.status);
  const badge = statusBadge(status);

  // First ordered dish that has a photo — same lookup as the student side.
  const photo = order.items
    .map((i) => getDishPhoto(order.restaurantName, i.dishName, i.imageUrl))
    .find((src): src is string => !!src);

  // The whole card opens the order's page: the token link stretches over
  // the card (after:inset-0), and every control sits above it (relative z-10).
  return (
    <div className="relative rounded-3xl border bg-card p-4 shadow-card transition-shadow hover:shadow-raised">
      <div className="flex items-start gap-3">
        <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary font-heading text-xl font-bold text-foreground/60">
          {photo ? (
            <BlurImage src={photo} alt="" sizes="56px" className="object-cover" />
          ) : (
            <span aria-hidden="true">{order.restaurantName.trim().charAt(0)}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/admin/orders/${order.id}`}
              className="rounded-md font-heading text-2xl leading-none font-bold tabular-nums outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-ring/80"
            >
              {formatOrderNumber(order.dailyNumber)}
              <span className="sr-only">, open order details</span>
            </Link>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", badge.className)}>
              {badge.label}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{formatOrderTimestamp(order.createdAt)}</p>
        </div>
      </div>

      <OrderSummaryBox order={order} className="mt-3" />

      {/* Financials & Copy Row */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-foreground">
            {formatRupees(order.totalAmount)}
          </span>
        </div>
        <div className="relative z-10 flex items-center gap-1.5">
          <CopyOrderButton order={order} />
        </div>
      </div>

      {/* WhatsApp Message Actions: Symmetrical 50/50 or full-width buttons */}
      <div className="relative z-10 mt-2.5 flex items-center gap-2">
        <WhatsAppButton order={order} className="flex-1" />
        <WhatsAppRestaurantButton order={order} className="flex-1" />
      </div>

      {/* Status Advance & Cancel Actions */}
      <OrderActions order={order} status={status} onStatusChange={setStatus} className="relative z-10 mt-2.5" />
    </div>
  );
}

/** "From <restaurant>", one "Dish - qty" line per dish with its price, the note, then the student's name and number — what the copy button copies. */
export function OrderSummaryBox({ order, className }: { order: AdminOrder; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-secondary px-3.5 py-3", className)}>
      <p className="text-label text-muted-foreground">
        From <span className="font-semibold text-foreground">{order.restaurantName}</span>
      </p>
      <ul className="mt-1.5 flex flex-col gap-1 text-sm">
        {order.items.map((item, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 font-medium">{itemLine(item)}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {item.isFree ? "Free" : formatRupees(item.subtotal)}
            </span>
          </li>
        ))}
        {order.discountOffer && (
          <li className="flex items-baseline justify-between gap-3 font-semibold text-success">
            <span className="min-w-0">{OFFERS[order.discountOffer].short}</span>
            <span className="shrink-0 tabular-nums">−{formatRupees(order.discountAmount)}</span>
          </li>
        )}
      </ul>
      {order.notes && <p className="mt-2 text-sm text-muted-foreground italic">“{order.notes}”</p>}
      <div className="mt-2.5 border-t border-foreground/10 pt-2.5">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{order.studentName}</p>
          {order.studentBanned && (
            <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
              Banned
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">{formatStoredMobile(order.contactPhone)}</p>
      </div>
    </div>
  );
}

export function CopyOrderButton({ order, className }: { order: AdminOrder; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(orderDetailsText(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Order details copied.");
    } catch {
      toast.error("Couldn't copy, your browser blocked it.");
    }
  }

  return (
    <button
      type="button"
      onClick={copyDetails}
      aria-label={copied ? "Order details copied" : "Copy order details"}
      title="Copy order details"
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 text-xs font-semibold text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95",
        copied && "border-success/40 text-success",
        className,
      )}
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function WhatsAppButton({ order, className }: { order: AdminOrder; className?: string }) {
  return (
    <a
      href={whatsAppLink(order.contactPhone, whatsAppConfirmation(order))}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-full bg-success-soft px-3 text-xs sm:text-sm font-semibold text-success outline-none transition hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95",
        className,
      )}
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}

export function WhatsAppRestaurantButton({ order, className }: { order: AdminOrder; className?: string }) {
  if (!order.restaurantPhone) return null;
  return (
    <a
      href={whatsAppLink(order.restaurantPhone, whatsAppRestaurantConfirmation(order))}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex h-10 items-center justify-center gap-1.5 rounded-full bg-primary/10 px-3 text-xs sm:text-sm font-semibold text-primary outline-none transition hover:bg-primary/20 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95",
        className,
      )}
    >
      <MessageCircle className="size-4 shrink-0" aria-hidden="true" />
      <span>Restaurant</span>
    </a>
  );
}

/** Confirm → Mark delivered, plus Cancel for active orders. Renders delete once the order is finished. */
export function OrderActions({
  order,
  status,
  onStatusChange,
  onDeleted,
  className,
}: {
  order: AdminOrder;
  status: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  /** Called after a successful delete so the parent can remove the card / redirect. */
  onDeleted?: () => void;
  className?: string;
}) {
  const [advancing, startAdvance] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, startCancel] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();

  const label = advanceLabel(status);
  const isFinalStep = nextStatus(status) === "delivered";
  // Cancel is available before and after confirmation for any active order.
  // (once delivered or cancelled, an order is terminal).
  const cancellable = status !== "delivered" && status !== "cancelled";
  // Delete only on terminal orders — active orders would strand the student's
  // live tracking page.
  const deletable = status === "delivered" || status === "cancelled";

  function advance() {
    startAdvance(async () => {
      const result = await advanceOrderStatus(order.id, status);
      if (result.ok) {
        onStatusChange(nextStatus(status) ?? status);
        toast.success(isFinalStep ? "Order marked delivered." : status === "pending" ? "Order confirmed with restaurant." : "Order status updated.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmCancel() {
    startCancel(async () => {
      const result = await cancelOrder(order.id, status);
      if (result.ok) {
        onStatusChange("cancelled");
        setCancelOpen(false);
        toast.success("Order cancelled.");
      } else {
        toast.error(result.error);
      }
    });
  }

  function confirmDelete() {
    startDelete(async () => {
      const result = await deleteOrder(order.id, status);
      if (result.ok) {
        setDeleteOpen(false);
        toast.success("Order deleted.");
        onDeleted?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!label && !cancellable && !deletable) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <button
          type="button"
          disabled={advancing}
          onClick={advance}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95 disabled:opacity-70",
            isFinalStep
              ? "bg-success text-success-foreground hover:bg-success/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {advancing && <Loader2 className="size-4 animate-spin" />}
          {label}
        </button>
      )}

      {cancellable && (
        <AlertDialog open={cancelOpen} onOpenChange={(next) => (cancelling ? null : setCancelOpen(next))}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                className="flex h-11 flex-1 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95"
              />
            }
          >
            Cancel
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
              <AlertDialogDescription>
                {order.studentName}&apos;s order {formatOrderNumber(order.dailyNumber)} from{" "}
                {order.restaurantName} will be marked cancelled. This can&apos;t be undone from here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={cancelling}>Keep order</AlertDialogCancel>
              <AlertDialogAction
                disabled={cancelling}
                onClick={confirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelling && <Loader2 className="size-4 animate-spin" />}
                Cancel order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {deletable && (
        <AlertDialog open={deleteOpen} onOpenChange={(next) => (deleting ? null : setDeleteOpen(next))}>
          <AlertDialogTrigger
            render={
              <button
                type="button"
                aria-label="Delete order"
                title="Delete order"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95"
              />
            }
          >
            <Trash2 className="size-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this order?</AlertDialogTitle>
              <AlertDialogDescription>
                Order {formatOrderNumber(order.dailyNumber)} from {order.restaurantName} will be
                permanently deleted, including its items and review. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Keep order</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="size-4 animate-spin" />}
                Delete order
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
