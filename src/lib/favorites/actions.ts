"use server";

import { isUuid } from "@/lib/ids";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export type SetLikedResult = { ok: true } | { ok: false; error: string };

/**
 * Hearts or un-hearts a dish for the signed-in student (their own
 * public.favorite_dishes row — RLS is the boundary). Idempotent: hearting
 * twice or un-hearting something not hearted both just succeed.
 */
export async function setDishLiked(dishId: string, liked: boolean): Promise<SetLikedResult> {
  if (!isUuid(dishId)) return { ok: false, error: "Couldn't find that dish." };
  const { user, profile } = await getSessionProfile();
  if (!user || !profile) return { ok: false, error: "Looks like you got signed out. Sign in again to save hearts." };

  const supabase = await createClient();
  const { error } = liked
    ? await supabase.from("favorite_dishes").upsert(
        { user_id: user.id, dish_id: dishId },
        { onConflict: "user_id,dish_id", ignoreDuplicates: true },
      )
    : await supabase.from("favorite_dishes").delete().eq("user_id", user.id).eq("dish_id", dishId);
  if (error) return { ok: false, error: liked ? "Couldn't save that heart. Try again?" : "Couldn't remove that heart. Try again?" };

  // No revalidatePath: in this Next.js a revalidating action re-renders the
  // current page in the same round trip, i.e. the whole menu per heart.
  // Profile and Home are dynamic and fetch fresh when opened; HeartButton
  // remembers taps for the session so a Back to the menu stays right.
  return { ok: true };
}
