import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Scoped to /admin only — this cookie has no purpose anywhere else.
export const ADMIN_PASSCODE_COOKIE = "admin_passcode_ok";

/**
 * The cookie's value: an HMAC of the admin's user id keyed by the
 * passcode — never the passcode itself. So a copied cookie only works for
 * that admin account, and changing ADMIN_PASSCODE logs every device out.
 */
export function passcodeToken(passcode: string, userId: string): string {
  return createHmac("sha256", passcode).update(`collegebites-admin-v1:${userId}`).digest("base64url");
}

/** Constant-time string comparison (hashing first so lengths always match). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * A second check on top of requireAdmin(), not instead of it: even a
 * signed-in admin has to know a separate passcode before /admin renders
 * anything. The passcode lives only in the ADMIN_PASSCODE env var — never
 * hardcoded, never in git. If it isn't set, this fails closed (no access)
 * rather than silently skipping the check.
 */
export async function isAdminPasscodeVerified(userId: string): Promise<boolean> {
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured) return false;

  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_PASSCODE_COOKIE)?.value;
  return !!value && safeEqual(value, passcodeToken(configured, userId));
}
