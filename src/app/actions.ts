"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  // "local": sign out of THIS device only. Supabase's default is "global",
  // which revoked the account's sessions everywhere — signing out on a lab
  // computer logged the student out on their phone too.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
