import Link from "next/link";
import { CalendarHeart, ChevronRight } from "lucide-react";
import type { ThursdaySpecial } from "@/lib/data/restaurants";

/** Thursday-only banner nudging toward the day's special dish. */
export function ThursdayNudge({ special }: { special: ThursdaySpecial }) {
  return (
    <Link
      href={`/restaurants/${special.restaurantId}?dish=${special.dishId}`}
      transitionTypes={["nav-forward"]}
      className="pressable mt-4 flex items-center gap-3 rounded-2xl border border-brand-soft-foreground/15 bg-brand-soft px-4 py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <CalendarHeart className="size-5 shrink-0 text-brand-soft-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-brand-soft-foreground">
        <span className="font-semibold">{special.dishName}</span> is on today at {special.restaurantName}
      </span>
      <ChevronRight className="size-4 shrink-0 text-brand-soft-foreground" aria-hidden="true" />
    </Link>
  );
}
