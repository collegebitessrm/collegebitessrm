"use server";

import { redirect } from "next/navigation";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type WelcomeFormState = {
  fieldErrors?: { fullName?: string; phone?: string };
  formError?: string;
};

export async function createProfile(
  _prev: WelcomeFormState,
  formData: FormData,
): Promise<WelcomeFormState> {
  const { user, profile } = await getSessionProfile();
  if (!user) redirect("/login");
  if (profile) redirect("/");

  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const phone = normalizeIndianMobile(String(formData.get("phone") ?? ""));

  const fieldErrors: WelcomeFormState["fieldErrors"] = {};
  if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
  else if (fullName.length > 60) fieldErrors.fullName = "That name is too long.";
  if (!phone) fieldErrors.phone = "Enter a valid 10-digit mobile number.";
  if (fieldErrors.fullName || fieldErrors.phone) return { fieldErrors };

  if (!user.email) {
    return { formError: "Your Google account doesn't have an email on it — try a different one?" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("users").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    phone,
  });

  // 23505 on the primary key = the row already exists (e.g. a double
  // submit in another tab) — they're onboarded, so just continue.
  if (error && !(error.code === "23505" && error.message.includes("users_pkey"))) {
    return { formError: "Couldn't save your details — mind trying again?" };
  }

  redirect("/");
}
