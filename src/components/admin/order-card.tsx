"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { getOverdueState, OverdueBadge, DelayBanner, DelayReportModal } from "@/components/admin/delay-report-modal";
import { deliveryDue } from "@/lib/date";
import { AlertCircle, Check, Copy, Loader2, MapPin, MessageCircle, PencilSimple, Trash2 } from "@/components/icons";
import { EditOrderItemsModal } from "./edit-order-items-modal";
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
import { parseDeliveryLocation } from "@/lib/orders/delivery-location";
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
  const [prevProp, setPrevProp] = useState(propStatus);
  if (propStatus !== prevProp) {
    setPrevProp(propStatus);
    setStatus(propStatus);
  }
  return [status, setStatus] as const;
}

/** One order on the admin dashboard: token, restaurant, items, total, status and actions. */
export function OrderCard({ order }: { order: AdminOrder }) {
  const [currentOrder, setCurrentOrder] = useState<AdminOrder>(order);
  const [status, setStatus] = useOrderStatus(currentOrder.status);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelayOpen, setIsDelayOpen] = useState(false);
  const { location } = parseDeliveryLocation(currentOrder.notes);
  const badge = statusBadge(status, location === "Friends PG" ? "Friends PG" : "Gate 3");
  const overdueState = getOverdueState(currentOrder);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  // First ordered dish that has a photo — same lookup as the student side.
  const photo = currentOrder.items
    .map((i) => getDishPhoto(currentOrder.restaurantName, i.dishName, i.imageUrl))
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
            <span aria-hidden="true">{currentOrder.restaurantName.trim().charAt(0)}</span>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={`/admin/orders/${currentOrder.id}`}
              className="rounded-md font-heading text-2xl leading-none font-bold tabular-nums outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:ring-3 focus-visible:after:ring-ring/80"
            >
              {formatOrderNumber(currentOrder.dailyNumber)}
              <span className="sr-only">, open order details</span>
            </Link>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", badge.className)}>{badge.label}</span>
{overdueState && <OverdueBadge state={overdueState} />}
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{formatOrderTimestamp(currentOrder.createdAt)}</p>
        </div>
      </div>

      <OrderSummaryBox
        order={currentOrder}
        onEditClick={() => setIsEditOpen(true)}
        onDelayClick={() => setIsDelayOpen(true)}
        className="mt-3"
      />

      {/* Financials & Copy Row */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</span>
          <span className="font-heading text-xl font-extrabold tabular-nums text-foreground">
            {formatRupees(currentOrder.totalAmount)}
          </span>
        </div>
        <div className="relative z-10 flex items-center gap-1.5">
          {status !== "delivered" && status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setIsDelayOpen(true)}
              aria-label={currentOrder.delayReason ? "Manage delay" : "Report delay"}
              title={currentOrder.delayReason ? "Manage delay" : "Report delay"}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold outline-none transition focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95",
                currentOrder.delayReason
                  ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300"
                  : "border-amber-200/90 bg-amber-50/80 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20",
              )}
            >
              <AlertCircle className="size-3.5" aria-hidden="true" />
              <span>{currentOrder.delayReason ? "Delayed" : "Delay"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            aria-label="Edit items and quantities"
            title="Edit items and quantities"
            className="flex h-9 items-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50/80 px-3 text-xs font-semibold text-[#FF6B00] outline-none transition hover:bg-orange-100 hover:text-[#e05f00] focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95"
          >
            <PencilSimple className="size-3.5" aria-hidden="true" />
            <span>Edit</span>
          </button>
          <CopyOrderButton order={currentOrder} />
        </div>
      </div>

      {/* WhatsApp Message Actions: Symmetrical 50/50 or full-width buttons */}
      <div className="relative z-10 mt-2.5 flex items-center gap-2">
        <WhatsAppButton order={currentOrder} className="flex-1" />
        <WhatsAppRestaurantButton order={currentOrder} className="flex-1" />
      </div>

      {/* Status Advance & Cancel Actions */}
      <OrderActions order={currentOrder} status={status} onStatusChange={setStatus} className="relative z-10 mt-2.5" />

      {/* Edit Order Items Modal */}
      <EditOrderItemsModal
        order={currentOrder}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onOrderUpdated={(updated) => setCurrentOrder(updated)}
      />

      {/* Delay Report Modal */}
      <DelayReportModal
        order={currentOrder}
        open={isDelayOpen}
        onOpenChange={setIsDelayOpen}
        onDelayUpdated={(delayData) => setCurrentOrder((prev) => ({ ...prev, ...delayData }))}
      />
    </div>
  );
}

/** "From <restaurant>", one "Dish - qty" line per dish with its price, the note, then the student's name and number — what the copy button copies. */
export function OrderSummaryBox({
  order,
  className,
  onEditClick,
  onDelayClick,
}: {
  order: AdminOrder;
  className?: string;
  onEditClick?: () => void;
  onDelayClick?: () => void;
}) {
  const { location, cleanNotes } = parseDeliveryLocation(order.notes);
  const originalEtaIso = deliveryDue(order.createdAt, order.deliveryMinutes, order.restaurantName).toISOString();

  return (
    <div className={cn("rounded-2xl bg-secondary px-3.5 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-label text-muted-foreground">
          From <span className="font-semibold text-foreground">{order.restaurantName}</span>
        </p>
        {onEditClick && (
          <button
            type="button"
            onClick={onEditClick}
            aria-label="Edit items"
            className="relative z-10 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold text-[#FF6B00] hover:bg-orange-100/60 transition active:scale-95"
          >
            <PencilSimple className="size-3" />
            <span>Edit items</span>
          </button>
        )}
      </div>
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

      {/* Delivery location badge */}
      <div className="mt-2.5 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
        <span className="flex items-center gap-1 font-semibold text-primary">
          <MapPin className="size-3.5" />
          {location === "Friends PG" ? "Friends PG" : "SRM AP (Gate 3)"}
        </span>
        <span className="rounded-full bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Handover
        </span>
      </div>
      {order.delayReason && (
        <DelayBanner
          delayReason={order.delayReason}
          updatedEta={order.updatedEta}
          delayUpdatedAt={order.delayUpdatedAt}
          awaitingEtaConfirmation={order.awaitingEtaConfirmation}
          originalEtaIso={originalEtaIso}
          onEdit={onDelayClick}
        />
      )}

      {cleanNotes && <p className="mt-1.5 text-sm text-muted-foreground italic">“{cleanNotes}”</p>}

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

  const { location } = parseDeliveryLocation(order.notes);
  const label = advanceLabel(status, location === "Friends PG" ? "Friends PG" : "Gate 3");
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

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <button
          type="button"
          onClick={advance}
          disabled={advancing}
          className={cn(
            "flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground outline-none transition hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95 disabled:opacity-60",
            advancing && "animate-shimmer",
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
