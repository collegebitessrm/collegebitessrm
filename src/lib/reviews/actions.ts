"use server";

import { revalidatePath } from "next/cache";
import { isUuid } from "@/lib/ids";
import { createClient } from "@/lib/supabase/server";
import { MAX_REVIEW_NOTE } from "./limits";

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Rates a delivered order: one 1–5 star rating per order item plus an
 * optional note. public.submit_review() does every real check (owner,
 * delivered, within 7 days, not already reviewed, every item rated once);
 * this only shapes the call and maps its error keys to messages.
 */
export async function submitReview(input: {
  orderId: string;
  ratings: Record<string, number>;
  note: string;
}): Promise<SubmitReviewResult> {
  if (!isUuid(input.orderId)) return { ok: false, error: GENERIC_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_order_id: input.orderId,
    p_ratings: Object.entries(input.ratings).map(([order_item_id, rating]) => ({ order_item_id, rating })),
    p_note: input.note.trim() || null,
  });

  if (error) return { ok: false, error: REVIEW_ERRORS[error.message] ?? GENERIC_ERROR };

  revalidatePath(`/orders/${input.orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}

const GENERIC_ERROR = "Couldn't save your rating — mind trying again?";

// Keys raised by public.submit_review() → what the student sees.
const REVIEW_ERRORS: Record<string, string> = {
  not_authenticated: "Looks like you got signed out — sign in again to rate your order.",
  order_not_found: "We couldn't find that order.",
  not_delivered: "You can rate this once it's delivered.",
  review_window_closed: "Ratings close 7 days after delivery — this one's past that.",
  already_reviewed: "You've already rated this order.",
  note_too_long: `Keep the note under ${MAX_REVIEW_NOTE} characters.`,
  invalid_ratings: "Give every dish a star rating before submitting.",
};
