import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Who gets the "new order" alert. Admins with role = 'admin' or an email
 * in this list (or the ADMIN_ALERT_EMAILS env variable) will receive pushes.
 */
export const ADMIN_ALERT_EMAILS = [
  "collegebitessrm@gmail.com",
  "nagaadithya999@gmail.com",
];

/** Contact address push services use to reach us about a misbehaving sender. */
const CONTACT = `mailto:${ADMIN_ALERT_EMAILS[0]}`;

export type PushPayload = {
  title: string;
  body: string;
  /** Path opened when the notification is tapped. */
  url: string;
  /** One per order, so a later update replaces the earlier notification. */
  tag?: string;
  /** Admin alerts: stay on screen and buzz harder until dealt with. */
  urgent?: boolean;
};

type SubscriptionRow = { id: string; endpoint: string; p256dh: string; auth: string };

function cleanKey(val?: string): string | undefined {
  if (!val) return undefined;
  return val.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\s]/g, "");
}

function configured(): boolean {
  const publicKey = cleanKey(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = cleanKey(process.env.VAPID_PRIVATE_KEY);
  if (!publicKey || !privateKey) return false;
  try {
    webpush.setVapidDetails(CONTACT, publicKey, privateKey);
    return true;
  } catch (err) {
    console.error("[push:configured] setVapidDetails error:", err);
    return false;
  }
}

export type DeliverResult = { sent: number; failed: number };

/**
 * Sends one payload to a set of devices and forgets the ones the push
 * service says are gone (404/410 — browser reinstalled, permission
 * revoked, app deleted). Never throws: a notification failing must not
 * fail the order or status change that triggered it.
 */
export async function deliver(
  supabase: SupabaseClient,
  rows: SubscriptionRow[],
  payload: PushPayload,
): Promise<DeliverResult> {
  if (rows.length === 0) return { sent: 0, failed: 0 };

  if (!configured()) {
    console.error(
      "[deliver] Web Push is not configured. Missing or invalid VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY).",
    );
    return { sent: 0, failed: rows.length };
  }

  // Deduplicate rows by endpoint so no device receives duplicate pushes
  const seenEndpoints = new Set<string>();
  const uniqueRows: SubscriptionRow[] = [];
  for (const row of rows) {
    if (row.endpoint && !seenEndpoints.has(row.endpoint)) {
      seenEndpoints.add(row.endpoint);
      uniqueRows.push(row);
    }
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: payload.tag,
    requireInteraction: payload.urgent === true,
    vibrate: payload.urgent ? [400, 150, 400, 150, 400] : [180, 90, 180],
  });

  const gone: string[] = [];
  let sent = 0;
  let failed = 0;

  // Process in batches of 25 to avoid saturating network connections & function timeouts
  const BATCH_SIZE = 25;
  for (let i = 0; i < uniqueRows.length; i += BATCH_SIZE) {
    const batch = uniqueRows.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (row) => {
        try {
          await webpush.sendNotification(
            { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
            body,
            { TTL: 60 * 30, urgency: payload.urgent ? "high" : "normal" },
          );
          sent++;
        } catch (error) {
          failed++;
          const status = (error as { statusCode?: number }).statusCode;
          const errMsg = (error as { message?: string }).message || "push error";
          // Sanitize log: NEVER log the error object directly as it exposes the endpoint token
          console.error(
            `[deliver] Push to subscription ${row.id} failed with status ${status ?? "unknown"}: ${errMsg}`,
          );
          // Only 404 (Not Found) and 410 (Gone) indicate the subscription is permanently expired.
          // Temporary failures (429, 500, 502, 503) should not prune the subscription.
          if (status === 404 || status === 410) {
            gone.push(row.id);
          }
        }
      }),
    );
  }

  if (gone.length > 0) {
    console.log(`[deliver] Pruning ${gone.length} expired push subscription(s)...`);
    // Always use service-role admin client to bypass RLS and guarantee deletion
    const adminDb = createAdminClient() ?? supabase;
    const { error: pruneError } = await adminDb.from("push_subscriptions").delete().in("id", gone);
    if (pruneError) {
      console.error("[deliver] Failed to prune expired subscriptions:", pruneError.message);
    } else {
      console.log(`[deliver] Successfully pruned ${gone.length} expired subscription(s)`);
    }
  }

  return { sent, failed };
}

/**
 * Notifies one student on every device they've turned notifications on.
 * Called from admin actions, whose session can read (and prune) any
 * student's rows — see the admin policies on push_subscriptions.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<DeliverResult> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) {
    console.error("[notifyUser] push lookup failed:", error.message);
    return { sent: 0, failed: 0 };
  }
  return await deliver(supabase, data ?? [], payload);
}

/**
 * Returns user IDs of all admin accounts: checks role='admin' in public.users
 * as well as accounts matching ADMIN_ALERT_EMAILS or process.env.ADMIN_ALERT_EMAILS.
 */
export async function getAdminUserIds(supabase: SupabaseClient): Promise<string[]> {
  const envEmails = process.env.ADMIN_ALERT_EMAILS
    ? process.env.ADMIN_ALERT_EMAILS.split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];
  const alertEmails = Array.from(
    new Set([...ADMIN_ALERT_EMAILS.map((e) => e.toLowerCase()), ...envEmails]),
  );

  const { data: adminUsers, error: adminError } = await supabase
    .from("users")
    .select("id, email, role")
    .or(`role.eq.admin,email.in.(${alertEmails.map((e) => `"${e}"`).join(",")})`);

  if (adminError) {
    console.error("[getAdminUserIds] Admin user lookup failed:", adminError.message);
    return [];
  }

  return (adminUsers ?? []).map((a) => a.id);
}

/**
 * Notifies all admins when a student places an order.
 * Queries using the service-role client across all admin user devices.
 */
export async function notifyAdmins(payload: PushPayload): Promise<DeliverResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("[notifyAdmins] SUPABASE_SERVICE_ROLE_KEY missing — admin push skipped");
    return { sent: 0, failed: 0 };
  }

  const adminIds = await getAdminUserIds(supabase);
  if (!adminIds.length) {
    console.warn("[notifyAdmins] No admin users found with role='admin' or matching alert emails.");
    return { sent: 0, failed: 0 };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", adminIds);

  if (error) {
    console.error("[notifyAdmins] Admin push lookup failed:", error.message);
    return { sent: 0, failed: 0 };
  }

  if (!data || data.length === 0) {
    console.warn(
      `[notifyAdmins] Found ${adminIds.length} admin user(s), but none have registered devices in push_subscriptions. Admins must tap 'Turn on alerts' in /admin.`,
    );
    return { sent: 0, failed: 0 };
  }

  return await deliver(supabase, data, payload);
}

/**
 * Notifies ALL registered student devices across the campus that ordering is open
 * (or campus-wide announcement). Uses the service-role admin client to fetch all subscriptions.
 */
export async function notifyAllSubscribers(payload: PushPayload): Promise<{ sent: number; total: number }> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY missing — broadcast push skipped");
    return { sent: 0, total: 0 };
  }

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error || !data) {
    console.error("broadcast push lookup failed", error?.message);
    return { sent: 0, total: 0 };
  }

  if (data.length === 0) {
    return { sent: 0, total: 0 };
  }

  const result = await deliver(supabase, data, payload);
  return { sent: result.sent, total: data.length };
}
