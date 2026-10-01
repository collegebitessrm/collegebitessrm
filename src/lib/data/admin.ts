import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OfferKey } from "@/lib/offers";
import { DEFAULT_DELIVERY_MINUTES, isPastDeliveryTime, startOfTodayIST } from "@/lib/date";
import { getUnlockedMilestones, MILESTONES } from "@/components/profile/milestone-badges";
import { isUuid } from "@/lib/ids";
import { getRestaurantCount } from "./restaurants";
import type { OrderStatus } from "./types";

export type AdminRestaurant = { id: string; name: string; is_active: boolean };

/** Every restaurant, for the open/closed toggle list and the vendor stat. */
export async function getAdminRestaurants(): Promise<AdminRestaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, is_active")
    .order("name");

  if (error) throw error;
  return data;
}

export type OrderCounts = { total: number; confirmed: number; completed: number };

/**
 * Order counts for the stat cards. Counted rather than fetched in full, so
 * this stays cheap as order history grows. "Confirmed" is status =
 * 'confirmed' only (not preparing/out_for_delivery too) — those can become
 * their own stats later if needed. "Completed" is status = 'delivered'.
 * `since` scopes all three to orders created at or after that instant —
 * the admin dashboard passes today's IST midnight, so these read as
 * "today's" counts, matching the order list below it.
 */
export async function getOrderCounts(since?: Date): Promise<OrderCounts> {
  const supabase = await createClient();
  const sinceIso = since?.toISOString();

  let totalQuery = supabase.from("orders").select("id", { count: "exact", head: true });
  let confirmedQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");
  let completedQuery = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "delivered");
  if (sinceIso) {
    totalQuery = totalQuery.gte("created_at", sinceIso);
    confirmedQuery = confirmedQuery.gte("created_at", sinceIso);
    completedQuery = completedQuery.gte("created_at", sinceIso);
  }

  const [total, confirmed, completed] = await Promise.all([totalQuery, confirmedQuery, completedQuery]);

  if (total.error) throw total.error;
  if (confirmed.error) throw confirmed.error;
  if (completed.error) throw completed.error;

  return {
    total: total.count ?? 0,
    confirmed: confirmed.count ?? 0,
    completed: completed.count ?? 0,
  };
}

export type AdminOrder = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  contactPhone: string;
  notes: string | null;
  restaurantId: string;
  restaurantName: string;
  /** The restaurant's promised delivery time, in minutes from placing the order. */
  deliveryMinutes: number;
  userId: string;
  studentName: string;
  studentBanned: boolean;
  /** In the order they were added; `subtotal` = unit price × quantity, snapshotted at order time.
   *  `isFree` = a Single biryani given free by the biryani offer (its value is in discountAmount). */
  items: { dishName: string; quantity: number; subtotal: number; isFree: boolean }[];
  dailyNumber: number;
  /** The discount offer the student used, if any; totalAmount is already after it. */
  discountOffer: OfferKey | null;
  discountAmount: number;
};

type AdminOrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  contact_phone: string;
  daily_number: number;
  notes: string | null;
  user_id: string;
  restaurant_id: string;
  restaurants: { name: string; delivery_minutes: number } | null;
  users: { full_name: string; is_banned: boolean } | null;
  order_items: { dish_name: string; quantity: number; subtotal: number; is_free: boolean }[];
  discount_offer: OfferKey | null;
  discount_amount: number;
};

const ADMIN_ORDER_COLUMNS =
  "id, status, total_amount, created_at, contact_phone, notes, user_id, restaurant_id, restaurants(name, delivery_minutes), users(full_name, is_banned), order_items(dish_name, quantity, subtotal, is_free), daily_number, discount_offer, discount_amount";

function toAdminOrder(o: AdminOrderRow): AdminOrder {
  return {
    id: o.id,
    status: o.status,
    totalAmount: o.total_amount,
    createdAt: o.created_at,
    contactPhone: o.contact_phone,
    notes: o.notes,
    userId: o.user_id,
    restaurantId: o.restaurant_id,
    restaurantName: o.restaurants?.name ?? "Restaurant",
    deliveryMinutes: o.restaurants?.delivery_minutes ?? DEFAULT_DELIVERY_MINUTES,
    studentName: o.users?.full_name ?? "Student",
    studentBanned: o.users?.is_banned ?? false,
    items: o.order_items.map((i) => ({
      dishName: i.dish_name,
      quantity: i.quantity,
      subtotal: Number(i.subtotal),
      isFree: i.is_free,
    })),
    dailyNumber: o.daily_number,
    discountOffer: o.discount_offer,
    discountAmount: Number(o.discount_amount),
  };
}

export type AdminOrderDetail = AdminOrder & {
  deliveredAt: string | null;
  studentEmail: string | null;
  studentRegistrationNumber: string | null;
  /** Same order as `items`, with the unit price and the student's star rating (if they rated it). */
  itemDetails: { unitPrice: number; rating: number | null }[];
  review: { note: string | null; createdAt: string } | null;
};

/** One order with everything the admin order page shows. Null for a malformed or unknown id (→ 404). */
export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetail | null> {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const [{ data, error }, reviewResult] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, status, total_amount, created_at, delivered_at, contact_phone, notes, user_id, restaurant_id, daily_number, discount_offer, discount_amount, restaurants(name, delivery_minutes), users(full_name, is_banned, email, registration_number), order_items(id, dish_name, quantity, unit_price, subtotal, is_free)",
      )
      .eq("id", id)
      .maybeSingle<
        Omit<AdminOrderRow, "users" | "order_items"> & {
          delivered_at: string | null;
          users: { full_name: string; is_banned: boolean; email: string | null; registration_number: string | null } | null;
          order_items: { id: string; dish_name: string; quantity: number; unit_price: number; subtotal: number; is_free: boolean }[];
        }
      >(),
    supabase
      .from("order_reviews")
      .select("note, created_at, order_item_ratings(order_item_id, rating)")
      .eq("order_id", id)
      .maybeSingle<{ note: string | null; created_at: string; order_item_ratings: { order_item_id: string; rating: number }[] }>(),
  ]);

  if (error) throw error;
  if (!data) return null;
  // A review is extra context — if it fails to load, show the order without it.
  const review = reviewResult.data;
  const ratings = new Map((review?.order_item_ratings ?? []).map((r) => [r.order_item_id, r.rating]));

  return {
    ...toAdminOrder(data),
    deliveredAt: data.delivered_at,
    studentEmail: data.users?.email ?? null,
    studentRegistrationNumber: data.users?.registration_number ?? null,
    itemDetails: data.order_items.map((i) => ({ unitPrice: Number(i.unit_price), rating: ratings.get(i.id) ?? null })),
    review: review ? { note: review.note, createdAt: review.created_at } : null,
  };
}

/**
 * How many orders are `confirmed` right now (any day) — what "Mark all
 * delivered" acts on (markAllConfirmedDelivered()). The dashboard's order
 * list is scoped to today, so counting from it would miss confirmed orders
 * from earlier days that the action would in fact deliver.
 */
export async function getConfirmedOrderCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed");

  if (error) throw error;
  return count ?? 0;
}

/**
 * The main dashboard's "Current orders": today's orders (IST) until their
 * promised delivery time (placed + the restaurant's delivery_minutes), plus
 * any of today's that still need an admin (pending / confirmed) even past
 * it, so nothing actionable disappears. Delivered or cancelled orders drop
 * off once that time passes — they live on /admin/history
 * (getAdminOrderHistory()).
 */
export async function getAdminOrders(now: Date = new Date()): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ADMIN_ORDER_COLUMNS)
    .gte("created_at", startOfTodayIST().toISOString())
    .order("created_at", { ascending: false })
    .returns<AdminOrderRow[]>();

  if (error) throw error;
  return (data ?? [])
    .map(toAdminOrder)
    .filter((o) => !isFinished(o.status) || !isPastDeliveryTime(o.createdAt, o.deliveryMinutes, now));
}

function isFinished(status: OrderStatus) {
  return status === "delivered" || status === "cancelled";
}

// Capped so the history page stays cheap to load as order history grows —
// a "load more" / date-range picker can come later if needed.
const HISTORY_ORDERS_LIMIT = 2000;

/** Every order ever placed, most recent first — for the admin order-history page (grouped by day there). */
export async function getAdminOrderHistory(): Promise<AdminOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ADMIN_ORDER_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(HISTORY_ORDERS_LIMIT)
    .returns<AdminOrderRow[]>();

  if (error) throw error;
  return (data ?? []).map(toAdminOrder);
}

export type AdminUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  registrationNumber: string | null;
  isBanned: boolean;
  createdAt: string;
  /** Every milestone unlocked — the free-biryani reward is due (or already handed over). */
  rewardEarned: boolean;
  /** When an admin marked the free biryani handed over, else null. */
  rewardClaimedAt: string | null;
};

/**
 * Delivered-order counts and distinct restaurants per student, the same
 * inputs the Profile page feeds getUnlockedMilestones(). Paged because
 * PostgREST caps a single response at 1000 rows.
 */
async function getDeliveredStatsByUser(): Promise<Map<string, { delivered: number; restaurants: Set<string> }>> {
  const supabase = await createClient();
  const stats = new Map<string, { delivered: number; restaurants: Set<string> }>();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("orders")
      .select("user_id, restaurant_id")
      .eq("status", "delivered")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      const s = stats.get(row.user_id) ?? { delivered: 0, restaurants: new Set<string>() };
      s.delivered += 1;
      s.restaurants.add(row.restaurant_id);
      stats.set(row.user_id, s);
    }
    if (!data || data.length < PAGE) break;
  }
  return stats;
}

// Capped for the same reason as HISTORY_ORDERS_LIMIT above — keeps the
// Users page cheap to load as the student base grows.
const ALL_USERS_LIMIT = 5000;

/** Every registered student, most recently joined first — for the admin Users page. */
export async function getAllUsers(): Promise<AdminUser[]> {
  const supabase = await createClient();
  const [{ data, error }, deliveredStats, totalRestaurants, rewards] = await Promise.all([
    supabase
      .from("users")
      .select("id, full_name, phone, email, registration_number, is_banned, created_at")
      .order("created_at", { ascending: false })
      .limit(ALL_USERS_LIMIT),
    getDeliveredStatsByUser(),
    getRestaurantCount(),
    supabase.from("milestone_rewards").select("user_id, claimed_at"),
  ]);

  if (error) throw error;
  // A missing milestone_rewards table (migration not applied yet) just means nobody has claimed.
  const claimedAt = new Map((rewards.data ?? []).map((r) => [r.user_id as string, r.claimed_at as string]));

  return (data ?? []).map((u) => ({
    rewardEarned:
      getUnlockedMilestones(
        deliveredStats.get(u.id)?.delivered ?? 0,
        deliveredStats.get(u.id)?.restaurants.size ?? 0,
        totalRestaurants,
      ).length === MILESTONES.length,
    rewardClaimedAt: claimedAt.get(u.id) ?? null,
    id: u.id,
    fullName: u.full_name,
    phone: u.phone,
    email: u.email,
    registrationNumber: u.registration_number,
    isBanned: u.is_banned,
    createdAt: u.created_at,
  }));
}

export type BannedUser = {
  id: string;
  fullName: string;
  phone: string;
  bannedAt: string | null;
};

/** Everyone currently banned, most recently banned first. */
export async function getBannedUsers(): Promise<BannedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, phone, banned_at")
    .eq("is_banned", true)
    .order("banned_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((u) => ({
    id: u.id,
    fullName: u.full_name,
    phone: u.phone,
    bannedAt: u.banned_at,
  }));
}

export type AdminReview = {
  orderId: string;
  dailyNumber: number;
  restaurantId: string;
  restaurantName: string;
  studentName: string;
  note: string | null;
  createdAt: string;
  /** One per dish in the order. */
  ratings: { dishId: string | null; dishName: string; quantity: number; rating: number }[];
};

type AdminReviewRow = {
  order_id: string;
  note: string | null;
  created_at: string;
  users: { full_name: string } | null;
  orders: { daily_number: number; restaurant_id: string; restaurants: { name: string } | null } | null;
  order_item_ratings: {
    rating: number;
    dish_id: string | null;
    order_items: { dish_name: string; quantity: number } | null;
  }[];
};

// Capped like HISTORY_ORDERS_LIMIT — plenty for campus volume.
const REVIEWS_LIMIT = 1000;

/**
 * Every review, newest first — for /admin/reviews. Admin-only by RLS
 * (order_reviews / order_item_ratings are readable only by their author and
 * admins); students never see each other's reviews.
 */
export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_reviews")
    .select(
      "order_id, note, created_at, users(full_name), orders(daily_number, restaurant_id, restaurants(name)), order_item_ratings(rating, dish_id, order_items(dish_name, quantity))",
    )
    .order("created_at", { ascending: false })
    .limit(REVIEWS_LIMIT)
    .returns<AdminReviewRow[]>();

  if (error) throw error;
  return (data ?? []).map((r) => ({
    orderId: r.order_id,
    dailyNumber: r.orders?.daily_number ?? 0,
    restaurantId: r.orders?.restaurant_id ?? "",
    restaurantName: r.orders?.restaurants?.name ?? "Restaurant",
    studentName: r.users?.full_name ?? "Student",
    note: r.note,
    createdAt: r.created_at,
    ratings: r.order_item_ratings.map((x) => ({
      dishId: x.dish_id,
      dishName: x.order_items?.dish_name ?? "Dish",
      quantity: x.order_items?.quantity ?? 1,
      rating: x.rating,
    })),
  }));
}

export type AdminDish = {
  id: string;
  name: string;
  price: number;
  isVeg: boolean;
  isAvailable: boolean;
  restaurantId: string;
  restaurantName: string;
  category: string | null;
};

/**
 * Every dish on every menu for the Sold out page — including the ones
 * already marked unavailable, which is the whole point: that page is the
 * only way to put one back on sale.
 *
 * Sorted the way the menus read (restaurant, then section, then the
 * section's own order) rather than by name, so an admin hunting for a
 * dish looks in the same place they'd look in the app.
 */
export async function getAdminDishes(): Promise<AdminDish[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(
      "id, name, price, is_veg, is_available, sort_order, restaurant_id, restaurants(name), dish_categories(name, sort_order)",
    )
    .returns<
      {
        id: string;
        name: string;
        price: number;
        is_veg: boolean;
        is_available: boolean;
        sort_order: number;
        restaurant_id: string;
        restaurants: { name: string } | null;
        dish_categories: { name: string; sort_order: number } | null;
      }[]
    >();

  if (error) throw error;
  return (data ?? [])
    .sort(
      (a, b) =>
        (a.restaurants?.name ?? "").localeCompare(b.restaurants?.name ?? "") ||
        (a.dish_categories?.sort_order ?? 0) - (b.dish_categories?.sort_order ?? 0) ||
        a.sort_order - b.sort_order,
    )
    .map((d) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      isVeg: d.is_veg,
      isAvailable: d.is_available,
      restaurantId: d.restaurant_id,
      restaurantName: d.restaurants?.name ?? "",
      category: d.dish_categories?.name ?? null,
    }));
}
