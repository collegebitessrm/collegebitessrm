import Link from "next/link";
import { ArrowLeft, BarChart } from "@/components/icons";
import { adminPill } from "@/components/admin/styles";
import { getAdminRestaurants, getRestaurantStats } from "@/lib/data/admin";
import { RestaurantStatsGrid } from "@/components/admin/restaurant-stats";

export default async function AdminAnalyticsPage() {
  const [restaurants, stats] = await Promise.all([
    getAdminRestaurants(),
    getRestaurantStats(),
  ]);

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Link href="/admin" className={adminPill}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <BarChart className="size-5 text-primary" />
        <h1 className="font-heading text-headline font-bold">Analytics</h1>
      </div>

      <RestaurantStatsGrid restaurants={restaurants} stats={stats} />
    </>
  );
}