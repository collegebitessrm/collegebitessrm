import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — bypasses RLS, so it is only ever used by
 * code that needs to read across users: sending the admin's "new order"
 * push (a student's own session can't see the admin's devices).
 *
 * Never import this from a client component, and never widen its use
 * without a good reason: every other query in the app goes through the
 * session client in ./server.ts, where RLS still applies.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't set, so a missing env
 * var degrades to "no admin push" instead of crashing an order.
 */
export function createAdminClient() {
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) return null;

 return createClient(url, key, {
 auth: { persistSession: false, autoRefreshToken: false },
 });
}
