import Link from "next/link";
import { CalendarHeart, ChevronRight } from "@/components/icons";
import type { ThursdaySpecial } from "@/lib/data/restaurants";

/** Thursday-only banner nudging toward the day's special dish. */
export function ThursdayNudge({ special }: { special: ThursdaySpecial }) {
  return (
    <Link
      href={`/restaurants/${special.restaurantId}?dish=${special.dishId}`}
      transitionTypes={["nav-forward"]}
      className="pressable mt-4 flex items-center gap-3 rounded-[1.5rem] border border-pink-soft-foreground/15 bg-pink-soft p-3 pr-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-card text-pink-soft-foreground shadow-card">
        <CalendarHeart className="icon-tint-gold size-5.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-pink-soft-foreground">
        <span className="block text-sm">Thursday special</span>
        <span className="block font-semibold">
          {special.dishName} <span className="font-normal">at {special.restaurantName}</span>
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-pink-soft-foreground" aria-hidden="true" />
    </Link>
  );
}
