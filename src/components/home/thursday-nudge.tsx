import Link from "next/link";
import { CalendarHeart, ChevronRight } from "@/components/icons";
import type { ThursdaySpecial } from "@/lib/data/restaurants";

/** Thursday-only banner nudging toward the day's special dish. */
export function ThursdayNudge({ special }: { special: ThursdaySpecial }) {
  return (
    <Link
      href={`/restaurants/${special.restaurantId}?dish=${special.dishId}`}
      transitionTypes={["nav-forward"]}
      className="pressable mt-4 flex items-center gap-3 rounded-2xl border border-pink-soft-foreground/15 bg-pink-soft px-4 py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <CalendarHeart className="size-5 shrink-0 text-pink-soft-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-pink-soft-foreground">
        <span className="font-semibold">{special.dishName}</span> is on today at {special.restaurantName}
      </span>
      <ChevronRight className="size-4 shrink-0 text-pink-soft-foreground" aria-hidden="true" />
    </Link>
  );
}
