import Link from "next/link";
import { AdminDashboardMenu } from "@/components/admin/admin-dashboard-menu";
import { MarkAllDeliveredButton } from "@/components/admin/mark-all-delivered-button";
import { NewOrderAlerts } from "@/components/admin/new-order-alerts";
import { OrderingKillSwitch } from "@/components/admin/ordering-kill-switch";
import { OrderList } from "@/components/admin/order-list";
import { RefreshAt } from "@/components/admin/refresh-at";
import { RestaurantToggleList } from "@/components/admin/restaurant-toggle-list";
import { StatCards } from "@/components/admin/stat-cards";
import { getAdminOrders, getAdminRestaurants, getConfirmedOrderCount, getOrderCounts } from "@/lib/data/admin";
import { deliveryDue, formatShortDay, startOfTodayIST } from "@/lib/date";
import { getOrderingState } from "@/lib/data/settings";
import { getOffers } from "@/lib/data/offers";

export default async function AdminPage() {
  const [restaurants, orderCounts, ordering, orders, confirmedCount, offers] = await Promise.all([
    getAdminRestaurants(),
    getOrderCounts(startOfTodayIST()),
    getOrderingState(),
    getAdminOrders(),
    getConfirmedOrderCount(),
    getOffers(),
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

      {/* Structured Admin Menu Modules */}
      <AdminDashboardMenu activeOffersCount={offers.active.length} />

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
        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
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
