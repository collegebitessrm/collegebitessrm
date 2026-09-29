"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { LostTicket } from "@/components/lost-ticket";

// Root error boundary for anything below the root layout. Note this
// Next.js version passes `retry` (not the older `reset`) — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md.
// In production, server errors arrive with a generic message plus a
// `digest`; we show a short slice of that digest so a student can quote it
// to support and it can be matched against the server logs.
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      {/* Error boundaries can't export metadata; React hoists this into <head>. */}
      <title>Something went wrong · MuteBites</title>
      <LostTicket
        label="Kitchen hiccup"
        token="Oops"
        note={error.digest ? `Ref ${error.digest.slice(0, 8)}` : "Something didn't load."}
      />
      <h1 className="mt-10 font-heading text-headline font-bold">Something went sideways</h1>
      <p className="mt-2 max-w-[20rem] text-muted-foreground">
        That didn&apos;t load properly. It&apos;s usually a blip — try again, and if it keeps
        happening, contact MuteBites from your profile.
      </p>
      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="surface-primary flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          <RotateCw className="size-5" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/"
          className="pressable flex h-12 items-center justify-center rounded-2xl border bg-card font-semibold outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Back to restaurants
        </Link>
      </div>
    </main>
  );
}
