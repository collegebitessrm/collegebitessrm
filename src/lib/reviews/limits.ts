/** Max length of a review note — mirrors the check in public.submit_review() / order_reviews.note. */
export const MAX_REVIEW_NOTE = 300;

/** Ratings stay open this long after delivery — same window public.submit_review() enforces. */
export const REVIEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
