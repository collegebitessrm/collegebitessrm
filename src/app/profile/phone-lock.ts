// Shared between actions.ts (the real enforcement) and page.tsx (what the
// UI shows instead of the Edit button) so the two can never say something
// different. Not in actions.ts itself — a "use server" file may only
// export async functions, not plain values.
export const BANNED_PHONE_LOCK_MESSAGE = "Reach out to MuteBites support to sort this out.";
export const ACTIVE_ORDER_PHONE_LOCK_MESSAGE =
  "Can't change your mobile number while an order is in progress — try after it's delivered.";
