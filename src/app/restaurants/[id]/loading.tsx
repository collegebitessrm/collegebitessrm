import { ViewTransition } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { REVEAL_EXIT } from "@/lib/nav-transition";

// Mirrors restaurants/[id]/page.tsx's layout (hero, sheet header, sticky
// filter row, dish grid) so nothing jumps once the real menu replaces it.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md" aria-busy="true">
      <span className="sr-only">Loading menu…</span>

      <ViewTransition {...REVEAL_EXIT}>
        <Skeleton className="aspect-[16/10] w-full rounded-none" />

        <div className="relative -mt-7 rounded-t-[1.75rem] bg-background px-6">
          <div className="pt-6 pb-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-40" />
            <Skeleton className="mt-2 h-4 w-56" />
            <Skeleton className="mt-4 h-4 w-48" />
            <Skeleton className="mt-1.5 h-1.5 w-full rounded-full" />
          </div>

          <div className="flex gap-2 overflow-hidden border-b py-2.5">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
          </div>

          <Skeleton className="mt-7 h-7 w-40" />
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-square w-full rounded-3xl" />
                <Skeleton className="mt-2.5 h-4 w-4/5" />
                <Skeleton className="mt-2 h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </ViewTransition>
    </main>
  );
}
