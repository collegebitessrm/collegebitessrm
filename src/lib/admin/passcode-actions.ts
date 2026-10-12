"use server";

import { cookies } from "next/headers";
import { requireAdmin } from "./guard";
import { ADMIN_PASSCODE_COOKIE, passcodeToken, safeEqual } from "./passcode";

export type PasscodeResult = { ok: true } | { ok: false; error: string };

export async function verifyAdminPasscode(passcode: string): Promise<PasscodeResult> {
 const configured = process.env.ADMIN_PASSCODE;
 if (!configured) {
 return { ok: false, error: "Admin passcode isn't configured yet. Set ADMIN_PASSCODE and try again." };
 }
 // Only a signed-in admin can earn the cookie, and it's bound to them.
 const admin = await requireAdmin();
 if (!safeEqual(passcode, configured)) {
 return { ok: false, error: "Incorrect passcode." };
 }

 const cookieStore = await cookies();
 cookieStore.set(ADMIN_PASSCODE_COOKIE, passcodeToken(configured, admin.id), {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "lax",
 path: "/admin",
 // No maxAge — a session cookie, cleared once the browser fully closes.
 });

 return { ok: true };
}
