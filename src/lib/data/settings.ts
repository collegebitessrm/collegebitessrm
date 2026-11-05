import "server-only";

import { cache } from "react";
import { describeOrdering, type OrderingMode, type OrderingState } from "@/lib/ordering";
import { createClient } from "@/lib/supabase/server";

/**
 * Whether students can order right now, and what to tell them if not.
 * Evaluates ordering state directly from app_settings without a redundant RPC roundtrip.
 * Cached per request with React cache() to prevent duplicate database calls.
 */
export const getOrderingState = cache(async (): Promise<OrderingState> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("ordering_mode")
    .eq("id", true)
    .single();

  if (error) throw error;
  const mode = data.ordering_mode as OrderingMode;
  return describeOrdering(mode, mode === "open");
});
