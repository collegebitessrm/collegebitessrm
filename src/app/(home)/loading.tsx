import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors page.tsx's layout (header, search, promo card, photo row,
// restaurant cards) so nothing jumps once the real data replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pt-6 pb-28" aria-busy="true">
      <span className="sr-only">Loading restaurants…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <div className="flex items-center justify-between">
          <Skeleton className="size-12 rounded-2xl" />
          <Skeleton className="size-12 shrink-0 rounded-2xl" />
        </div>
        <Skeleton className="mt-7 h-4 w-28" />
        <Skeleton className="mt-2 h-9 w-3/5" />
        <Skeleton className="mt-2.5 h-5 w-4/5" />

        <Skeleton className="mt-6 h-14 w-full rounded-full" />
        <Skeleton className="mt-5 h-[7.5rem] w-full rounded-[1.75rem]" />

        <Skeleton className="mt-9 h-6 w-44" />
        <div className="mt-3 flex gap-3 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-36 shrink-0">
              <Skeleton className="aspect-square rounded-[1.25rem]" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-20" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-8 h-6 w-52" />
        <div className="mt-4 flex flex-col gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-[1.75rem] border bg-card p-2 shadow-card">
              <Skeleton className="h-44 rounded-[1.25rem]" />
              <div className="px-3 pt-3.5 pb-2.5">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-7 w-2/3" />
                  <Skeleton className="size-10 shrink-0 rounded-full" />
                </div>
                <div className="mt-3 flex gap-1.5">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </ViewTransition>
    </main>
  );
}
