import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_TASTE, type Diet, type TasteProfile } from "@/lib/taste/options";

/**
 * The student's taste profile and avatar (public.taste_profiles), or the
 * defaults — the biryani pot and nothing answered — when they've never
 * saved one. Errors read as the defaults too, so no page breaks over it.
 * Cached per request: the Home header, the nudge and the cart all ask.
 */
export const getTasteProfile = cache(async function getTasteProfile(userId: string): Promise<TasteProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("taste_profiles")
    .select("avatar, spice_level, diet, cravings")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return EMPTY_TASTE;
  return {
    avatar: data.avatar,
    spiceLevel: data.spice_level,
    diet: data.diet as Diet | null,
    cravings: data.cravings ?? [],
  };
});

/** True once the student has placed any order — the "Finish your profile" card waits for that. */
export async function hasPlacedOrder(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .limit(1);
  if (error) return false;
  return (count ?? 0) > 0;
}
