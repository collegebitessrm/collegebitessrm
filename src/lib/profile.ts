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
 * Reads the session via getSession() (a local cookie read) rather than
 * getUser() (a network round trip to Supabase's Auth server to
 * revalidate the JWT) — proxy.ts already made that exact network call for
 * this request, before this page ever rendered, and redirects to /login
 * if it fails. Middleware and a Server Component render are separate
 * execution contexts, so nothing here can share that result directly,
 * but re-verifying the same token a second time was pure added latency
 * with no additional security benefit — the authoritative check already
 * happened. This was the single biggest contributor to slow page loads
 * (diagnosed 2026-09-17): every authenticated page paid for two sequential
 * getUser() network round trips before even starting its own queries.
 */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

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
