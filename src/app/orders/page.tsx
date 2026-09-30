import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { ArrowRight, ChevronRight, RotateCcw, Star } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { EmptyState } from "@/components/empty-state";
import { TabBar } from "@/components/nav/tab-bar";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { getOrderHistory, type OrderSummary } from "@/lib/data/orders";
import { formatDayHeading, formatTime, istDayKey } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { NAV_TRANSITION, REVEAL_ENTER } from "@/lib/nav-transition";
import { formatOrderNumber, isActiveStatus } from "@/lib/orders/status";
import { requireProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Your orders · College Bites", robots: { index: false, follow: false } };

/*
 * Orders still on their way are pinned in an "In progress" section with a
 * clear Track button; everything else is grouped by IST day ("Today",
 * "Yesterday", "Wed 17 Sep") as compact rows inside one card per day, so a
 * long history reads as a timeline instead of 30 identical cards that all
 * say "Today,".
 */
export default async function OrdersPage() {
  const profile = await requireProfile();
  const orders = await getOrderHistory(profile.id);

  const inProgress = orders.filter((o) => isActiveStatus(o.status));
  const past = orders.filter((o) => !isActiveStatus(o.status));
  const days: { key: string; heading: string; orders: OrderSummary[] }[] = [];
  for (const order of past) {
    const key = istDayKey(order.createdAt);
    const day = days.at(-1);
    if (day?.key === key) day.orders.push(order);
    else days.push({ key, heading: formatDayHeading(order.createdAt), orders: [order] });
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28">
      <ViewTransition {...NAV_TRANSITION}>
        <ViewTransition {...REVEAL_ENTER}>
          <h1 className="font-heading text-headline font-bold">Your orders</h1>
          <p className="mt-1 text-muted-foreground">
            {orders.length === 0
              ? "No orders yet"
              : `${orders.length} ${orders.length === 1 ? "order" : "orders"} · all handed over at the gate`}
          </p>

          {orders.length === 0 && <EmptyOrders />}

          {inProgress.length > 0 && (
            <section aria-labelledby="in-progress" className="mt-6">
              <h2 id="in-progress" className="text-label text-muted-foreground">
                In progress
              </h2>
              <ul className="mt-2 flex flex-col gap-3">
                {inProgress.map((order) => (
                  <li key={order.id}>
                    <ActiveOrderCard order={order} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {days.map((day) => (
            <section key={day.key} aria-labelledby={`day-${day.key}`} className="mt-7">
              <h2 id={`day-${day.key}`} className="flex items-baseline justify-between">
                <span className="text-label text-muted-foreground">{day.heading}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {day.orders.length} {day.orders.length === 1 ? "order" : "orders"}
                </span>
              </h2>
              <ul className="mt-2 divide-y rounded-3xl border bg-card shadow-card">
                {day.orders.map((order) => (
                  <PastOrderRow key={order.id} order={order} />
                ))}
              </ul>
            </section>
          ))}
        </ViewTransition>
      </ViewTransition>

      <TabBar />
    </main>
  );
}

function EmptyOrders() {
  return (
    <EmptyState
      art="plates"
      title="No orders yet"
      action={
        <Link
          href="/"
          className="pressable flex h-14 items-center rounded-2xl bg-primary px-8 text-lg font-bold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Order something
        </Link>
      }
    >
      Your first order shows up right here, start to finish.
    </EmptyState>
  );
}

/** First dish in the order that has a photo, if any. */
function orderPhoto(order: OrderSummary): string | undefined {
  for (const dish of order.dishNames) {
    const photo = getDishPhoto(order.restaurantName, dish);
    if (photo) return photo;
  }
}

function OrderThumb({ order, className }: { order: OrderSummary; className?: string }) {
  const photo = orderPhoto(order);
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-pink-soft font-heading font-bold text-pink-soft-foreground/60",
        className,
      )}
    >
      {photo ? (
        <BlurImage src={photo} alt="" sizes="64px" className="object-cover" />
      ) : (
        <span aria-hidden="true">{order.restaurantName.trim().charAt(0)}</span>
      )}
    </span>
  );
}

function ActiveOrderCard({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      transitionTypes={["nav-forward"]}
      className="pressable block rounded-3xl border border-primary/40 bg-card p-4 shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <div className="flex gap-3.5">
        <OrderThumb order={order} className="size-16 rounded-2xl text-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-heading text-lg font-bold">{order.restaurantName}</p>
            <p className="shrink-0 font-heading text-lg font-bold tabular-nums">
              {formatRupees(order.totalAmount)}
            </p>
          </div>
          <p className="truncate text-sm">{order.itemsSummary}</p>
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {formatDayHeading(order.createdAt)}, {formatTime(order.createdAt)} · Token{" "}
            <span className="font-semibold text-foreground">{formatOrderNumber(order.dailyNumber)}</span>
          </p>
        </div>
      </div>
      <span className="mt-3.5 flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
        Track order <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function PastOrderRow({ order }: { order: OrderSummary }) {
  const delivered = order.status === "delivered";
  // Rateable orders open straight into the rating sheet (?rate=1).
  const href = order.rateable ? `/orders/${order.id}?rate=1` : `/orders/${order.id}`;

  return (
    <li className="flex items-center gap-2 pr-3">
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-3xl py-3.5 pl-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/80 focus-visible:ring-inset"
      >
        <OrderThumb order={order} className={cn("size-14 rounded-xl text-xl", !delivered && "grayscale")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold">{order.restaurantName}</p>
            <p className="shrink-0 font-heading font-bold tabular-nums">{formatRupees(order.totalAmount)}</p>
          </div>
          <p className="truncate text-sm text-muted-foreground">{order.itemsSummary}</p>
          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
            <span className={cn("font-semibold", delivered ? "text-success" : "text-destructive")}>
              {delivered ? "Delivered" : "Cancelled"}
            </span>{" "}
            · {formatTime(order.createdAt)} · {formatOrderNumber(order.dailyNumber)}
          </p>
          {order.rateable && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              <Star className="size-3 fill-current" aria-hidden="true" />
              Rate your order
            </span>
          )}
        </div>
        {!delivered && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      </Link>
      {delivered && (
        <Link
          href={`/restaurants/${order.restaurantId}`}
          transitionTypes={["nav-forward"]}
          aria-label={`Reorder from ${order.restaurantName}`}
          title="Reorder"
          className="pressable flex size-10 shrink-0 items-center justify-center rounded-full bg-pink-soft text-pink-soft-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </Link>
      )}
    </li>
  );
}
