import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors orders/page.tsx's layout (title, then a day heading over a card
// of compact order rows) so nothing jumps once the real history replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading your orders…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <Skeleton className="h-9 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />

        <Skeleton className="mt-7 h-4 w-16" />
        <div className="mt-2 divide-y rounded-3xl border bg-card shadow-card">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3.5 pr-3 pl-4">
              <Skeleton className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="mt-2 h-3.5 w-3/4" />
                <Skeleton className="mt-1.5 h-3 w-1/2" />
              </div>
              <Skeleton className="size-10 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </ViewTransition>
    </main>
  );
}
