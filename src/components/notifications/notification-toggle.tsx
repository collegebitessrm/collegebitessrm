"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, Loader2 } from "@/components/icons";
import { disablePush, enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * On/off switch for order notifications — confirmed, delivered, cancelled.
 * Reads the browser's real state on mount rather than trusting a stored
 * flag: permission can be revoked in browser settings, and a subscription
 * belongs to this one browser.
 */
export function NotificationToggle() {
  const [on, setOn] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();

  // Async so the first setState isn't synchronous in the effect body, and
  // so the server-rendered "off" state hydrates before the real answer.
  useEffect(() => {
    let alive = true;
    (async () => {
      const has = await hasPushSubscription();
      if (!alive) return;
      const state = pushState();
      setBlocked(state === "denied" || state === "unsupported" || state === "ios-needs-install");
      setOn(has);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function toggle() {
    startTransition(async () => {
      const result = on ? await disablePush() : await enablePush();
      if (result.ok) {
        setOn(!on);
        toast.success(on ? "Order notifications off." : "Order notifications on.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Order notifications"
      disabled={pending || (blocked && !on)}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-60",
        on ? "bg-primary" : "bg-secondary",
      )}
    >
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full bg-white text-primary shadow transition-transform",
          on ? "translate-x-7" : "translate-x-1",
        )}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : on ? (
          <Bell className="size-3.5" aria-hidden="true" />
        ) : (
          <BellOff className="size-3.5" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
