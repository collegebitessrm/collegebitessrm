import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracking } from "@/components/orders/order-tracking";
import { getOrder } from "@/lib/data/orders";
import { requireProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Order details · College Bites", robots: { index: false, follow: false } };

export default async function OrderDetailPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const order = await getOrder(id, profile.id);
  if (!order) notFound();

  // ?placed=1 is added once, by the cart sheet's redirect right after a
  // successful order — it triggers the one-time success moment below.
  // Refreshing this same URL would replay it forever, so OrderTracking
  // strips the param from the address bar right after reading it.
  const query = await searchParams;
  const justPlaced = query.placed === "1";
  // ?rate=1 — set by the Orders list's "Rate" pill and Home's rating
  // pop-up, so one tap lands in the rating sheet.
  const openRating = query.rate === "1";

  // OrderTracking takes it from here — this initial fetch is also what a
  // plain page refresh re-runs, so that always works as a fallback
  // regardless of whether the Realtime subscription it sets up connects.
  return <OrderTracking initialOrder={order} justPlaced={justPlaced} openRating={openRating} />;
}
