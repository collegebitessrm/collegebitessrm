import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OrderList } from "@/components/admin/order-list";
import { getAdminOrderHistory, getAdminRestaurants } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Order history · College Bites Admin" };

export default async function AdminHistoryPage() {
  const [orders, restaurants] = await Promise.all([getAdminOrderHistory(200), getAdminRestaurants()]);

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Order history</h1>
        <p className="mt-1 text-muted-foreground">
          Recent orders placed across all restaurants, grouped by day. Tap an order for its full details.
        </p>
      </div>

      <OrderList orders={orders} restaurants={restaurants} groupByDate />
    </>
  );
}
