"use client";

import { useEffect, useState } from "react";
import { X } from "@/components/icons";
import { afterSplash } from "@/components/splash/after-splash";
import { useCart } from "@/lib/cart/store";
import { answeredCount, type TasteProfile } from "@/lib/taste/options";
import { dismissTasteNudge, openTasteSheet, snoozeTasteNudge, tasteNudgeHidden, useTasteSheetOpen } from "@/lib/taste/sheet-store";

/**
 * Home's small "Finish your profile" card, floating just above the bottom
 * bar. The page only renders it once the student has placed an order and
 * hasn't answered all three taste questions. On the device: "Later" hides
 * it for 3 days, × for good (also snoozed after saving in the sheet). Not
 * shown while the cart bar holds that spot, or while the sheet is open.
 */
export function FinishProfileNudge({ taste }: { taste: TasteProfile }) {
  const cart = useCart();
  const sheetOpen = useTasteSheetOpen();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    // After the splash, and a beat after Home settles, so it reads as a
    // nudge rather than part of the page loading.
    const stop = afterSplash(() => {
      timer = setTimeout(() => {
        if (!tasteNudgeHidden()) setVisible(true);
      }, 1800);
    });
    return () => {
      stop();
      clearTimeout(timer);
    };
  }, []);

  if (!visible || sheetOpen || cart.lines.length > 0) return null;
  const answered = answeredCount(taste);

  return (
    <aside
      aria-label="Finish your profile"
      className="animate-slide-up-in fixed inset-x-0 bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+4.75rem)] z-30 mx-auto w-full max-w-md px-4"
    >
      <div className="rounded-[1.5rem] border bg-popover p-3.5 text-popover-foreground shadow-raised">
        <div className="flex items-start gap-3">
          <ProgressRing answered={answered} />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="font-semibold">Finish your profile</p>
            <p className="text-sm leading-snug text-muted-foreground">
              Pick an avatar and tell us how you like your food. {3 - answered} quick{" "}
              {3 - answered === 1 ? "tap" : "taps"}.
            </p>
          </div>
          <button
            type="button"
            aria-label="Don't show this again"
            onClick={() => {
              dismissTasteNudge();
              setVisible(false);
            }}
            className="-mt-1 -mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-2.5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              snoozeTasteNudge();
              setVisible(false);
            }}
            className="h-10 rounded-full px-4 text-sm font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Later
          </button>
          <button
            type="button"
            onClick={openTasteSheet}
            className="surface-primary h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Finish profile
          </button>
        </div>
      </div>
    </aside>
  );
}

/** "1/3" in a ring that's a third full — how much of the profile is done. */
function ProgressRing({ answered }: { answered: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-secondary" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - answered / 3)}
          className="stroke-primary"
        />
      </svg>
      <span className="font-heading text-xs font-bold tabular-nums">
        {answered}/3
        <span className="sr-only"> answered</span>
      </span>
    </span>
  );
}
