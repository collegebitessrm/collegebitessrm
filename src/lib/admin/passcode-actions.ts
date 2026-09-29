"use server";

import { cookies } from "next/headers";
import { ADMIN_PASSCODE_COOKIE } from "./passcode";

export type PasscodeResult = { ok: true } | { ok: false; error: string };

export async function verifyAdminPasscode(passcode: string): Promise<PasscodeResult> {
  const configured = process.env.ADMIN_PASSCODE;
  if (!configured) {
    return { ok: false, error: "Admin passcode isn't configured yet. Set ADMIN_PASSCODE and try again." };
  }
  if (passcode !== configured) {
    return { ok: false, error: "Incorrect passcode." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PASSCODE_COOKIE, configured, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    // No maxAge — a session cookie, cleared once the browser fully closes.
  });

  return { ok: true };
}
