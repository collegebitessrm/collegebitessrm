// Campus ordering is a plain Open / Closed switch the admin flips from the
// dashboard (app_settings.ordering_mode) — there is no daily schedule.
// public.ordering_is_open() is the real enforcement (place_order() refuses
// with 'ordering_paused' while Closed); this only drives what the UI says.

export type OrderingMode = "open" | "closed";

export type OrderingState = {
 /** Can a student place an order right now (what place_order() will allow). */
 open: boolean;
 mode: OrderingMode;
 /** Short chip text when closed ("Closed"). Empty when open. */
 short: string;
 /** One-line headline when closed. Empty when open. */
 headline: string;
 /** A sentence of context under the headline. Empty when open. */
 detail: string;
};

/**
 * What to show for ordering right now. `open` comes from the database
 * (public.ordering_is_open()) so the UI can never disagree with what
 * place_order() will actually allow; the wording is derived here.
 */
export function describeOrdering(mode: OrderingMode, open: boolean): OrderingState {
 if (open) return { open, mode, short: "", headline: "", detail: "" };
 return {
 open,
 mode,
 short: "Closed",
 headline: "Ordering is closed right now",
 detail: "Menus stay open for browsing. Check back in a bit.",
 };
}
