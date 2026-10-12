import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { RestaurantsManager } from "@/components/admin/restaurants-manager";
import { getAdminRestaurantsFull } from "@/lib/data/admin";

export const metadata: Metadata = {
 title: "Restaurants · Admin · College Bites",
 robots: { index: false, follow: false },
};

export default async function AdminRestaurantsPage() {
 const restaurants = await getAdminRestaurantsFull();

 return (
 <>
 <BackToDashboardLink />
 <div className="mt-4">
 <h1 className="font-heading text-headline font-bold">Restaurants</h1>
 <p className="mt-1 text-sm text-muted-foreground">
 Add, edit, or remove partner restaurants. Changes appear on the student app immediately.
 </p>
 </div>
 <RestaurantsManager restaurants={restaurants} />
 </>
 );
}