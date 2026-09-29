// Shared admin control styles, so every secondary action (history, users,
// back, export, reload, sign out, filters) is the same rounded pill as the
// student app's secondary buttons instead of a one-off per file.
export const adminPill =
  "flex h-10 shrink-0 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold shadow-card outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50";

/** Filled action inside an admin card — pair with a colour pair (bg-* text-*-foreground). */
export const adminAction =
  "flex h-11 items-center justify-center gap-1.5 rounded-2xl px-4 text-sm font-bold outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60";
