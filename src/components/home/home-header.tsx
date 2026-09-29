import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { AboutMuteBitesDialog } from "@/components/home/about-mutebites-dialog";
import { TrendingDialog } from "@/components/home/trending-dialog";
import { BrandLogo } from "@/components/brand-logo";
import type { TrendingDish } from "@/lib/data/trending";
import type { TimeOfDay } from "@/lib/date";

// Each time of day gets its own ambient field (.mood-field.mood-<time> in
// globals.css) — sunrise amber, bright afternoon, rose dusk, plum night —
// plus a greeting and a hero question to match.
const MOOD: Record<TimeOfDay, { greeting: string; Icon: LucideIcon; heading: string }> = {
  morning: { greeting: "Good morning", Icon: Sunrise, heading: "Fuel up for the day?" },
  afternoon: { greeting: "Hey", Icon: Sun, heading: "What are we craving now?" },
  evening: { greeting: "Good evening", Icon: Sunset, heading: "Dinner o'clock?" },
  night: { greeting: "Hey", Icon: Moon, heading: "Late night craving?" },
};

export function HomeHeader({
  fullName,
  timeOfDay,
  trendingDishes,
}: {
  fullName: string;
  timeOfDay: TimeOfDay;
  trendingDishes: TrendingDish[];
}) {
  const { greeting, Icon, heading } = MOOD[timeOfDay];
  const firstName = fullName.trim().split(/\s+/)[0];

  return (
    // Bleeds out of main's px-6/pt-6 so the field reaches the screen edges
    // and the very top; the field itself runs past the header's bottom and
    // fades out behind whatever comes next.
    <header className="relative -mx-6 -mt-6 px-6 pt-6">
      <div
        aria-hidden="true"
        className={`mood-field mood-${timeOfDay} pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+6rem)]`}
      />
      <div className="relative flex items-center justify-between">
        <AboutMuteBitesDialog>
          <BrandLogo splashTarget className="size-12 rounded-2xl shadow-card" />
        </AboutMuteBitesDialog>
        <TrendingDialog dishes={trendingDishes} />
      </div>
      <p className="relative mt-8 flex items-center gap-1.5 font-semibold">
        <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
        <span className="truncate">
          {greeting}, {firstName}
        </span>
      </p>
      <h1 className="relative mt-1 font-heading text-display font-bold">{heading}</h1>
    </header>
  );
}
