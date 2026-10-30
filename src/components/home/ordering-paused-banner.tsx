import type { OrderingState } from "@/lib/ordering";
import { NotifyWhenOpenButton } from "@/components/notifications/notify-when-open-button";

/**
 * Shown on Home whenever the admin has closed ordering. Wording from
 * describeOrdering(). Includes the interactive opt-in for notifications.
 */
export function OrderingPausedBanner({ ordering }: { ordering: OrderingState }) {
  return (
    <div className="bg-primary mt-6 rounded-[1.75rem] p-5 text-primary-foreground shadow-sm">
      <div className="flex items-center gap-2 font-heading text-lg font-bold">
        <span className="relative flex size-4 shrink-0" aria-hidden="true">
          <span className="animate-ping-slow absolute inset-0 rounded-full bg-primary-accent/60" />
          <span className="relative size-4 rounded-full bg-primary-accent" />
        </span>
        <p>{ordering.headline}</p>
      </div>
      <p className="mt-1.5 text-sm text-primary-foreground/85 leading-relaxed">{ordering.detail}</p>
      <div className="mt-4 pt-3 border-t border-primary-foreground/15 flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs text-primary-foreground/80 font-medium">Want to know the instant we reopen?</span>
        <NotifyWhenOpenButton />
      </div>
    </div>
  );
}
