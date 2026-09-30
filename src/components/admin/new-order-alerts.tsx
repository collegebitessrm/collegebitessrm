"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, BellRing, Loader2, Volume2, VolumeX } from "@/components/icons";
import { adminPill } from "@/components/admin/styles";
import { enablePush, hasPushSubscription, pushState } from "@/lib/notifications/client";
import {
  armAdminAlertSound,
  isAdminAlertSoundEnabled,
  playAdminAlertSound,
  setAdminAlertSoundEnabled,
} from "@/lib/sound/play";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Live new-order alerts on the dashboard: a Realtime subscription to
 * `orders` inserts (admins can read every row, so RLS lets this through),
 * which plays the loud alert, counts what's arrived and refreshes the list
 * in place — no waiting for someone to pull-to-refresh.
 *
 * The bell also turns on push for this device, which is what covers the
 * dashboard being closed. Browsers block sound until a real tap, so the
 * same tap arms the audio; until then the button says so.
 */
export function NewOrderAlerts() {
  const router = useRouter();
  const [pushOn, setPushOn] = useState(false);
  const [armed, setArmed] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [pending, startTransition] = useTransition();
  // Read inside the subscription callback, which is created once.
  const armedRef = useRef(false);

  // Async so the first setState isn't synchronous in the effect body.
  useEffect(() => {
    let alive = true;
    (async () => {
      const has = await hasPushSubscription();
      if (!alive) return;
      setSoundOn(isAdminAlertSoundEnabled());
      setPushOn(has);
      setBlocked(pushState() === "denied" || pushState() === "unsupported");
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-new-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        setNewCount((n) => n + 1);
        if (armedRef.current) playAdminAlertSound();
        toast.success("New order just came in.");
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function turnOn() {
    // This click is the gesture that unlocks audio — do it first, so the
    // sound works even if the permission prompt is dismissed.
    armAdminAlertSound();
    armedRef.current = true;
    setArmed(true);
    startTransition(async () => {
      const result = await enablePush();
      if (result.ok) {
        setPushOn(true);
        playAdminAlertSound();
        toast.success("Alerts on. That's how a new order will sound.");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={turnOn}
        disabled={pending || (blocked && !pushOn)}
        className={cn(adminPill, pushOn && armed && "border-success text-success")}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : pushOn && armed ? (
          <BellRing className="size-4" aria-hidden="true" />
        ) : (
          <Bell className="size-4" aria-hidden="true" />
        )}
        {pushOn && armed ? "Alerts on" : pushOn ? "Tap to arm sound" : "Turn on alerts"}
      </button>

      <button
        type="button"
        onClick={() => {
          const next = !soundOn;
          setAdminAlertSoundEnabled(next);
          setSoundOn(next);
          if (next) {
            armAdminAlertSound();
            armedRef.current = true;
            setArmed(true);
            playAdminAlertSound();
          }
        }}
        aria-pressed={soundOn}
        className={adminPill}
        aria-label={soundOn ? "Mute alert sound" : "Unmute alert sound"}
      >
        {soundOn ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
        {soundOn ? "Sound on" : "Muted"}
      </button>

      {newCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setNewCount(0);
            router.refresh();
          }}
          className={cn(adminPill, "border-primary bg-primary/10 text-primary")}
        >
          <BellOff className="size-4" aria-hidden="true" />
          {newCount} new {newCount === 1 ? "order" : "orders"} · tap to clear
        </button>
      )}
    </div>
  );
}
