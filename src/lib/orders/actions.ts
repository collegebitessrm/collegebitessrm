"use server";

import { after } from "next/server";
import { MAX_NOTES, MAX_QUANTITY } from "@/lib/cart/limits";
import { getRestaurantMenu } from "@/lib/data/restaurants";
import { normalizeIndianMobile } from "@/lib/phone";
import { getSessionProfile } from "@/lib/profile";
import { notifyAdmins } from "@/lib/notifications/send";
import { formatRupees } from "@/lib/format";
import { formatOrderNumber } from "@/lib/orders/status";
import { isOfferKey, type OfferKey } from "@/lib/offers";
import { createClient } from "@/lib/supabase/server";

export type PlaceOrderInput = {
  restaurantId: string;
  /** price = what the student saw, only compared — never charged. */
  lines: { dishId: string; quantity: number; price: number }[];
  notes: string;
  contactPhone: string;
  /** The discount the student picked, if any — place_order() decides if it applies. */
  offer?: OfferKey | null;
  /** The free Single biryanis picked for the "buy 3 Full" offer. */
  freeItems?: { dishId: string; quantity: number }[];
};

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | {
      ok: false;
      error: string;
      /** Dishes that are gone or sold out — the client drops them. */
      removedDishIds?: string[];
      /** Dishes whose price changed — the client updates them. */
      updatedPrices?: { dishId: string; price: number }[];
      /** The picked offer was switched off — the client drops it. */
      offerEnded?: boolean;
    };

/**
 * Everything about an order is decided here, not in the browser: prices
 * come from the menu, the restaurant must be open, every dish available,
 * and the student not banned (by phone). The cart in the browser is only
 * a list of dish ids + quantities (plus the price shown, to detect changes).
 * The write itself is public.place_order() — the only way to create orders.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { user, profile } = await getSessionProfile();
  if (!user || !profile)
    return { ok: false, error: "Looks like you got signed out. Sign in again to place your order." };

  // Shape checks — this is a public endpoint, don't trust the payload.
  if (
    typeof input?.restaurantId !== "string" ||
    !Array.isArray(input.lines) ||
    input.lines.length === 0 ||
    input.lines.some(
      (l) =>
        typeof l?.dishId !== "string" ||
        typeof l.price !== "number" ||
        !Number.isInteger(l.quantity) ||
        l.quantity < 1 ||
        l.quantity > MAX_QUANTITY,
    ) ||
    new Set(input.lines.map((l) => l.dishId)).size !== input.lines.length
  ) {
    return { ok: false, error: "Something's off with your cart. Give it a quick look and try again." };
  }

  const offer = input.offer ?? null;
  const freeItems = offer === "biryani" ? (input.freeItems ?? []) : [];
  if (
    (offer !== null && !isOfferKey(offer)) ||
    !Array.isArray(freeItems) ||
    freeItems.some(
      (f) =>
        typeof f?.dishId !== "string" || !Number.isInteger(f.quantity) || f.quantity < 1 || f.quantity > MAX_QUANTITY,
    ) ||
    new Set(freeItems.map((f) => f.dishId)).size !== freeItems.length
  ) {
    return { ok: false, error: "Something's off with your discount. Remove it and try again." };
  }
  if (offer === "biryani" && freeItems.length === 0) {
    return { ok: false, error: "Pick your free Single biryani, or remove the offer." };
  }

  const contactPhone = normalizeIndianMobile(String(input.contactPhone ?? ""));
  if (!contactPhone) return { ok: false, error: "Enter a valid 10-digit mobile number." };

  const notes = String(input.notes ?? "").trim();
  if (notes.length > MAX_NOTES) {
    return { ok: false, error: `That note's a bit long. Keep it under ${MAX_NOTES} characters.` };
  }

  // App-side menu checks first: they can name what changed and fix the
  // cart. place_order() re-checks everything and has the final say.
  const menu = await getRestaurantMenu(input.restaurantId);
  if (!menu) return { ok: false, error: "This restaurant isn't around anymore. Try another one?" };
  if (!menu.restaurant.is_active) {
    return {
      ok: false,
      error: `${menu.restaurant.name} just closed, so it isn't taking orders right now.`,
    };
  }

  const dishes = new Map(menu.sections.flatMap((s) => s.dishes).map((d) => [d.id, d]));
  const removedDishIds: string[] = [];
  const updatedPrices: { dishId: string; price: number }[] = [];
  for (const line of input.lines) {
    const dish = dishes.get(line.dishId);
    if (!dish || !dish.is_available) removedDishIds.push(line.dishId);
    else if (dish.price !== line.price) updatedPrices.push({ dishId: dish.id, price: dish.price });
  }
  if (removedDishIds.length > 0) {
    const names = removedDishIds.length === 1 ? "An item" : `${removedDishIds.length} items`;
    return {
      ok: false,
      error: `${names} in your cart just sold out and ${removedDishIds.length === 1 ? "was" : "were"} removed. Please check your cart.`,
      removedDishIds,
    };
  }
  if (updatedPrices.length > 0) {
    return {
      ok: false,
      error: "Heads up, some prices just changed. Your cart's updated, take a peek at the new total.",
      updatedPrices,
    };
  }

  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_restaurant_id: input.restaurantId,
    p_items: input.lines.map((l) => ({ dish_id: l.dishId, quantity: l.quantity })),
    p_contact_phone: contactPhone,
    p_notes: notes || null,
    p_offer: offer,
    p_free_items: freeItems.length ? freeItems.map((f) => ({ dish_id: f.dishId, quantity: f.quantity })) : null,
  });

  if (error || typeof orderId !== "string") {
    const key = error?.message ?? "";
    return {
      ok: false,
      error: PLACE_ORDER_ERRORS[key] ?? GENERIC_ERROR,
      ...(key === "offer_unavailable" && { offerEnded: true }),
    };
  }

  // Buzz the admin's phone, after the student already has their response —
  // a slow push service must never hold up an order.
  after(async () => {
    const { data: placed } = await supabase
      .from("orders")
      .select("daily_number, total_amount")
      .eq("id", orderId)
      .single();
    if (!placed) return;
    await notifyAdmins({
      title: `New order ${formatOrderNumber(placed.daily_number)} · ${formatRupees(placed.total_amount)}`,
      body: `${menu.restaurant.name} · ${profile.full_name}`,
      url: "/admin",
      tag: `order-${orderId}`,
      urgent: true,
    });
  });

  return { ok: true, orderId };
}

const GENERIC_ERROR = "Couldn't place your order. Mind trying again?";

// Keys raised by public.place_order() → what the student sees.
const PLACE_ORDER_ERRORS: Record<string, string> = {
  not_authenticated: "Looks like you got signed out. Sign in again to place your order.",
  profile_missing: "Looks like you got signed out. Sign in again to place your order.",
  banned: "Ordering's blocked for this phone number. If that doesn't sound right, please reach out to support.",
  ordering_paused: "Ordering's closed right now. Check back in a bit. Your cart is saved.",
  invalid_contact_phone: "Enter a valid 10-digit mobile number.",
  notes_too_long: `That note's a bit long. Keep it under ${MAX_NOTES} characters.`,
  restaurant_closed: "This restaurant isn't taking orders right now.",
  empty_cart: "Your cart's empty. Go pick something tasty.",
  invalid_items: "Something's off with your cart. Give it a quick look and try again.",
  dish_unavailable: "Something in your cart just sold out. Hop back to the menu to swap it out.",
  // Rate limits (20260922000000_place_order_rate_limit.sql): 5 a minute, 8 unfinished.
  order_rate_limited: "That's a lot of orders in a minute. Wait a moment and try again. Your cart is saved.",
  too_many_open_orders: "You already have 8 orders on the way. Once one is delivered you can order again.",
  // Discount offers (20261001050000_discount_offers.sql).
  offer_unavailable: "That offer just ended, so it's been removed. Check the new total and place your order again.",
  offer_not_eligible: "Your cart doesn't qualify for that many free biryanis. Every 3 Full biryanis get 1 Single free.",
};
