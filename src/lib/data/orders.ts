import "server-only";

import { cache } from "react";
import { istDayKey } from "@/lib/date";
import { REVIEW_WINDOW_MS } from "@/lib/reviews/limits";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/ids";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import type { OrderStatus } from "./types";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  restaurantId: string;
  restaurantName: string;
  itemCount: number;
  /** e.g. "2× Chicken Biryani, Veg Manchurian" — for the orders list, not the detail page. */
  itemsSummary: string;
  /** Snapshotted dish names in order — the orders list looks up a photo from the first one it can. */
  dishNames: string[];
  dailyNumber: number;
  /** Delivered within the last 7 days and not rated yet — the Orders list's "Rate" pill. */
  rateable: boolean;
};

function isRateable(status: OrderStatus, deliveredAt: string | null, reviewed: boolean): boolean {
  return (
    status === "delivered" &&
    !reviewed &&
    deliveredAt !== null &&
    Date.now() - new Date(deliveredAt).getTime() < REVIEW_WINDOW_MS
  );
}

/** PostgREST returns a one-to-one embed as an object or a one-element array; normalise to "exists". */
function hasReview(row: unknown): boolean {
  return Array.isArray(row) ? row.length > 0 : row != null;
}

export type OrderItem = { id: string; dishName: string; unitPrice: number; quantity: number; subtotal: number };

/** The student's own review of an order (order_reviews + order_item_ratings), if they've left one. */
export type OrderReview = {
  note: string | null;
  createdAt: string;
  /** order_item_id -> 1..5 */
  ratings: Record<string, number>;
};

export type OrderDetail = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  /** Set by the set_delivered_at trigger; the 7-day review window counts from it. */
  deliveredAt: string | null;
  review: OrderReview | null;
  contactPhone: string;
  notes: string | null;
  restaurantId: string;
  restaurantName: string;
  restaurantPhone: string;
  items: OrderItem[];
  dailyNumber: number;
};

type OrderSummaryRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  restaurant_id: string;
  restaurants: { name: string } | null;
  order_items: { dish_name: string; quantity: number }[];
  daily_number: number;
  delivered_at: string | null;
  order_reviews: { order_id: string } | { order_id: string }[] | null;
};

function summarizeItems(items: { dish_name: string; quantity: number }[]): string {
  return items.map((i) => (i.quantity > 1 ? `${i.quantity}× ${i.dish_name}` : i.dish_name)).join(", ");
}

/**
 * The signed-in student's own orders, most recent first. RLS already
 * scopes reads to auth.uid() = user_id; the explicit filter here is
 * defense in depth, matching how profile.ts fetches its own row.
 */
export async function getOrderHistory(userId: string): Promise<OrderSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, restaurant_id, restaurants(name), order_items(dish_name, quantity), daily_number, delivered_at, order_reviews(order_id)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<OrderSummaryRow[]>();

  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.total_amount,
    createdAt: o.created_at,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    itemCount: o.order_items.reduce((sum, item) => sum + item.quantity, 0),
    itemsSummary: summarizeItems(o.order_items),
    dishNames: o.order_items.map((i) => i.dish_name),
    dailyNumber: o.daily_number,
    rateable: isRateable(o.status, o.delivered_at, hasReview(o.order_reviews)),
  }));
}

export type RatePromptOrder = {
  id: string;
  dailyNumber: number;
  restaurantName: string;
  /** First dish, for "How was your A1 Dum Biryani?" and its photo. */
  firstDish: string;
  otherDishCount: number;
};

/**
 * The student's most recently delivered order that's still rateable (within
 * 7 days, not rated) — what Home's one-time "How was it?" pop-up asks about.
 */
export async function getRatePromptOrder(userId: string): Promise<RatePromptOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, daily_number, delivered_at, restaurants(name), order_items(dish_name), order_reviews(order_id)")
    .eq("user_id", userId)
    .eq("status", "delivered")
    .gte("delivered_at", new Date(Date.now() - REVIEW_WINDOW_MS).toISOString())
    .order("delivered_at", { ascending: false })
    .limit(5)
    .returns<
      {
        id: string;
        daily_number: number;
        delivered_at: string;
        restaurants: { name: string } | null;
        order_items: { dish_name: string }[];
        order_reviews: unknown;
      }[]
    >();

  if (error) throw error;
  const o = (data ?? []).find((row) => !hasReview(row.order_reviews) && row.order_items.length > 0);
  if (!o) return null;
  return {
    id: o.id,
    dailyNumber: o.daily_number,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    firstDish: o.order_items[0].dish_name,
    otherDishCount: o.order_items.length - 1,
  };
}

type OrderDetailRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  contact_phone: string;
  notes: string | null;
  restaurant_id: string;
  restaurants: { name: string; phone: string } | null;
  order_items: { id: string; dish_name: string; unit_price: number; quantity: number; subtotal: number }[];
  daily_number: number;
  delivered_at: string | null;
  // One-to-one via order_reviews.order_id; PostgREST may return an object or a one-element array.
  order_reviews: ReviewRow | ReviewRow[] | null;
};

type ReviewRow = {
  note: string | null;
  created_at: string;
  order_item_ratings: { order_item_id: string; rating: number }[];
};

/**
 * Consecutive IST calendar days, ending today or yesterday, with at least
 * one delivered order — "yesterday" still counts so the streak doesn't
 * look broken before the student has had a chance to order today.
 */
function computeStreakDays(deliveredTimestamps: string[]): number {
  const days = new Set(deliveredTimestamps.map(istDayKey));
  const DAY_MS = 24 * 60 * 60 * 1000;

  let cursor = new Date();
  if (!days.has(istDayKey(cursor.toISOString()))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  let streak = 0;
  while (days.has(istDayKey(cursor.toISOString()))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}

/**
 * All the profile screen's order-derived numbers in one query: "cravings
 * solved" (delivered orders), the milestone badges ("First Bite", "Regular",
 * "Campus Explorer"), the ordering streak, and the "N pickups, N no-shows"
 * line. There's no dedicated no-show status — `cancelled` is the closest
 * thing the schema tracks (an admin cancels an order that isn't going to
 * be collected), so it's used as that proxy.
 */
export async function getOrderStats(userId: string): Promise<{
  deliveredCount: number;
  cancelledCount: number;
  restaurantsVisited: number;
  streakDays: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("restaurant_id, status, created_at")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = data ?? [];
  const delivered = rows.filter((r) => r.status === "delivered");
  const cancelled = rows.filter((r) => r.status === "cancelled");
  return {
    deliveredCount: delivered.length,
    cancelledCount: cancelled.length,
    restaurantsVisited: new Set(delivered.map((r) => r.restaurant_id)).size,
    streakDays: computeStreakDays(delivered.map((r) => r.created_at)),
  };
}

/**
 * Distinct dishes the student has been delivered at one restaurant — the
 * menu page's "You've tried N of M" progress bar. Dishes ordered but
 * later removed from the menu (`dish_id` goes null on delete) don't
 * count, since they're not part of the current total either.
 */
export async function getDishesTried(userId: string, restaurantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_items(dish_id)")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "delivered")
    .returns<{ order_items: { dish_id: string | null }[] }[]>();

  if (error) throw error;
  const dishIds = (data ?? []).flatMap((o) => o.order_items.map((i) => i.dish_id));
  return new Set(dishIds.filter((id): id is string => id !== null)).size;
}

/**
 * This student's most-ordered dish (by total quantity) at a restaurant,
 * among delivered orders — powers the menu's "Your favorite" tag. Ties
 * keep whichever dish happens to sort first; not worth a tiebreak rule
 * for a cosmetic badge.
 */
export async function getFavoriteDishId(userId: string, restaurantId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_items(dish_id, quantity)")
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId)
    .eq("status", "delivered")
    .returns<{ order_items: { dish_id: string | null; quantity: number }[] }[]>();

  if (error) throw error;

  const totals = new Map<string, number>();
  for (const order of data ?? []) {
    for (const item of order.order_items) {
      if (!item.dish_id) continue;
      totals.set(item.dish_id, (totals.get(item.dish_id) ?? 0) + item.quantity);
    }
  }
  if (totals.size === 0) return null;
  return [...totals.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * True if the student has any order that hasn't reached delivered/cancelled
 * yet. Used to block phone-number edits while an order is in progress,
 * since the delivery contact number shouldn't change mid-order.
 */
export async function hasActiveOrder(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ACTIVE_STATUSES);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/** One order with its restaurant + items, or null if it's not this student's. */
function toReview(row: OrderDetailRow["order_reviews"]): OrderReview | null {
  const r = Array.isArray(row) ? row[0] : row;
  if (!r) return null;
  return {
    note: r.note,
    createdAt: r.created_at,
    ratings: Object.fromEntries(r.order_item_ratings.map((x) => [x.order_item_id, x.rating])),
  };
}

export const getOrder = cache(async function getOrder(
  id: string,
  userId: string,
): Promise<OrderDetail | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, status, total_amount, created_at, updated_at, delivered_at, contact_phone, notes, restaurant_id, restaurants(name, phone), order_items(id, dish_name, unit_price, quantity, subtotal), daily_number, order_reviews(note, created_at, order_item_ratings(order_item_id, rating))",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<OrderDetailRow>();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    status: data.status,
    totalAmount: data.total_amount,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    deliveredAt: data.delivered_at,
    review: toReview(data.order_reviews),
    contactPhone: data.contact_phone,
    notes: data.notes,
    restaurantId: data.restaurant_id,
    restaurantName: data.restaurants?.name ?? "Restaurant",
    restaurantPhone: data.restaurants?.phone ?? "",
    items: data.order_items.map((i) => ({
      id: i.id,
      dishName: i.dish_name,
      unitPrice: i.unit_price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    dailyNumber: data.daily_number,
  };
});
