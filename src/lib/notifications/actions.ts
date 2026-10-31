"use server";

import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type PushActionResult = { ok: true } | { ok: false; error: string };

/** What the browser hands us from PushSubscription.toJSON(). */
export type PushSubscriptionInput = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

/**
 * Remembers one device so order updates can reach it. Rows are keyed by
 * endpoint (the browser's own address for this device), so re-subscribing
 * on the same device updates that row rather than piling up duplicates —
 * a browser can hand back the same endpoint with rotated keys.
 *
 * RLS only lets a student write their own rows; this just fails early
 * with a friendly message when there's no session.
 */
export async function saveSubscription(
  subscription: PushSubscriptionInput,
  userAgent?: string,
): Promise<PushActionResult> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return { ok: false, error: "Sign in again to turn on notifications." };

  const endpoint = subscription?.endpoint;
  const p256dh = subscription?.keys?.p256dh;
  const auth = subscription?.keys?.auth;
  if (!endpoint || !p256dh || !auth) return { ok: false, error: "This browser didn't return a usable subscription." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent?.slice(0, 300) ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    console.error("[saveSubscription] Database upsert error:", error.message);
    return { ok: false, error: "Couldn't turn notifications on. Please try again." };
  }

  return { ok: true };
}

/** Forgets one device — the switch in Profile, or a browser that revoked permission. */
export async function removeSubscription(endpoint: string): Promise<PushActionResult> {
  const { user } = await getSessionProfile();
  if (!user) return { ok: false, error: "Sign in again to change notifications." };

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { ok: false, error: "Couldn't turn notifications off. Please try again." };

  return { ok: true };
}

/**
 * Sends a live test push notification to all subscribed admin devices to verify
 * push delivery, VAPID credentials, and service worker handling.
 */
export async function sendTestAdminAlert(): Promise<{ ok: boolean; message: string }> {
  const { user, profile } = await getSessionProfile();
  if (!user || profile?.role !== "admin") {
    return { ok: false, message: "Only administrators can send test alerts." };
  }

  const { notifyAdmins } = await import("./send");
  const result = await notifyAdmins({
    title: "🔔 Test Alert · College Bites",
    body: "Notifications are working! You will get alerted when customers place orders.",
    url: "/admin",
    tag: `test-alert-${Date.now()}`,
    urgent: true,
  });

  if (result.sent > 0) {
    return {
      ok: true,
      message: `Test alert sent to ${result.sent} device(s)! Check your phone/browser notifications.`,
    };
  }

  if (result.failed > 0) {
    return {
      ok: false,
      message: `Failed to deliver to ${result.failed} device(s). Check VAPID credentials in your environment.`,
    };
  }

  return {
    ok: false,
    message: "No active admin devices found. Please tap 'Turn on alerts' on this phone or browser first.",
  };
}
