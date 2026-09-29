import type { Metadata } from "next";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { ReviewsView } from "@/components/admin/reviews-view";
import { getAdminRestaurants, getAdminReviews } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Reviews · MuteBites Admin" };

export default async function AdminReviewsPage() {
  const [reviews, restaurants] = await Promise.all([getAdminReviews(), getAdminRestaurants()]);

  return (
    <>
      <div>
        <BackToDashboardLink />
        <h1 className="mt-4 font-heading text-headline font-bold">Reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Star ratings and notes students left on delivered orders — {reviews.length}{" "}
          {reviews.length === 1 ? "review" : "reviews"} so far. Only admins can see these.
        </p>
      </div>

      <ReviewsView reviews={reviews} restaurants={restaurants} />
    </>
  );
}
