import Link from "next/link";
import { History, PackageX, Star, Users } from "lucide-react";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { NewOrderAlerts } from "@/components/admin/new-order-alerts";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RefreshAt } from "@/components/admin/refresh-at";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { adminPill } from "@/components/admin/styles";
import { getAdminOrders, getAdminRestaurants, getConfirmedOrderCount, getOrderCounts } from "@/lib/data/admin";
import { deliveryDue, formatShortDay, startOfTodayIST } from "@/lib/date";
import { getOrderingState } from "@/lib/data/settings";

export default async function AdminPage() {
  const [restaurants, orderCounts, ordering, orders, confirmedCount] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingState(),
    getAdminOrders(),
    getConfirmedOrderCount(),
  ]);

  const activeRestaurants = restaurants.filter((r) => r.is_active).length;

  // When the next finished order's delivery time passes and it should move
  // to history.
  const nextDropOff = orders
    .filter((o) => o.status === "delivered" || o.status === "cancelled")
    .map((o) => deliveryDue(o.createdAt, o.deliveryMinutes).getTime());

  return (
    <>
      <StatCards
        todayLabel={formatShortDay(new Date().toISOString())}
        totalOrders={orderCounts.total}
        confirmedOrders={orderCounts.confirmed}
        completedOrders={orderCounts.completed}
        activeRestaurants={activeRestaurants}
        totalRestaurants={restaurants.length}
      >
        <OrderingKillSwitch ordering={ordering} />
      </StatCards>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/history" className={adminPill}>
          <History className="size-4" aria-hidden="true" />
          Order history
        </Link>
        <Link href="/admin/users" className={adminPill}>
          <Users className="size-4" aria-hidden="true" />
          Users
        </Link>
        <Link href="/admin/reviews" className={adminPill}>
          <Star className="size-4" aria-hidden="true" />
          Reviews
        </Link>
        <Link href="/admin/sold-out" className={adminPill}>
          <PackageX className="size-4" aria-hidden="true" />
          Sold out
        </Link>
      </div>

      <NewOrderAlerts />

      <section>
        <h2 className="mb-3 font-heading text-title font-bold">Restaurants</h2>
        <RestaurantToggleList
          restaurants={restaurants}
          orderingEnabled={ordering.open}
          forcedClosed={ordering.mode === "closed"}
          closedChip="Paused"
        />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-title font-bold">Current orders</h2>
          <MarkAllDeliveredButton confirmedCount={confirmedCount} />
        </div>
        <p className="-mt-1 mb-3 text-sm text-muted-foreground">
          Orders stay here until their delivery time passes, then move to{" "}
          <Link href="/admin/history" className="font-semibold text-primary underline underline-offset-2">
            Order history
          </Link>
          . Anything still waiting on you stays until it&apos;s done.
        </p>
        <OrderList orders={orders} restaurants={restaurants} />
        <RefreshAt at={nextDropOff.length ? Math.min(...nextDropOff) : null} />
      </section>
    </>
  );
}
