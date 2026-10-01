import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { OffersCard } from "@/components/admin/offers-card";
import { getOffers } from "@/lib/data/offers";

export const metadata: Metadata = { title: "Offers · College Bites Admin" };

/**
 * Switch discount offers on and off (app_settings.offer_*). While any is
 * on, students get an "Apply discount" bar in the cart and pick one per
 * order; place_order() re-checks the offer is on and computes the discount.
 */
export default async function AdminOffersPage() {
  const { active } = await getOffers();

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Offers</h1>
        <p className="mt-1 text-muted-foreground">
          {active.length === 0
            ? "No offers on. Turn one on and students see an “Apply discount” bar in their cart."
            : `${active.length} of 3 on. Students see them in their cart and pick one per order.`}
        </p>
      </div>

      <OffersCard active={active} />

      <p className="text-sm text-muted-foreground">
        Changes apply straight away. Orders already placed keep their discount.
      </p>
    </>
  );
}
