import type { OrderingState } from "@/lib/ordering";

/**
 * Shown on Home whenever the admin has closed ordering. Wording from
 * describeOrdering().
 */
export function OrderingPausedBanner({ ordering }: { ordering: OrderingState }) {
  return (
    <div className="surface-ink mt-6 rounded-2xl bg-ink p-5 text-ink-foreground">
      <p className="flex items-center gap-2 font-heading text-lg font-bold">
        <span className="relative flex size-4 shrink-0" aria-hidden="true">
          <span className="animate-ping-slow absolute inset-0 rounded-full bg-ink-accent/60" />
          <span className="relative size-4 rounded-full bg-ink-accent" />
        </span>
        {ordering.headline}
      </p>
      <p className="mt-1.5 text-sm text-ink-foreground/75">{ordering.detail}</p>
    </div>
  );
}
