"use client";

import { useEffect, useState } from "react";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { afterSplash } from "@/components/splash/after-splash";
import { cn } from "@/lib/utils";
import { MILESTONES, type MilestoneKey } from "./milestone-badges";

const SEEN_KEY = "mutebites.milestones-seen";

const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

/**
 * Plays the full-screen celebration (same one as "Order placed!") the
 * first time a milestone badge is newly unlocked, remembered per device in
 * localStorage (not tied to the account, same as the confetti-shown flag).
 * Several unlocked at once share one overlay that names them all. On a
 * student's very first visit after this shipped, any milestone already
 * unlocked gets celebrated even though it isn't "new" — a one-time false
 * positive that isn't worth guarding against.
 *
 * Mount it outside the page's <ViewTransition> so the overlay covers the
 * whole screen.
 */
export function MilestoneUnlockWatcher({ unlockedCsv }: { unlockedCsv: string }) {
  const [celebrating, setCelebrating] = useState<MilestoneKey[]>([]);

  useEffect(() => {
    // Deferred (a tick, or until the startup splash has cleared) so the
    // setState isn't synchronous in the effect body and the moment isn't
    // spent hidden under the splash. Reading and writing storage both
    // happen inside the callback, so a Strict Mode double-run (which
    // cancels it) can't mark milestones seen without also celebrating them.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopWaiting = afterSplash(() => {
      timer = setTimeout(celebrateNew, 0);
    });
    function celebrateNew() {
      const unlocked = unlockedCsv ? (unlockedCsv.split(",") as MilestoneKey[]) : [];

      let seen: string[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
      } catch {
        seen = [];
      }
      const seenSet = new Set(seen);
      const newlyUnlocked = unlocked.filter((key) => !seenSet.has(key));

      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked));
      } catch {
        // Storage unavailable — it still celebrates this visit, just may repeat next time.
      }

      if (newlyUnlocked.length > 0) setCelebrating(newlyUnlocked);
    }
    return () => {
      stopWaiting();
      clearTimeout(timer);
    };
  }, [unlockedCsv]);

  if (celebrating.length === 0) return null;

  const milestones = MILESTONES.filter((m) => celebrating.includes(m.key));
  const several = milestones.length > 1;

  return (
    <CelebrationOverlay duration={several ? 2600 : 2000} onDone={() => setCelebrating([])}>
      <div className="flex max-w-48 flex-wrap justify-center gap-2" aria-hidden="true">
        {milestones.map(({ key, Icon }) => (
          <span
            key={key}
            className={cn(
              "animate-pop-in flex items-center justify-center rounded-full bg-ink-foreground/10 text-ink-accent",
              several ? "size-14" : "size-20",
            )}
          >
            <Icon className={several ? "size-7" : "size-9"} />
          </span>
        ))}
      </div>
      <p className="animate-pop-in mt-5 font-heading text-2xl font-bold">
        {several ? `${milestones.length} milestones unlocked!` : "Milestone unlocked!"}
      </p>
      <p className="mt-1 text-ink-foreground/70">Added to your profile</p>
      <p
        className={cn(
          "animate-pop-in mt-4 max-w-xs font-heading font-bold tracking-tight text-balance text-ink-accent",
          several ? "text-3xl" : "text-5xl",
        )}
      >
        {listFormat.format(milestones.map((m) => m.label))}
      </p>
    </CelebrationOverlay>
  );
}
