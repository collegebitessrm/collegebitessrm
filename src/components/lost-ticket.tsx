import type { ReactNode } from "react";

/**
 * The order-tracking ticket stub (see order-tracking.tsx), reused as the
 * art for the 404 and error pages — a "token" nobody can collect. Same
 * ink surface, dashed tear line and edge notches, minus the photos.
 */
export function LostTicket({ label, token, note }: { label: string; token: string; note: ReactNode }) {
  return (
    <div
      className="surface-ink shadow-elevated-glow relative w-full max-w-xs -rotate-2 overflow-hidden rounded-3xl bg-ink text-ink-foreground"
      aria-hidden="true"
    >
      <div className="px-6 pt-5 pb-4">
        <p className="text-sm text-ink-foreground/75">MuteBites · VIT-AP Main Gate</p>
      </div>
      <div className="relative h-0 border-t-2 border-dashed border-ink-foreground/20">
        <span className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full bg-background" />
        <span className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full bg-background" />
      </div>
      <div className="px-6 pt-4 pb-6">
        <p className="text-label text-ink-accent">{label}</p>
        <p className="mt-1 font-heading text-6xl leading-none font-bold">{token}</p>
        <p className="mt-3 text-sm text-ink-foreground/75">{note}</p>
      </div>
    </div>
  );
}
