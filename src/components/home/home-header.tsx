import { MoonStars, Sun, Sunrise, Sunset, type AppIcon } from "@/components/icons";
import { AboutDialog } from "@/components/home/about-dialog";
import { BrandLogo } from "@/components/brand-logo";
import type { TimeOfDay } from "@/lib/date";

// Each time of day gets its own sky (.mood-field.mood-<time> in
// globals.css) — Leonida sunrise, Vice beach afternoon, golden-hour
// evening, neon night — plus a greeting and a question to match.
const MOOD: Record<TimeOfDay, { greeting: string; Icon: AppIcon; question: string }> = {
  morning: { greeting: "Good morning", Icon: Sunrise, question: "Fuel up for the day?" },
  afternoon: { greeting: "Good afternoon", Icon: Sun, question: "What are you craving today?" },
  evening: { greeting: "Good evening", Icon: Sunset, question: "Dinner o'clock. What's it going to be?" },
  night: { greeting: "Still up", Icon: MoonStars, question: "Late-night craving?" },
};

/**
 * Home's header, over the time-of-day sky: the logo (opens About) on top,
 * then a small time-of-day line, "Hey, <name>" in
 * the sunset gradient, and the question of the hour.
 */
export function HomeHeader({
  fullName,
  timeOfDay,
}: {
  fullName: string;
  timeOfDay: TimeOfDay;
}) {
  const { greeting, Icon, question } = MOOD[timeOfDay];
  const firstName = fullName.trim().split(/\s+/)[0];

  return (
    // Bleeds out of main's px-6/pt-6 so the sky reaches the screen edges
    // and the very top; it runs past the header's bottom and fades out
    // behind whatever comes next.
    <header className="relative -mx-6 -mt-6 px-6 pt-6">
      <div
        aria-hidden="true"
        className={`mood-field mood-${timeOfDay} pointer-events-none absolute inset-x-0 top-0 h-[calc(100%+6rem)]`}
      />
      <div className="relative flex items-center justify-between">
        <AboutDialog>
          <BrandLogo className="size-12 rounded-2xl shadow-card" />
        </AboutDialog>
      </div>
      <p className="relative mt-7 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <Icon className="icon-tint-gold size-4.5 shrink-0" />
        {greeting}
      </p>
      <h1 className="relative mt-1 font-heading text-display font-bold break-words text-sunset">
        Hey, {firstName}
      </h1>
      <p className="relative mt-1.5 text-lg leading-snug">{question}</p>
    </header>
  );
}
