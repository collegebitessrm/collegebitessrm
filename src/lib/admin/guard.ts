import "server-only";

import { redirect } from "next/navigation";
import { getSessionProfile, type Profile } from "@/lib/profile";

/**
 * For every admin page: signed out → /login, no profile yet → /welcome,
 * signed in but not an admin → / (the student home). RLS is the real
 * boundary (every admin-only table write checks public.is_admin()) — this
 * is just so a non-admin never sees the dashboard shell in the first place.
 */
export async function requireAdmin(): Promise<Profile> {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/welcome");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
