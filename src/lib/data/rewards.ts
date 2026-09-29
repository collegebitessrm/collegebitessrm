import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * When the student's free biryani (all milestones) was handed over, or
 * null if it hasn't been. Errors read as "not claimed" so the Profile page
 * never breaks over this card.
 */
export async function getMilestoneRewardClaimedAt(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("milestone_rewards")
    .select("claimed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return null;
  return data?.claimed_at ?? null;
}
