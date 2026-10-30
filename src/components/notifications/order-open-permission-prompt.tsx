"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, CheckCircle2, ChevronRight, CookingPot, Loader2, Moped, Sparkle, X } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const DISMISSED_STORAGE_KEY = "cb_order_open_modal_dismissed";
const DISMISS_COOLOFF_MS = 12 * 60 * 60 * 1000; // 12 hours cooloff if dismissed

/**
 * Centered modal popup asking students to allow notifications.
 * Automatically appears when visiting or signing in if notifications
 * have not been enabled yet.
 */
export function OrderOpenPermissionPrompt() {
  const [open, setOpen] = useState(false);
  const [isIosNeedsInstall, setIsIosNeedsInstall] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;

    async function checkPermission() {
      const state = pushState();
      if (state === "unsupported") return;
      if (state === "denied") return;

      if (state === "ios-needs-install") {
        if (alive) setIsIosNeedsInstall(true);
      }

      // Check if user already dismissed recently
      try {
        const dismissedAt = localStorage.getItem(DISMISSED_STORAGE_KEY);
        if (dismissedAt) {
          const time = parseInt(dismissedAt, 10);
          if (Date.now() - time < DISMISS_COOLOFF_MS) {
            return;
          }
        }
      } catch {
        // continue
      }

      // Check if already subscribed to current key
      const subscribed = await hasPushSubscription();
      if (alive && !subscribed) {
        // Show modal smoothly after brief delay
        const timer = setTimeout(() => {
          if (alive) setOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }

    checkPermission();

    return () => {
      alive = false;
    };
  }, []);

  function handleDismiss() {
    setOpen(false);
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
        setOpen(false);
        try {
          localStorage.removeItem(DISMISSED_STORAGE_KEY);
        } catch {
          // ignore
        }
        toast.success("🔔 You're all set! We'll alert you the second orders open.");
      } else {
        toast.error(result.error);
        if (pushState() === "denied") {
          setOpen(false);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
        {/* Top Header Banner with warm gradient */}
        <div className="relative bg-gradient-to-b from-primary/20 via-primary/10 to-transparent pt-7 pb-4 px-6 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-primary/20 animate-bounce">
            <BellRing className="size-8" />
          </div>

          <DialogHeader className="mt-4 space-y-1 text-center sm:text-center">
            <DialogTitle className="text-xl font-heading font-extrabold text-foreground">
              Never Miss When Orders Open! 🍕
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed mx-auto max-w-xs">
              Kitchens fill up fast during lunch and dinner. Turn on notifications so you get an instant ping the moment orders open.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Perks list */}
        <div className="px-6 py-2 space-y-2.5">
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5 text-left border border-border/40">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Sparkle className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">Instant Opening Alerts</p>
              <p className="text-[11px] text-muted-foreground">Be first in line when ordering goes live.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5 text-left border border-border/40">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Moped className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">Live Gate 3 Arrival</p>
              <p className="text-[11px] text-muted-foreground">Know the exact minute your delivery is ready.</p>
            </div>
          </div>

          {isIosNeedsInstall && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-foreground space-y-1">
              <p className="font-bold text-primary">iPhone Users:</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Tap the <strong>Share</strong> button in Safari, tap <strong>&quot;Add to Home Screen&quot;</strong>, then open College Bites to turn on notifications.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-3 flex flex-col gap-2">
          {!isIosNeedsInstall ? (
            <button
              type="button"
              onClick={handleAllow}
              disabled={pending}
              className="pressable w-full flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-md hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BellRing className="size-4" />
              )}
              <span>Allow notifications</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full flex h-11 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-primary-foreground"
            >
              Got it
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
