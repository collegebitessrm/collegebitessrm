// Discount offers the admin switches on from the dashboard
// (app_settings.offer_pct10 / offer_pct20 / offer_biryani). A student picks
// at most one per order in the cart. public.place_order() is the real rule
// (it re-checks the offer is on and the order qualifies, and computes the
// discount itself); this file mirrors it so the cart can show the numbers
// before the order is placed — change the two together.

export type OfferKey = "pct10" | "pct20" | "biryani";

export const OFFER_KEYS: OfferKey[] = ["pct10", "pct20", "biryani"];

export const OFFERS: Record<OfferKey, { title: string; short: string; detail: string }> = {
  pct10: { title: "10% off", short: "10% off", detail: "On your whole order" },
  pct20: { title: "20% off", short: "20% off", detail: "On your whole order" },
  biryani: {
    title: "Buy 3 Full biryanis, get 1 Single free",
    short: "Free Single biryani",
    detail: "Pick any Single biryani for every 3 Full ones",
  },
};

/** How many paid Full biryanis earn one free Single. */
export const FULLS_PER_FREE = 3;

/** A Single biryani a student can pick for free (Biryani Nation's naming). */
export type FreeChoice = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  name: string;
  price: number;
  isAvailable: boolean;
};

/** What the cart and order pages get from the server. */
export type OffersState = { active: OfferKey[]; freeChoices: FreeChoice[] };

export const NO_OFFERS: OffersState = { active: [], freeChoices: [] };

export function isOfferKey(value: unknown): value is OfferKey {
  return typeof value === "string" && (OFFER_KEYS as string[]).includes(value);
}

/** Same patterns as place_order(): "… Biryani (Full)" / "… Biryani (Single)". */
export const isFullBiryani = (name: string) => / Biryani \(Full\)$/.test(name);
export const isSingleBiryani = (name: string) => / Biryani \(Single\)$/.test(name);

/** Free Singles the cart has earned: one per 3 paid Full biryanis. */
export function freeAllowance(lines: { name: string; quantity: number }[]): number {
  const fulls = lines.reduce((n, l) => n + (isFullBiryani(l.name) ? l.quantity : 0), 0);
  return Math.floor(fulls / FULLS_PER_FREE);
}

/** Full biryanis still needed for the next free Single. */
export function fullsToNextFree(lines: { name: string; quantity: number }[]): number {
  const fulls = lines.reduce((n, l) => n + (isFullBiryani(l.name) ? l.quantity : 0), 0);
  return FULLS_PER_FREE - (fulls % FULLS_PER_FREE);
}

/** The discount in rupees, rounded like place_order() (Postgres round(): half away from zero). */
export function discountAmount(
  offer: OfferKey | null,
  itemsTotal: number,
  freeItems: { price: number; quantity: number }[] = [],
): number {
  if (offer === "pct10") return Math.round(itemsTotal * 0.1);
  if (offer === "pct20") return Math.round(itemsTotal * 0.2);
  if (offer === "biryani") return freeItems.reduce((n, f) => n + f.price * f.quantity, 0);
  return 0;
}
