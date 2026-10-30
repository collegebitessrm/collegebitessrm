"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, BellOff, BellRing, CheckCircle2, Loader2, Sparkle } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { disablePush, enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

export function HeaderNotificationBell() {
  const [open, setOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [state, setState] = useState<string>("default");
  const [pending, startTransition] = useTransition();

  async function checkStatus() {
    const s = pushState();
    setState(s);
    if (s === "granted") {
      const has = await hasPushSubscription();
      setSubscribed(has);
    } else {
      setSubscribed(false);
    }
  }

  useEffect(() => {
    checkStatus();
  }, [open]);

  function handleEnable() {
    startTransition(async () => {
      const res = await enablePush();
      if (res.ok) {
        setSubscribed(true);
        setState("granted");
        toast.success("🔔 Notifications turned on! You'll be alerted when orders open.");
      } else {
        toast.error(res.error);
        await checkStatus();
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      const res = await disablePush();
      if (res.ok) {
        setSubscribed(false);
        setState("default");
        toast.success("Order notifications turned off.");
      } else {
        toast.error(res.error);
        await checkStatus();
      }
    });
  }

  const needsPermission = !subscribed && state !== "denied" && state !== "unsupported";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Order notifications"
        className="relative flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/80 transition-colors"
      >
        {subscribed ? (
          <Bell className="size-5 text-primary" />
        ) : (
          <Bell className="size-5" />
        )}

        {/* Attention dot when user hasn't allowed notifications yet */}
        {needsPermission && (
          <span className="absolute top-2 right-2 flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                subscribed ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
              )}
            >
              {subscribed ? (
                <CheckCircle2 className="size-6 text-success" />
              ) : (
                <BellRing className="size-6 text-primary animate-pulse" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-heading font-bold">
                {subscribed ? "Notifications Active" : "Order Notifications"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {subscribed
                  ? "You'll receive live alerts on this device."
                  : "Allow permissions to get real-time order alerts."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          <div className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3">
            <span className="text-base">🍕</span>
            <div>
              <p className="font-semibold text-xs text-foreground">Orders Open Broadcasts</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Get an instant ping the moment kitchen orders open for lunch & dinner batches.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl bg-secondary/50 p-3">
            <span className="text-base">🛵</span>
            <div>
              <p className="font-semibold text-xs text-foreground">Live Delivery Tracking</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Know the exact minute your delivery is confirmed, prepared, and dispatched.
              </p>
            </div>
          </div>

          {state === "denied" && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-semibold">Notifications are blocked</p>
              <p className="mt-0.5">
                You previously blocked notifications for this site. To turn them on, please allow notifications in your browser settings.
              </p>
            </div>
          )}

          {state === "ios-needs-install" && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-foreground">
              <p className="font-semibold">iPhone / iPad Setup</p>
              <p className="mt-0.5 text-muted-foreground">
                To receive notifications on iOS, tap the Share button in Safari, choose <strong>&quot;Add to Home Screen&quot;</strong>, then open College Bites from your Home Screen.
              </p>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          {subscribed ? (
            <button
              type="button"
              onClick={handleDisable}
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors disabled:opacity-60"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              <BellOff className="size-3.5" />
              Turn off notifications
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnable}
              disabled={pending || state === "denied" || state === "unsupported"}
              className="pressable inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md hover:brightness-110 transition-all disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <BellRing className="size-4" />
              )}
              Allow notifications
            </button>
          )}
        </div>
      </DialogContent>
      </Dialog>
    </>
  );
}
