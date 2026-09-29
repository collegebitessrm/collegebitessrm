import "server-only";

import { createClient } from "@/lib/supabase/server";

export type WeeklyRank = {
  myOrderCount: number;
  totalStudents: number;
  rank: number;
  percentile: number;
};

type WeeklyRankRow = {
  my_order_count: number;
  total_students: number;
  rank: number;
  percentile: number;
};

/**
 * The signed-in student's own rank among everyone who ordered in the last
 * 7 days, or null if they haven't ordered this week (nothing to rank).
 * Powers the profile's "Top N%" badge.
 */
export async function getMyWeeklyRank(): Promise<WeeklyRank | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_weekly_rank");

  if (error) throw error;
  const row = ((data ?? []) as WeeklyRankRow[])[0];
  if (!row) return null;

  return {
    myOrderCount: row.my_order_count,
    totalStudents: row.total_students,
    rank: row.rank,
    percentile: row.percentile,
  };
}
