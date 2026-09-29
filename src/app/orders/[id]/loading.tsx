import { Skeleton } from "@/components/ui/skeleton";

// Mirrors orders/[id]/page.tsx's layout so nothing jumps once the real
// order loads — also what shows during a manual refresh of this page.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-md px-6 pb-12" aria-busy="true">
      <span className="sr-only">Loading order…</span>

      <div className="flex items-center gap-3 pt-4 pb-2">
        <Skeleton className="size-11 rounded-full" />
      </div>

      <div className="overflow-hidden rounded-3xl bg-ink">
        <Skeleton className="m-2 mb-0 h-36 rounded-none rounded-t-[1.25rem] bg-ink-foreground/10" />
        <div className="px-6 pt-4 pb-5">
          <Skeleton className="h-4 w-44 bg-ink-foreground/10" />
        </div>
        <div className="border-t-2 border-dashed border-ink-foreground/20" />
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Skeleton className="h-4 w-28 bg-ink-foreground/10" />
              <Skeleton className="mt-2 h-12 w-24 bg-ink-foreground/10" />
            </div>
            <div className="flex flex-col items-end">
              <Skeleton className="h-4 w-24 bg-ink-foreground/10" />
              <Skeleton className="mt-1.5 h-6 w-20 bg-ink-foreground/10" />
            </div>
          </div>
          <Skeleton className="mt-5 h-10 w-full rounded-xl bg-ink-foreground/10" />
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 pb-6">
            <Skeleton className="size-7 shrink-0 rounded-full" />
            <Skeleton className="mt-0.5 h-4 w-40" />
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-2xl border bg-card shadow-card p-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border bg-card shadow-card px-5 py-4">
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-1.5 h-4 w-28" />
        </div>
        <Skeleton className="h-11 w-24 rounded-xl" />
      </div>
    </main>
  );
}
