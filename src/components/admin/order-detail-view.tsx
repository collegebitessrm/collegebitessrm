"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MapPin, PencilSimple, Phone, Star } from "@/components/icons";
import type { AdminOrderDetail } from "@/lib/data/admin";
import { deliveryDue, deliveryWindow, formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { itemLine } from "@/lib/orders/admin-text";
import { formatOrderNumber, statusBadge } from "@/lib/orders/status";
import { parseDeliveryLocation } from "@/lib/orders/delivery-location";
import { formatStoredMobile } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { DelayBanner, DelayReportModal, getOverdueState, OverdueBadge } from "./delay-report-modal";
import { EditOrderItemsModal } from "./edit-order-items-modal";
import { CopyOrderButton, OrderActions, useOrderStatus, WhatsAppButton, WhatsAppRestaurantButton } from "./order-card";

/** Everything about one order, for /admin/orders/[id] — opened by tapping an order card. */
export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const [currentOrder, setCurrentOrder] = useState<AdminOrderDetail>(order);
  const [status, setStatus] = useOrderStatus(currentOrder.status);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDelayOpen, setIsDelayOpen] = useState(false);
  const { location, cleanNotes } = parseDeliveryLocation(currentOrder.notes);
  const badge = statusBadge(status, location === "Friends PG" ? "Friends PG" : "Gate 3");
  const overdueState = getOverdueState(currentOrder);
  const originalEtaIso = deliveryDue(currentOrder.createdAt, currentOrder.deliveryMinutes, currentOrder.restaurantName).toISOString();
  const slot = deliveryWindow(currentOrder.createdAt, currentOrder.deliveryMinutes, currentOrder.restaurantName);

  useEffect(() => {
    setCurrentOrder(order);
  }, [order]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-headline font-bold tabular-nums">
            Order {formatOrderNumber(currentOrder.dailyNumber)}
          </h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", badge.className)}>{badge.label}</span>
          {overdueState && <OverdueBadge state={overdueState} />}
        </div>
        <p className="mt-1 text-muted-foreground">
          {currentOrder.restaurantName} · {formatRupees(currentOrder.totalAmount)}
        </p>
      </div>

      <Section title="Timing">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Fact label="Placed" value={formatOrderTimestamp(order.createdAt)} />
          <Fact label={slot.lead} value={slot.time} />
          <Fact
            label="Delivered"
            value={order.deliveredAt ? formatOrderTimestamp(order.deliveredAt) : status === "cancelled" ? "Cancelled" : "Not yet"}
          />
        </dl>
        {currentOrder.delayReason && (
          <DelayBanner
            delayReason={currentOrder.delayReason}
            updatedEta={currentOrder.updatedEta}
            delayUpdatedAt={currentOrder.delayUpdatedAt}
            awaitingEtaConfirmation={currentOrder.awaitingEtaConfirmation}
            originalEtaIso={originalEtaIso}
            onEdit={() => setIsDelayOpen(true)}
          />
        )}
      </Section>

      <Section title="Student">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{order.studentName}</p>
          {order.studentBanned && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">Banned</span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Fact label="Phone" value={formatStoredMobile(currentOrder.contactPhone)} />
          {currentOrder.studentRegistrationNumber && <Fact label="Registration number" value={currentOrder.studentRegistrationNumber} />}
          {currentOrder.studentEmail && <Fact label="Email" value={currentOrder.studentEmail} />}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={`tel:${currentOrder.contactPhone}`}
            className="flex h-10 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <Phone className="size-4" aria-hidden="true" />
            Call
          </a>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-orange-200/90 bg-orange-50/80 px-4 text-sm font-semibold text-[#FF6B00] outline-none transition hover:bg-orange-100 hover:text-[#e05f00] focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95"
          >
            <PencilSimple className="size-4" aria-hidden="true" />
            <span>Edit items</span>
          </button>
          {status !== "delivered" && status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setIsDelayOpen(true)}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold outline-none transition focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95",
                currentOrder.delayReason
                  ? "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-300"
                  : "border-amber-200/90 bg-amber-50/80 text-amber-700 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20",
              )}
            >
              <AlertCircle className="size-4" aria-hidden="true" />
              <span>{currentOrder.delayReason ? "Update delay" : "Report delay"}</span>
            </button>
          )}
          <WhatsAppButton order={currentOrder} />
          <WhatsAppRestaurantButton order={currentOrder} />
          <CopyOrderButton order={currentOrder} />
        </div>
      </Section>

      <Section
        title={`From ${currentOrder.restaurantName}`}
        action={
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-[#FF6B00] hover:bg-orange-100/60 transition active:scale-95"
          >
            <PencilSimple className="size-3.5" />
            <span>Edit items</span>
          </button>
        }
      >
        <ul className="divide-y">
          {currentOrder.items.map((item, i) => {
            const detail = currentOrder.itemDetails?.[i];
            return (
              <li key={item.id ?? i} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
                <div className="min-w-0">
                  <p className="font-medium">{itemLine(item)}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {item.unitPrice ? `${formatRupees(item.unitPrice)} each` : detail ? `${formatRupees(detail.unitPrice)} each` : null}
                  </p>
                  {detail?.rating != null && <Stars rating={detail.rating} />}
                </div>
                <span className="shrink-0 font-semibold tabular-nums">
                  {item.isFree ? (
                    <span className="text-success">Free</span>
                  ) : (
                    formatRupees(item.subtotal)
                  )}
                </span>
              </li>
            );
          })}
        </ul>
        {currentOrder.discountOffer && (
          <div className="mt-2 flex items-center justify-between gap-3 border-t pt-3 font-semibold text-success">
            <span>Offer · {OFFERS[currentOrder.discountOffer].title}</span>
            <span className="shrink-0 tabular-nums">−{formatRupees(currentOrder.discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t pt-3">
          <span className="font-semibold">Total · pay on delivery</span>
          <span className="font-heading text-xl font-bold tabular-nums">{formatRupees(currentOrder.totalAmount)}</span>
        </div>

        {/* Delivery location badge */}
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <MapPin className="size-4 text-primary" />
            <div>
              <p className="text-label text-muted-foreground">Delivery location</p>
              <p className="mt-0.5 text-sm font-semibold">{location === "Friends PG" ? "Friends PG" : "SRM AP (Gate 3)"}</p>
            </div>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Handover</span>
        </div>

        {cleanNotes && (
          <div className="mt-2 rounded-2xl bg-secondary px-3.5 py-3">
            <p className="text-label text-muted-foreground">Student&apos;s note</p>
            <p className="mt-0.5 text-sm">{cleanNotes}</p>
          </div>
        )}
      </Section>

      {currentOrder.review && (
        <Section title="Review">
          <p className="text-sm text-muted-foreground">Rated {formatOrderTimestamp(currentOrder.review.createdAt)}. Stars are shown per dish above.</p>
          {currentOrder.review.note && <p className="mt-2">“{currentOrder.review.note}”</p>}
        </Section>
      )}

      <OrderActions order={currentOrder} status={status} onStatusChange={setStatus} onDeleted={() => router.push("/admin/history")} />

      <EditOrderItemsModal
        order={currentOrder}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onOrderUpdated={(updated) => {
          setCurrentOrder((prev) => ({
            ...prev,
            ...updated,
          }));
          router.refresh();
        }}
      />

      <DelayReportModal
        order={currentOrder}
        open={isDelayOpen}
        onOpenChange={setIsDelayOpen}
        onDelayUpdated={(updated) => {
          setCurrentOrder((prev) => ({
            ...prev,
            ...updated,
          }));
          router.refresh();
        }}
      />
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border bg-card p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-title font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-label text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <p className="mt-1 flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= rating ? "icon-solid text-primary" : "text-muted-foreground/40")}
          aria-hidden="true"
        />
      ))}
    </p>
  );
}
