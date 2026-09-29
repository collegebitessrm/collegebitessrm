import type { Metadata } from "next";
import Link from "next/link";
import { LostTicket } from "@/components/lost-ticket";

export const metadata: Metadata = { title: "Not found · MuteBites" };

// Root 404 — covers unmatched URLs for signed-in visitors (signed-out ones
// are sent to /login by src/proxy.ts before they get here) and any
// notFound() call without a closer not-found.tsx, e.g. a restaurant or
// order id that doesn't exist.
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <LostTicket label="Token" token="#404" note="Nobody's coming to collect this one." />
      <h1 className="mt-10 font-heading text-headline font-bold">This page isn&apos;t on the menu</h1>
      <p className="mt-2 max-w-[20rem] text-muted-foreground">
        The link might be old, or the order or restaurant it pointed to doesn&apos;t exist.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/"
          className="pressable surface-primary flex h-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Back to restaurants
        </Link>
        <Link
          href="/orders"
          className="pressable flex h-12 items-center justify-center rounded-2xl border bg-card font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Your orders
        </Link>
      </div>
    </main>
  );
}
