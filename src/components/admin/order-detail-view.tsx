"use client";

import { useRouter } from "next/navigation";
import { Phone, Star } from "@/components/icons";
import type { AdminOrderDetail } from "@/lib/data/admin";
import { deliveryWindow, formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { itemLine } from "@/lib/orders/admin-text";
import { formatOrderNumber, statusBadge } from "@/lib/orders/status";
import { formatStoredMobile } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { CopyOrderButton, OrderActions, useOrderStatus, WhatsAppButton, WhatsAppRestaurantButton } from "./order-card";

/** Everything about one order, for /admin/orders/[id] — opened by tapping an order card. */
export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
 const router = useRouter();
 const [status, setStatus] = useOrderStatus(order.status);
 const badge = statusBadge(status);
 const slot = deliveryWindow(order.createdAt, order.deliveryMinutes);

 return (
 <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
 <div>
 <div className="flex flex-wrap items-center gap-3">
 <h1 className="font-heading text-headline font-bold tabular-nums">
 Order {formatOrderNumber(order.dailyNumber)}
 </h1>
 <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", badge.className)}>{badge.label}</span>
 </div>
 <p className="mt-1 text-muted-foreground">
 {order.restaurantName} · {formatRupees(order.totalAmount)}
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
 </Section>

 <Section title="Student">
 <div className="flex items-center gap-2">
 <p className="text-lg font-semibold">{order.studentName}</p>
 {order.studentBanned && (
 <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">Banned</span>
 )}
 </div>
 <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
 <Fact label="Phone" value={formatStoredMobile(order.contactPhone)} />
 {order.studentRegistrationNumber && <Fact label="Registration number" value={order.studentRegistrationNumber} />}
 {order.studentEmail && <Fact label="Email" value={order.studentEmail} />}
 </dl>
 <div className="mt-4 flex flex-wrap items-center gap-2">
 <a
 href={`tel:${order.contactPhone}`}
 className="flex h-10 items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <Phone className="size-4" aria-hidden="true" />
 Call
 </a>
 <WhatsAppButton order={order} />
 <WhatsAppRestaurantButton order={order} />
 <CopyOrderButton order={order} />
 </div>
 </Section>

 <Section title={`From ${order.restaurantName}`}>
 <ul className="divide-y">
 {order.items.map((item, i) => {
 const detail = order.itemDetails[i];
 return (
 <li key={i} className="flex items-start justify-between gap-3 py-2.5 first:pt-0">
 <div className="min-w-0">
 <p className="font-medium">{itemLine(item)}</p>
 <p className="text-sm text-muted-foreground tabular-nums">
 {detail ? `${formatRupees(detail.unitPrice)} each` : null}
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
 {order.discountOffer && (
 <div className="mt-2 flex items-center justify-between gap-3 border-t pt-3 font-semibold text-success">
 <span>Offer · {OFFERS[order.discountOffer].title}</span>
 <span className="shrink-0 tabular-nums">−{formatRupees(order.discountAmount)}</span>
 </div>
 )}
 <div className="mt-2 flex items-center justify-between border-t pt-3">
 <span className="font-semibold">Total · pay on delivery</span>
 <span className="font-heading text-xl font-bold tabular-nums">{formatRupees(order.totalAmount)}</span>
 </div>
 {order.notes && (
 <div className="mt-3 rounded-2xl bg-secondary px-3.5 py-3">
 <p className="text-label text-muted-foreground">Student&apos;s note</p>
 <p className="mt-0.5 text-sm">{order.notes}</p>
 </div>
 )}
 </Section>

 {order.review && (
 <Section title="Review">
 <p className="text-sm text-muted-foreground">Rated {formatOrderTimestamp(order.review.createdAt)}. Stars are shown per dish above.</p>
 {order.review.note && <p className="mt-2">“{order.review.note}”</p>}
 </Section>
 )}

 <OrderActions order={order} status={status} onStatusChange={setStatus} onDeleted={() => router.push("/admin/history")} />
 </div>
 );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
 return (
 <section className="rounded-3xl border bg-card p-4 shadow-card sm:p-5">
 <h2 className="mb-3 font-heading text-title font-bold">{title}</h2>
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
