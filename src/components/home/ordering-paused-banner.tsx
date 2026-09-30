import type { OrderingState } from "@/lib/ordering";

/**
 * Shown on Home whenever the admin has closed ordering. Wording from
 * describeOrdering().
 */
export function OrderingPausedBanner({ ordering }: { ordering: OrderingState }) {
  return (
    <div className="surface-hero mt-6 rounded-2xl bg-hero p-5 text-hero-foreground">
      <p className="flex items-center gap-2 font-heading text-lg font-bold">
        <span className="relative flex size-4 shrink-0" aria-hidden="true">
          <span className="animate-ping-slow absolute inset-0 rounded-full bg-hero-accent/60" />
          <span className="relative size-4 rounded-full bg-hero-accent" />
        </span>
        {ordering.headline}
      </p>
      <p className="mt-1.5 text-sm text-hero-foreground/85">{ordering.detail}</p>
    </div>
  );
}
