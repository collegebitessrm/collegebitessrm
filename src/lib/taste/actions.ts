"use server";

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { AVATARS, CRAVINGS, DIETS, type TasteProfile } from "./options";

export type SaveTasteResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the student's taste profile and avatar (one upsert on their own
 * public.taste_profiles row). Checked here for a friendly message; the
 * table's checks and RLS (own row only) are the real boundary.
 */
export async function saveTasteProfile(input: TasteProfile): Promise<SaveTasteResult> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return { ok: false, error: "Looks like you got signed out. Sign in again to save this." };

  const avatar = AVATARS.some((a) => a.id === input.avatar) ? input.avatar : null;
  const spice = input.spiceLevel === null || [1, 2, 3, 4, 5].includes(input.spiceLevel) ? input.spiceLevel : undefined;
  const diet = input.diet === null || DIETS.some((d) => d.id === input.diet) ? input.diet : undefined;
  const known = new Set(CRAVINGS.map((c) => c.key));
  const cravings = Array.isArray(input.cravings) ? [...new Set(input.cravings)] : null;
  if (!avatar || spice === undefined || diet === undefined || !cravings || cravings.some((k) => !known.has(k))) {
    return { ok: false, error: "Something's off with those choices. Give it another go." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("taste_profiles").upsert(
    { user_id: user.id, avatar, spice_level: spice, diet, cravings },
    { onConflict: "user_id" },
  );
  if (error) return { ok: false, error: "Couldn't save that. Mind trying again?" };

  // The avatar shows on Home and Profile; cravings reorder Home's tiles.
  revalidatePath("/", "layout");
  return { ok: true };
}
