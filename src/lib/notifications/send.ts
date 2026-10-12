import "server-only";

import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Who gets the "new order" alert. Everyone else with the admin role keeps
 * full dashboard access — this is only about which phone buzzes.
 */
export const ADMIN_ALERT_EMAILS = ["collegebitessrm@gmail.com"];

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

function configured(): boolean {
 const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
 const privateKey = process.env.VAPID_PRIVATE_KEY;
 if (!publicKey || !privateKey) return false;
 webpush.setVapidDetails(CONTACT, publicKey, privateKey);
 return true;
}

/**
 * Sends one payload to a set of devices and forgets the ones the push
 * service says are gone (404/410 — browser reinstalled, permission
 * revoked, app deleted). Never throws: a notification failing must not
 * fail the order or status change that triggered it.
 */
async function deliver(
 supabase: SupabaseClient,
 rows: SubscriptionRow[],
 payload: PushPayload,
): Promise<void> {
 if (rows.length === 0 || !configured()) return;

 const body = JSON.stringify({
 title: payload.title,
 body: payload.body,
 url: payload.url,
 tag: payload.tag,
 requireInteraction: payload.urgent === true,
 vibrate: payload.urgent ? [400, 150, 400, 150, 400] : [180, 90, 180],
 });

 const gone: string[] = [];
 await Promise.all(
 rows.map(async (row) => {
 try {
 await webpush.sendNotification(
 { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
 body,
 { TTL: 60 * 30, urgency: payload.urgent ? "high" : "normal" },
 );
 } catch (error) {
 const status = (error as { statusCode?: number }).statusCode;
 if (status === 404 || status === 410) gone.push(row.id);
 else console.error("push failed", status ?? error);
 }
 }),
 );

 if (gone.length > 0) await supabase.from("push_subscriptions").delete().in("id", gone);
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
): Promise<void> {
 const { data, error } = await supabase
 .from("push_subscriptions")
 .select("id, endpoint, p256dh, auth")
 .eq("user_id", userId);
 if (error) {
 console.error("push lookup failed", error.message);
 return;
 }
 await deliver(supabase, data ?? [], payload);
}

/**
 * Notifies the alert address(es) above — used when a student places an
 * order. The student's own session can't read anyone else's devices, so
 * this one goes through the service-role client; with no service-role key
 * configured it simply does nothing (the dashboard's own live alert still
 * works).
 */
export async function notifyAdmins(payload: PushPayload): Promise<void> {
 const supabase = createAdminClient();
 if (!supabase) {
 console.warn("SUPABASE_SERVICE_ROLE_KEY missing — admin push skipped");
 return;
 }

 const { data: admins, error: adminError } = await supabase
 .from("users")
 .select("id")
 .in("email", ADMIN_ALERT_EMAILS);
 if (adminError || !admins?.length) {
 if (adminError) console.error("admin lookup failed", adminError.message);
 return;
 }

 const { data, error } = await supabase
 .from("push_subscriptions")
 .select("id, endpoint, p256dh, auth")
 .in(
 "user_id",
 admins.map((a) => a.id),
 );
 if (error) {
 console.error("admin push lookup failed", error.message);
 return;
 }
 await deliver(supabase, data ?? [], payload);
}
