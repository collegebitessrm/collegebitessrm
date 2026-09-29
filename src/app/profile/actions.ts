"use server";

import { revalidatePath } from "next/cache";
import { hasActiveOrder } from "@/lib/data/orders";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_ORDER_PHONE_LOCK_MESSAGE, BANNED_PHONE_LOCK_MESSAGE } from "./phone-lock";

export type FieldActionState = { error?: string };

export async function updateFullName(
  _prev: FieldActionState,
  formData: FormData,
): Promise<FieldActionState> {
  const { user } = await getSessionProfile();
  if (!user) return { error: "Please sign in again — we lost your session." };

  const fullName = String(formData.get("fullName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (fullName.length < 2) return { error: "Enter your full name." };
  if (fullName.length > 60) return { error: "That name is too long." };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ full_name: fullName }).eq("id", user.id);
  if (error) return { error: "Couldn't save your name — please try again." };

  // Other pages (home header, etc.) read the name server-side too.
  revalidatePath("/", "layout");
  return {};
}

export async function updatePhone(
  _prev: FieldActionState,
  formData: FormData,
): Promise<FieldActionState> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return { error: "Please sign in again — we lost your session." };

  // Real enforcement lives here, not in the UI — the UI hiding the Edit
  // button is just a convenience; someone calling this action directly
  // must still be blocked.
  //
  // Banned is checked first and is permanent: bans match by live phone
  // number at order time (current_user_is_banned()), so letting a banned
  // student change their number would let them escape the ban outright.
  // The in-progress-order block alone doesn't cover this — by the time a
  // no-show gets banned, their order has already finished and that check
  // no longer applies.
  if (profile.is_banned) return { error: BANNED_PHONE_LOCK_MESSAGE };
  if (await hasActiveOrder(profile.id)) return { error: ACTIVE_ORDER_PHONE_LOCK_MESSAGE };

  const phone = normalizeIndianMobile(String(formData.get("phone") ?? ""));
  if (!phone) return { error: "Enter a valid 10-digit mobile number." };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update({ phone }).eq("id", user.id);
  if (error) return { error: "Couldn't save your number — please try again." };

  revalidatePath("/", "layout");
  return {};
}
