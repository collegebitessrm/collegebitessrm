"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ConfettiBurst } from "@/components/orders/confetti-burst";
import { playOrderPlacedSound } from "@/lib/sound/play";
import { cn } from "@/lib/utils";

// animate-overlay-out runs --dur-base (240ms); unmount just before it ends.
const FADE_OUT_MS = 220;

/**
 * The full-screen plum "you did it" moment — order placed, milestone
 * unlocked. Mount it to play it: it chimes (respecting the Profile sound
 * toggle), bursts confetti (never under reduced motion), then fades itself
 * out after `duration` ms or on tap, and renders nothing from then on.
 *
 * The timers run once, on mount, and never depend on props — a parent
 * re-render (e.g. order tracking's router.replace stripping ?placed=1)
 * must not cancel them and leave the overlay stuck open.
 *
 * Render it outside any <ViewTransition> so `fixed inset-0` covers the
 * screen rather than a transformed ancestor.
 */
export function CelebrationOverlay({
  children,
  duration = 1800,
  confettiOnceKey,
  onDone,
}: {
  /** The moment's content: art, headline, detail. Sits on `bg-ink`. */
  children: ReactNode;
  /** How long it stays up before fading out, in ms. */
  duration?: number;
  /** When set, confetti plays only the first time this localStorage key is seen on this device. */
  confettiOnceKey?: string;
  onDone?: () => void;
}) {
  const [phase, setPhase] = useState<"in" | "out" | "hidden">("in");
  const [showConfetti, setShowConfetti] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });
  const finishedRef = useRef(false);
  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("hidden");
    onDoneRef.current?.();
  };

  useEffect(() => {
    playOrderPlacedSound();
    // Deferred a tick (not called synchronously in the effect body) so this
    // one-time browser-only check doesn't trigger a same-render setState.
    const toConfetti = setTimeout(() => {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        if (confettiOnceKey) {
          if (localStorage.getItem(confettiOnceKey)) return;
          localStorage.setItem(confettiOnceKey, "1");
        }
        setShowConfetti(true);
      } catch {
        // Storage unavailable (private mode) — skip the confetti, the rest of the moment still shows.
      }
    }, 0);
    const toOut = setTimeout(() => setPhase("out"), duration);
    const toHidden = setTimeout(finish, duration + FADE_OUT_MS);
    return () => {
      clearTimeout(toConfetti);
      clearTimeout(toOut);
      clearTimeout(toHidden);
    };
    // Deliberately mount-only — see the doc comment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      role="status"
      onClick={finish}
      className={cn(
        "fixed inset-0 z-[90] flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center text-ink-foreground",
        phase === "out" ? "animate-overlay-out" : "animate-overlay-in",
      )}
    >
      <span
        aria-hidden="true"
        className="animate-ping-slow pointer-events-none absolute size-56 rounded-full bg-ink-accent/25 blur-3xl"
      />
      {showConfetti && <ConfettiBurst />}
      <div className="relative flex flex-col items-center">{children}</div>
      <p className="relative mt-6 text-sm text-ink-foreground/50">Tap to continue</p>
    </div>
  );
}
