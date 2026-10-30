"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, CheckCircle2, Loader2 } from "@/components/icons";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Interactive button inside OrderingPausedBanner.
 * Lets waiting students opt-in with one click so they are notified
 * the instant ordering is opened campus-wide by the admin.
 */
export function NotifyWhenOpenButton({ className }: { className?: string }) {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    (async () => {
      const state = pushState();
      if (state === "unsupported") {
        if (alive) setSupported(false);
        return;
      }
      const has = await hasPushSubscription();
      if (alive) {
        setSubscribed(has);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (!supported) return null;

  function handleSubscribe() {
    startTransition(async () => {
      const result = await enablePush();
      if (result.ok) {
        setSubscribed(true);
        toast.success("🔔 You're on the list! We'll alert you the second orders open.");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (subscribed) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-primary-foreground/20 px-3.5 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm",
          className,
        )}
      >
        <CheckCircle2 className="size-4 text-primary-foreground shrink-0" aria-hidden="true" />
        <span>You&apos;ll be notified when orders open</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSubscribe}
      disabled={pending}
      className={cn(
        "pressable inline-flex items-center gap-2 rounded-full bg-primary-foreground text-primary px-4 py-2 text-xs font-bold shadow-md hover:bg-primary-foreground/90 transition-all focus-visible:ring-2 focus-visible:ring-primary-foreground disabled:opacity-70",
        className,
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <BellRing className="size-3.5 text-primary animate-pulse" aria-hidden="true" />
      )}
      <span>Notify me when orders open</span>
    </button>
  );
}
