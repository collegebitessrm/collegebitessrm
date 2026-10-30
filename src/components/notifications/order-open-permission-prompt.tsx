"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, Loader2, X } from "@/components/icons";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";

const DISMISSED_STORAGE_KEY = "cb_order_open_prompt_dismissed";
const DISMISS_COOLOFF_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Proactive permission prompt for existing & visiting students.
 * If notification permission has not been granted yet, gently prompts
 * the user to allow permission so they receive broadcasts when orders open.
 */
export function OrderOpenPermissionPrompt() {
  const [show, setShow] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // Check if browser supports notifications
    const state = pushState();
    if (state !== "default") {
      return;
    }

    // Check if dismissed recently
    try {
      const dismissedAt = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (dismissedAt) {
        const time = parseInt(dismissedAt, 10);
        if (Date.now() - time < DISMISS_COOLOFF_MS) {
          return;
        }
      }
    } catch {
      // LocalStorage error, continue
    }

    // Check if already has subscription
    let alive = true;
    hasPushSubscription().then((has) => {
      if (!alive || has) return;
      // Delay prompt slightly so entrance animations settle
      const timer = setTimeout(() => {
        if (alive) setShow(true);
      }, 1500);
      return () => clearTimeout(timer);
    });

    return () => {
      alive = false;
    };
  }, []);

  function handleDismiss() {
    setShow(false);
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  function handleAllow() {
    startTransition(async () => {
      const result = await enablePush();
      if (result.ok) {
        setShow(false);
        try {
          localStorage.removeItem(DISMISSED_STORAGE_KEY);
        } catch {
          // ignore
        }
        toast.success("🔔 Notifications on! You'll be notified as soon as orders open.");
      } else {
        toast.error(result.error);
        if (pushState() === "denied") {
          setShow(false);
        }
      }
    });
  }

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Notification permission prompt"
      className="fixed bottom-20 inset-x-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-slide-up-in"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        {/* Top glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BellRing className="size-5 text-primary animate-pulse" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1 pr-6">
            <h4 className="text-sm font-bold text-foreground">Get notified when orders open 🔔</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Never miss lunch or dinner! Allow notifications to get instantly alerted the moment kitchens start taking orders.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleAllow}
                disabled={pending}
                className="pressable inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
              >
                {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
                Allow notifications
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex h-8 items-center rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                Not now
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss notification prompt"
            className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
