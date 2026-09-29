import "server-only";

import { cookies } from "next/headers";

// Scoped to /admin only — this cookie has no purpose anywhere else.
export const ADMIN_PASSCODE_COOKIE = "admin_passcode_ok";

/**
 * A second check on top of requireAdmin(), not instead of it: even a
 * signed-in admin has to know a separate passcode before /admin renders
 * anything. The passcode lives only in the ADMIN_PASSCODE env var — never
 * hardcoded, never in git. If it isn't set, this fails closed (no access)
 * rather than silently skipping the check.
 */
export async function isAdminPasscodeVerified(): Promise<boolean> {
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured) return false;

  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_PASSCODE_COOKIE)?.value === configured;
}
