import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors profile/page.tsx's layout (member card, milestone grid, details,
// settings, support, sign out) so nothing jumps once the real profile
// data replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading your profile…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <div className="rounded-3xl bg-ink p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-2xl bg-ink-foreground/10" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-40 bg-ink-foreground/10" />
              <Skeleton className="mt-2 h-4 w-32 bg-ink-foreground/10" />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-foreground/15 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-7 w-8 bg-ink-foreground/10" />
                <Skeleton className="h-3 w-16 bg-ink-foreground/10" />
              </div>
            ))}
          </div>
        </div>

        <Skeleton className="mt-7 h-7 w-32" />
        <Skeleton className="mt-1.5 h-4 w-56" />
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border px-2 pt-3.5 pb-3">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-8 h-7 w-32" />
        <div className="mt-3 divide-y rounded-2xl border bg-card shadow-card">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-2 h-5 w-40" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-8 h-7 w-24" />
        <Skeleton className="mt-3 h-28 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
      </ViewTransition>
    </main>
  );
}
