import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "student" | "admin";
  is_banned: boolean;
  created_at: string;
};

/**
 * The signed-in auth user plus their public.users row. `profile` is null
 * for a first-time user who hasn't submitted the first-login form yet.
 * Cached per request so layouts and pages can both call it.
 *
 * Uses getUser() to contact Supabase Auth securely and avoid getSession()
 * insecure-cookie warnings in Supabase SSR. Cached with React cache() to run
 * only once per request.
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, phone, role, is_banned, created_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return { user, profile };
});

/**
 * For every student-app page: signed out → /login, no profile yet →
 * first-login form. Call it in each page (not a layout — layouts don't
 * re-run on client navigation).
 */
export async function requireProfile() {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/welcome");
  return profile;
}
