import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { DishAvailabilityList } from "@/components/admin/dish-availability-list";
import { getAdminDishes } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Sold out · MuteBites Admin" };

/**
 * Turn any dish off when the kitchen runs out, and back on when it's
 * available again. A dish marked sold out still shows on the menu — greyed
 * out, struck through and unorderable — so students can see what exists;
 * place_order() refuses it too, not just the UI.
 */
export default async function AdminSoldOutPage() {
  const dishes = await getAdminDishes();
  const soldOut = dishes.filter((d) => !d.isAvailable).length;

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Sold out</h1>
        <p className="mt-1 text-muted-foreground">
          {soldOut > 0
            ? `${soldOut} of ${dishes.length} dishes are off the menu right now.`
            : `All ${dishes.length} dishes are on sale. Tap one to mark it sold out.`}
        </p>
      </div>

      <DishAvailabilityList dishes={dishes} />
    </>
  );
}
