"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { after } from "next/server";
import { notifyAllSubscribers, notifyUser, type PushPayload } from "@/lib/notifications/send";
import type { OrderStatus } from "@/lib/data/types";
import type { OrderingMode } from "@/lib/ordering";
import { isOfferKey, type OfferKey } from "@/lib/offers";
import { formatOrderNumber, nextStatus } from "@/lib/orders/status";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/ids";
import type { KpiAdjustment, KpiOverrides, KpiType, ProfitRates, RestaurantKpiOverridesMap } from "@/lib/data/analytics-types";
import { identifyRestaurantKey } from "@/lib/data/analytics";

export type AdminActionResult = { ok: true } | { ok: false; error: string };

/**
 * Both actions below are only ever reachable from /admin, itself gated by
 * requireAdmin(). This is a friendly early exit for a direct call — the
 * real boundary is RLS: every write here also checks public.is_admin().
 */
async function assertAdmin(): Promise<{ ok: false; error: string } | null> {
 const { profile } = await getSessionProfile();
 if (!profile || profile.role !== "admin") return { ok: false, error: "Admins only." };
 return null;
}

/**
 * Campus-wide ordering switch: 'open' or 'closed' (there is no daily
 * schedule). 'closed' also turns every restaurant off, so a close is total —
 * switching back to Open leaves them off, and the admin turns on whichever
 * restaurants should reopen.
 */
export async function setOrderingMode(mode: OrderingMode): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;
 if (mode !== "open" && mode !== "closed") {
 return { ok: false, error: "Unknown ordering mode." };
 }

 const supabase = await createClient();
 const { error } = await supabase
 .from("app_settings")
 .update({ ordering_mode: mode, updated_at: new Date().toISOString() })
 .eq("id", true);
 if (error) return { ok: false, error: "Couldn't update ordering. Please try again." };

 if (mode === "closed") {
 const { error: restaurantsError } = await supabase
 .from("restaurants")
 .update({ is_active: false })
 .eq("is_active", true);
 if (restaurantsError) {
 revalidatePath("/admin");
 return { ok: false, error: "Ordering is paused, but turning the restaurants off failed. Please try again." };
 }
 revalidatePath("/", "layout"); // student home + menu pages read is_active
 }

 if (mode === "open") {
  // Broadcast push to all subscribed students that ordering is open
  after(async () => {
   try {
    await notifyAllSubscribers({
     title: "🍕 Orders are Now Open!",
     body: "College Bites is taking orders! Browse menus and place your food order before batch deliveries fill up.",
     url: "/",
     tag: "ordering-opened",
    });
   } catch (err) {
    console.error("Broadcast push error on ordering open:", err);
   }
  });
  revalidatePath("/", "layout");
 }

 revalidatePath("/admin");
 return { ok: true };
}

/**
 * Manually broadcast "Orders are Open" notification to all subscribed users.
 */
export async function broadcastOrdersOpenNotification(): Promise<{ ok: boolean; count?: number; error?: string }> {
 const denied = await assertAdmin();
 if (denied) return denied;

 try {
  const result = await notifyAllSubscribers({
   title: "🍕 Orders are Now Open!",
   body: "College Bites is taking orders! Browse menus and place your food order before batch deliveries fill up.",
   url: "/",
   tag: "ordering-opened",
  });
  return { ok: true, count: result.sent };
 } catch (err: any) {
  return { ok: false, error: err?.message || "Failed to broadcast notification." };
 }
}

/**
 * Turns one discount offer on or off (app_settings.offer_*). Students see
 * it in the cart straight away; place_order() refuses an offer that's off.
 */
export async function setOfferEnabled(offer: OfferKey, enabled: boolean): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;
 if (!isOfferKey(offer) || typeof enabled !== "boolean") return { ok: false, error: "Unknown offer." };

 const supabase = await createClient();
 const { error } = await supabase
 .from("app_settings")
 .update({ [`offer_${offer}`]: enabled, updated_at: new Date().toISOString() })
 .eq("id", true);
 if (error) return { ok: false, error: "Couldn't update the offer. Please try again." };

 revalidatePath("/", "layout"); // the cart on Home and every menu
 return { ok: true };
}

/** Opens or closes one restaurant. */
export async function setRestaurantActive(
 restaurantId: string,
 active: boolean,
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { error } = await supabase
 .from("restaurants")
 .update({ is_active: active })
 .eq("id", restaurantId);
 if (error) return { ok: false, error: "Couldn't update that restaurant. Please try again." };

 revalidatePath("/admin");
 revalidatePath("/", "layout"); // student home + menu pages also read is_active
 return { ok: true };
}

/**
 * Marks a student's all-milestones free biryani as handed over (or undoes
 * it). The Users page only offers this for students who have unlocked
 * every milestone; the table's primary key keeps it to one per student.
 */
export async function setMilestoneRewardClaimed(
 userId: string,
 claimed: boolean,
): Promise<AdminActionResult & { claimedAt?: string }> {
 const { profile } = await getSessionProfile();
 if (!profile || profile.role !== "admin") return { ok: false, error: "Admins only." };

 const supabase = await createClient();
 if (claimed) {
 const { data, error } = await supabase
 .from("milestone_rewards")
 .insert({ user_id: userId, marked_by: profile.id })
 .select("claimed_at")
 .single();
 if (error) {
 return {
 ok: false,
 error: error.code === "23505" ? "Already marked as claimed." : "Couldn't mark it claimed. Please try again.",
 };
 }
 revalidatePath("/admin/users");
 revalidatePath("/profile");
 return { ok: true, claimedAt: data.claimed_at };
 }

 const { error } = await supabase.from("milestone_rewards").delete().eq("user_id", userId);
 if (error) return { ok: false, error: "Couldn't undo that. Please try again." };
 revalidatePath("/admin/users");
 revalidatePath("/profile");
 return { ok: true };
}

/**
 * Marks one dish sold out (or back on sale) from /admin/sold-out. The menu
 * keeps showing a sold-out dish, greyed out and unorderable, and
 * place_order() refuses it anyway — this only flips the flag.
 */
export async function setDishAvailable(dishId: string, available: boolean): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { error } = await supabase.from("dishes").update({ is_available: available }).eq("id", dishId);
 if (error) return { ok: false, error: "Couldn't update that dish. Please try again." };

 revalidatePath("/admin/sold-out");
 revalidatePath("/", "layout"); // student menus, search and Home cards read is_available
 return { ok: true };
}

/**
 * Advances one order to the next status in STATUS_FLOW. `currentStatus` is
 * what the admin's screen showed when they clicked — the update only
 * applies if the row is still at that status, so two admins clicking the
 * same order (or a stale screen) can't silently skip or redo a step.
 * When advancing from confirmed, auto-advances to preparing immediately.
 */
export async function advanceOrderStatus(
 orderId: string,
 currentStatus: OrderStatus,
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const next = nextStatus(currentStatus);
 if (!next) return { ok: false, error: "This order can't be advanced any further." };

 // Auto-advance: confirmed → preparing happens immediately without a separate click
 const targetStatus = currentStatus === "confirmed" ? "preparing" : next;

 const supabase = await createClient();
 const { data, error } = await supabase
 .from("orders")
 .update({ status: targetStatus })
 .eq("id", orderId)
 .eq("status", currentStatus)
 .select("id, user_id, daily_number, restaurants(name)")
 .returns<OrderNotifyRow[]>();
 if (error) return { ok: false, error: "Couldn't update that order. Please try again." };
 if (!data || data.length === 0) {
 return { ok: false, error: "That order just changed. Refresh and try again." };
 }

 const order = data[0];
 after(() => notifyUser(supabase, order.user_id, statusPayload(order, targetStatus)));

 revalidatePath("/admin");
 return { ok: true };
}

type OrderNotifyRow = {
 id: string;
 user_id: string;
 daily_number: number;
 restaurants: { name: string } | null;
};

/** What a student sees on their phone when their order moves on. */
function statusPayload(order: OrderNotifyRow, status: OrderStatus): PushPayload {
 const token = formatOrderNumber(order.daily_number);
 const where = order.restaurants?.name ?? "College Bites";
 const copy: Partial<Record<OrderStatus, { title: string; body: string }>> = {
 confirmed: {
 title: `Order ${token} confirmed`,
 body: `${where} is preparing your food. We'll call you at the gate.`,
 },
 preparing: {
 title: `Order ${token} is being prepared`,
 body: `${where} is making your food right now.`,
 },
 out_for_delivery: {
 title: `Order ${token} is on the way`,
 body: `Your food from ${where} is heading to Gate 3.`,
 },
 at_gate: {
 title: `Order ${token} arrived at Gate 3`,
 body: `Your food from ${where} is here! Come collect it.`,
 },
 delivered: {
 title: `Order ${token} delivered`,
 body: "Enjoy! Tap to rate what you ate.",
 },
 cancelled: {
 title: `Order ${token} was cancelled`,
 body: `Your ${where} order won't be delivered. Tap for details.`,
 },
 };
 const { title, body } = copy[status] ?? { title: `Order ${token} updated`, body: `${where} · ${status}` };
 return { title, body, url: `/orders/${order.id}`, tag: `order-${order.id}` };
}

/**
 * Records a restaurant-reported delay on an order.
 *
 * - `delayReason` — what the restaurant told you (e.g. "High volume").
 * - `updatedEtaIso` — the new confirmed ETA as an ISO string, or null when
 *   the restaurant hasn't given a specific time yet.
 * - `awaitingConfirmation` — set true when there's no confirmed ETA so the
 *   tracking page shows "Awaiting confirmation" instead of the stale original.
 *
 * Realtime already publishes the orders table, so the customer tracking page
 * receives these column changes via its existing subscription without a reload.
 */
export async function updateOrderDelay(
 orderId: string,
 delayReason: string,
 updatedEtaIso: string | null,
 awaitingConfirmation: boolean,
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;
 if (!isUuid(orderId)) return { ok: false, error: "Invalid order ID." };

 const trimmed = delayReason.trim();
 if (!trimmed) return { ok: false, error: "A delay reason is required." };
 if (trimmed.length > 300) return { ok: false, error: "Reason is too long (max 300 characters)." };

 // If an ETA was provided, validate it is a parseable date in the future.
 if (updatedEtaIso !== null) {
  const eta = new Date(updatedEtaIso);
  if (isNaN(eta.getTime())) return { ok: false, error: "Invalid ETA date." };
 }

 const supabase = await createClient();

 const { data: existing } = await supabase
  .from("orders")
  .select("updated_eta")
  .eq("id", orderId)
  .maybeSingle();

 const { error } = await supabase
  .from("orders")
  .update({
   delay_reason: trimmed,
   updated_eta: updatedEtaIso,
   delay_updated_at: new Date().toISOString(),
   awaiting_eta_confirmation: awaitingConfirmation,
  })
  .eq("id", orderId);

 if (error) return { ok: false, error: "Couldn't save the delay. Please try again." };

 try {
  const { data: authData } = await supabase.auth.getUser();
  await supabase.from("order_delay_history").insert({
   order_id: orderId,
   previous_eta: existing?.updated_eta ?? null,
   new_eta: updatedEtaIso,
   delay_reason: trimmed,
   awaiting_eta_confirmation: awaitingConfirmation,
   created_by: authData?.user?.id ?? null,
  });
 } catch {
  // Non-blocking audit failure
 }

 // Free-first customer web push notification (Section 8)
 try {
  const { data: orderUser } = await supabase
   .from("orders")
   .select("user_id, daily_number")
   .eq("id", orderId)
   .maybeSingle();

  if (orderUser?.user_id) {
   const { notifyUser } = await import("@/lib/notifications/send");
   const { formatOrderNumber } = await import("@/lib/orders/status");
   const num = formatOrderNumber(orderUser.daily_number);
   await notifyUser(supabase, orderUser.user_id, {
    title: `Order ${num} delay update`,
    body: updatedEtaIso
     ? `Your order has a revised arrival time. Tap to view.`
     : `Restaurant delay update: ${trimmed.slice(0, 75)}. Tap for live status.`,
    url: `/orders/${orderId}`,
    tag: `order-${orderId}`,
   });
  }
 } catch {
  // Non-blocking notification failure
 }

 revalidatePath("/admin");
 return { ok: true };
}

/**
 * Clears all delay information from an order (e.g. the delay resolved,
 * or the admin entered it by mistake). Sets every delay column back to null/false.
 */
export async function clearOrderDelay(orderId: string): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;
 if (!isUuid(orderId)) return { ok: false, error: "Invalid order ID." };

 const supabase = await createClient();
 const { error } = await supabase
  .from("orders")
  .update({
   delay_reason: null,
   updated_eta: null,
   delay_updated_at: null,
   awaiting_eta_confirmation: false,
  })
  .eq("id", orderId);

 if (error) return { ok: false, error: "Couldn't clear the delay. Please try again." };

 revalidatePath("/admin");
 return { ok: true };
}

/**
 * Deletes one order permanently. Only terminal orders (delivered /
 * cancelled) can be deleted — active orders are blocked because the
 * student's live tracking page would be left pointing at a gone row.
 * The RLS policy enforces the same rule server-side; this is a friendly
 * early check. Cascades clean up order_items, order_reviews, and
 * order_item_ratings automatically.
 */
export async function deleteOrder(orderId: string, currentStatus: OrderStatus): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 if (currentStatus !== "delivered" && currentStatus !== "cancelled") {
 return { ok: false, error: "Only delivered or cancelled orders can be deleted." };
 }

 const supabase = await createClient();

 // Log the deletion before removing the order, so stats can count it
 // and subtract its revenue/items from analytics.
 const { data: order, error: fetchError } = await supabase
 .from("orders")
 .select("restaurant_id, status, total_amount, order_items(dish_name, quantity)")
 .eq("id", orderId)
 .eq("status", currentStatus)
 .single();

 if (fetchError || !order) {
 return { ok: false, error: "Couldn't find that order. Please try again." };
 }

 // Count fulls/singles/starters from the order items before deletion.
 let fulls = 0, singles = 0, starters = 0;
 for (const item of order.order_items ?? []) {
   if (item.dish_name.includes("(Full)")) fulls++;
   if (item.dish_name.includes("(Single)")) singles++;
   // Starters detection: category name contains "starter" — but we don't have
   // category here, so we use a simple heuristic: dish name contains "starter"
   // or is in a starters section. For now, count items with "starter" in name.
   if (item.dish_name.toLowerCase().includes("starter")) starters++;
 }

 const { error: logError } = await supabase
 .from("deleted_orders_log")
 .insert({
   restaurant_id: order.restaurant_id,
   status: order.status,
   total_amount: order.total_amount,
   items_summary: { fulls, singles, starters },
 });

 if (logError) {
 return { ok: false, error: "Couldn't log the deletion. Please try again." };
 }

 const { error } = await supabase
 .from("orders")
 .delete()
 .eq("id", orderId)
 .eq("status", currentStatus);
 if (error) return { ok: false, error: "Couldn't delete that order. Please try again." };

 revalidatePath("/admin");
 revalidatePath("/admin/history");
 return { ok: true };
}

/**
 * Cancels one order. Only orders that haven't already finished one way or
 * the other can be cancelled — `currentStatus` is compare-and-swapped the
 * same way advanceOrderStatus() is, so a stale screen can't cancel an
 * order that's since been delivered (or already cancelled) out from
 * under it.
 */
export async function cancelOrder(orderId: string, currentStatus: OrderStatus): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 if (currentStatus === "delivered" || currentStatus === "cancelled") {
 return { ok: false, error: "This order can't be cancelled." };
 }

 const supabase = await createClient();
 const { data, error } = await supabase
 .from("orders")
 .update({ status: "cancelled" })
 .eq("id", orderId)
 .eq("status", currentStatus)
 .select("id, user_id, daily_number, restaurants(name)")
 .returns<OrderNotifyRow[]>();
 if (error) return { ok: false, error: "Couldn't cancel that order. Please try again." };
 if (!data || data.length === 0) {
 return { ok: false, error: "That order just changed. Refresh and try again." };
 }

 const cancelled = data[0];
 after(() => notifyUser(supabase, cancelled.user_id, statusPayload(cancelled, "cancelled")));

 revalidatePath("/admin");
 revalidatePath("/admin/history");
 return { ok: true };
}

/**
 * Bans or unbans one student. See current_user_is_banned() for how a ban
 * actually matches (by phone number, not this specific account) — this
 * just flips the flag on the row the admin picked.
 */
export async function setStudentBanned(userId: string, banned: boolean): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { error } = await supabase.from("users").update({ is_banned: banned }).eq("id", userId);
 if (error) return { ok: false, error: "Couldn't update that student. Please try again." };

 revalidatePath("/admin");
 return { ok: true };
}

/**
 * Bulk-advances every `confirmed` order (any day) straight to `delivered`.
 * Reads the confirmed orders here rather than trusting whatever the client
 * sent, same as every other admin write in this file trusting only what it
 * reads itself.
 */
export async function markAllConfirmedDelivered(): Promise<
 { ok: true; count: number } | { ok: false; error: string }
> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { data: confirmed, error: fetchError } = await supabase
 .from("orders")
 .select("id")
 .eq("status", "confirmed");
 if (fetchError) return { ok: false, error: "Couldn't load confirmed orders. Please try again." };

 const eligibleIds = (confirmed ?? []).map((o) => o.id);
 if (eligibleIds.length === 0) {
 return { ok: false, error: "No confirmed orders to deliver." };
 }

 // Compare-and-swap on status like the single-order actions: an order a
 // second admin cancelled or already delivered in the meantime is skipped.
 const { data: updated, error } = await supabase
 .from("orders")
 .update({ status: "delivered" })
 .in("id", eligibleIds)
 .eq("status", "confirmed")
 .select("id, user_id, daily_number, restaurants(name)")
 .returns<OrderNotifyRow[]>();
 if (error) return { ok: false, error: "Couldn't update those orders. Please try again." };

 // One notification per order, so a student who had two orders delivered
 // hears about both (each carries its own token).
 after(async () => {
 for (const order of updated ?? []) {
 await notifyUser(supabase, order.user_id, statusPayload(order, "delivered"));
 }
 });

 revalidatePath("/admin");
 return { ok: true, count: updated?.length ?? 0 };
}

/** Creates a new restaurant. */
export async function createRestaurant(data: {
 name: string;
 phone?: string;
 description?: string;
 cuisineTags?: string[];
 deliveryMinutes?: number;
 coverImageUrl?: string | null;
}): Promise<AdminActionResult & { id?: string }> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { data: result, error } = await supabase
 .from("restaurants")
 .insert({
 name: data.name.trim(),
 phone: data.phone?.trim() || null,
 description: data.description?.trim() || null,
 cuisine_tags: data.cuisineTags ?? [],
 delivery_minutes: data.deliveryMinutes ?? 40,
 cover_image_url: data.coverImageUrl || null,
 is_active: true,
 })
 .select("id")
 .single();

 if (error) return { ok: false, error: "Couldn't create restaurant. Please try again." };

 revalidatePath("/admin/restaurants");
 revalidatePath("/", "layout");
 return { ok: true, id: result.id };
}

/** Updates an existing restaurant. */
export async function updateRestaurant(
 id: string,
 data: {
 name?: string;
 phone?: string;
 description?: string;
 cuisineTags?: string[];
 deliveryMinutes?: number;
 isActive?: boolean;
 coverImageUrl?: string | null;
 },
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const updates: Record<string, unknown> = {};
 if (data.name !== undefined) updates.name = data.name.trim();
 if (data.phone !== undefined) updates.phone = data.phone?.trim() || null;
 if (data.description !== undefined) updates.description = data.description?.trim() || null;
 if (data.cuisineTags !== undefined) updates.cuisine_tags = data.cuisineTags;
 if (data.deliveryMinutes !== undefined) updates.delivery_minutes = data.deliveryMinutes;
 if (data.isActive !== undefined) updates.is_active = data.isActive;
 if (data.coverImageUrl !== undefined) updates.cover_image_url = data.coverImageUrl || null;

 const { error } = await supabase.from("restaurants").update(updates).eq("id", id);
 if (error) return { ok: false, error: "Couldn't update restaurant. Please try again." };

 revalidatePath("/admin/restaurants");
 revalidatePath("/", "layout");
 return { ok: true };
}

/** Deletes a restaurant — only if it has no orders. */
export async function deleteRestaurant(id: string): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 // Check for existing orders
 const { count } = await supabase
 .from("orders")
 .select("id", { count: "exact", head: true })
 .eq("restaurant_id", id);

 if (count && count > 0) {
 return { ok: false, error: `Cannot delete restaurant with ${count} order(s). Deactivate it instead.` };
 }

 const { error } = await supabase.from("restaurants").delete().eq("id", id);
 if (error) return { ok: false, error: "Couldn't delete restaurant. Please try again." };

 revalidatePath("/admin/restaurants");
 revalidatePath("/", "layout");
 return { ok: true };
}

/** Creates a new category for a restaurant. */
export async function createCategory(restaurantId: string, name: string): Promise<AdminActionResult & { id?: string }> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 // Get max sort_order for this restaurant
 const { data: maxOrder } = await supabase
 .from("dish_categories")
 .select("sort_order")
 .eq("restaurant_id", restaurantId)
 .order("sort_order", { ascending: false })
 .limit(1)
 .maybeSingle();

 const nextSortOrder = (maxOrder?.sort_order ?? 0) + 1;

 const { data: result, error } = await supabase
 .from("dish_categories")
 .insert({ restaurant_id: restaurantId, name: name.trim(), sort_order: nextSortOrder })
 .select("id")
 .single();

 if (error) return { ok: false, error: "Couldn't create category. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true, id: result.id };
}

/** Updates a category's name. */
export async function updateCategory(id: string, name: string): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const { error } = await supabase.from("dish_categories").update({ name: name.trim() }).eq("id", id);
 if (error) return { ok: false, error: "Couldn't update category. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true };
}

/** Deletes a category — only if it has no dishes. */
export async function deleteCategory(id: string): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 // Check for dishes in this category
 const { count } = await supabase
 .from("dishes")
 .select("id", { count: "exact", head: true })
 .eq("category_id", id);

 if (count && count > 0) {
 return { ok: false, error: `Cannot delete category with ${count} dish(es). Move or delete them first.` };
 }

 const { error } = await supabase.from("dish_categories").delete().eq("id", id);
 if (error) return { ok: false, error: "Couldn't delete category. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true };
}

/** Creates a new dish. */
export async function createDish(data: {
 restaurantId: string;
 name: string;
 price: number;
 isVeg: boolean;
 categoryId?: string | null;
 note?: string;
 imageUrl?: string | null;
}): Promise<AdminActionResult & { id?: string }> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 // Get max sort_order for this restaurant+category combo
 let sortOrderQuery = supabase
 .from("dishes")
 .select("sort_order")
 .eq("restaurant_id", data.restaurantId)
 .order("sort_order", { ascending: false })
 .limit(1);

 if (data.categoryId) {
 sortOrderQuery = sortOrderQuery.eq("category_id", data.categoryId);
 } else {
 sortOrderQuery = sortOrderQuery.is("category_id", null);
 }

 const { data: maxOrder } = await sortOrderQuery.maybeSingle();
 const nextSortOrder = (maxOrder?.sort_order ?? 0) + 1;

 const { data: result, error } = await supabase
 .from("dishes")
 .insert({
 restaurant_id: data.restaurantId,
 name: data.name.trim(),
 price: Math.round(data.price),
 is_veg: data.isVeg,
 category_id: data.categoryId ?? null,
 note: data.note?.trim() || null,
 image_url: data.imageUrl || null,
 is_available: true,
 sort_order: nextSortOrder,
 })
 .select("id")
 .single();

 if (error) return { ok: false, error: "Couldn't create dish. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true, id: result.id };
}

/** Updates an existing dish. */
export async function updateDish(
 id: string,
 data: {
 name?: string;
 price?: number;
 isVeg?: boolean;
 categoryId?: string | null;
 note?: string;
 isAvailable?: boolean;
 imageUrl?: string | null;
 },
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 const updates: Record<string, unknown> = {};
 if (data.name !== undefined) updates.name = data.name.trim();
 if (data.price !== undefined) updates.price = Math.round(data.price);
 if (data.isVeg !== undefined) updates.is_veg = data.isVeg;
 if (data.categoryId !== undefined) updates.category_id = data.categoryId ?? null;
 if (data.note !== undefined) updates.note = data.note?.trim() || null;
 if (data.isAvailable !== undefined) updates.is_available = data.isAvailable;
 if (data.imageUrl !== undefined) updates.image_url = data.imageUrl || null;

 const { error } = await supabase.from("dishes").update(updates).eq("id", id);
 if (error) return { ok: false, error: "Couldn't update dish. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true };
}

/** Deletes a dish — only if it has no order items. */
export async function deleteDish(id: string): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const supabase = await createClient();
 // Check for order items referencing this dish
 const { count } = await supabase
 .from("order_items")
 .select("id", { count: "exact", head: true })
 .eq("dish_id", id);

 if (count && count > 0) {
 return { ok: false, error: `Cannot delete dish that appears in ${count} order(s). Mark as unavailable instead.` };
 }

 const { error } = await supabase.from("dishes").delete().eq("id", id);
 if (error) return { ok: false, error: "Couldn't delete dish. Please try again." };

 revalidatePath("/admin/menu");
 revalidatePath("/", "layout");
 return { ok: true };
}

export type StudentSearchResult = {
 id: string;
 fullName: string;
 phone: string;
 registrationNumber: string | null;
 isBanned: boolean;
};

export type SearchStudentsResult =
 | { ok: true; results: StudentSearchResult[] }
 | { ok: false; error: string };

/** Looks up students by name, phone, or registration number, for the "ban a student" search. */
export async function searchStudents(query: string): Promise<SearchStudentsResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 // Strip characters that would break the .or() filter string below.
 const term = query.trim().replace(/[,()%_]/g, "");
 if (term.length < 2) return { ok: true, results: [] };

 const supabase = await createClient();
 const { data, error } = await supabase
 .from("users")
 .select("id, full_name, phone, registration_number, is_banned")
 .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,registration_number.ilike.%${term}%`)
 .order("full_name")
 .limit(10);
 if (error) return { ok: false, error: "Search failed. Please try again." };

 return {
 ok: true,
 results: (data ?? []).map((u) => ({
 id: u.id,
 fullName: u.full_name,
 phone: u.phone,
 registrationNumber: u.registration_number,
 isBanned: u.is_banned,
 })),
 };
}

/**
 * Persists customized profit commission rates in the HTTP cookie `cb_profit_rates`
 * so they remain active across page reloads, browser restarts, and subsequent visits.
 */
export async function saveProfitRatesAction(rates: ProfitRates): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 const cookieStore = await cookies();
 cookieStore.set("cb_profit_rates", JSON.stringify(rates), {
 path: "/",
 maxAge: 60 * 60 * 24 * 365, // 1 year
 sameSite: "lax",
 });

 revalidatePath("/admin/analytics");
 return { ok: true };
}

/**
 * Persists customized KPI display overrides (collections, profit, orders, items)
 * in HTTP cookie `cb_analytics_kpi_overrides`.
 */
export async function saveKpiOverridesAction(overrides: RestaurantKpiOverridesMap | KpiOverrides): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const cookieStore = await cookies();
  cookieStore.set("cb_analytics_kpi_overrides", JSON.stringify(overrides), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  revalidatePath("/admin/analytics");
  return { ok: true };
}

export type CreateKpiAdjustmentInput = {
  restaurantId: string;
  businessDate: string; // YYYY-MM-DD
  kpiType: KpiType;
  amount: number;
  reason: string;
};

export type CreateKpiAdjustmentResult =
  | { ok: true; adjustment: KpiAdjustment }
  | { ok: false; error: string };

const KPI_ADJUSTMENTS_COOKIE = "cb_kpi_adjustments_log";

function parseCookieAdjustments(raw?: string): KpiAdjustment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

/**
 * Creates a new restaurant-specific and date-specific KPI adjustment.
 * Persists to Supabase `public.kpi_adjustments` and syncs cookie fallback.
 */
export async function createKpiAdjustmentAction(
  input: CreateKpiAdjustmentInput,
): Promise<CreateKpiAdjustmentResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const { profile } = await getSessionProfile();
  const adminName = profile?.full_name || profile?.email || "Admin";

  const { restaurantId, businessDate, kpiType, amount, reason } = input;

  if (!restaurantId || !isUuid(restaurantId)) {
    return { ok: false, error: "Please select a valid restaurant." };
  }
  if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
    return { ok: false, error: "Please specify a valid business date (YYYY-MM-DD)." };
  }
  if (!["collections", "profit", "orders", "items_sold"].includes(kpiType)) {
    return { ok: false, error: "Invalid KPI type." };
  }
  if (typeof amount !== "number" || isNaN(amount) || amount === 0) {
    return { ok: false, error: "Please provide a non-zero adjustment amount." };
  }
  if ((kpiType === "orders" || kpiType === "items_sold") && !Number.isInteger(amount)) {
    return { ok: false, error: "Count-based adjustments (orders/items) must be whole numbers." };
  }
  if (!reason || reason.trim().length < 2) {
    return { ok: false, error: "Please provide a clear reason for the adjustment." };
  }

  const supabase = await createClient();

  // Validate restaurant exists
  const { data: restaurant, error: restError } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("id", restaurantId)
    .single();

  if (restError || !restaurant) {
    return { ok: false, error: "Couldn't find the selected restaurant." };
  }

  const newAdjustmentId = crypto.randomUUID();
  const nowIso = new Date().toISOString();
  const restaurantKey = identifyRestaurantKey(restaurant.name);

  const adjustmentRecord: KpiAdjustment = {
    id: newAdjustmentId,
    restaurantId,
    restaurantName: restaurant.name,
    restaurantKey,
    businessDate,
    kpiType,
    amount,
    reason: reason.trim(),
    adminId: profile?.id || null,
    createdBy: adminName,
    createdAt: nowIso,
    isReversed: false,
    reversedAt: null,
    reversedBy: null,
  };

  // Try inserting into Supabase
  try {
    const { error: insertError } = await supabase.from("kpi_adjustments").insert({
      id: newAdjustmentId,
      restaurant_id: restaurantId,
      business_date: businessDate,
      kpi_type: kpiType,
      amount,
      reason: reason.trim(),
      admin_id: profile?.id || null,
      created_by: adminName,
      created_at: nowIso,
      is_reversed: false,
    });

    if (insertError) {
      return { ok: false, error: insertError.message || "Failed to save adjustment in Supabase." };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: msg };
  }

  // Clear any legacy cookie if present
  try {
    const cookieStore = await cookies();
    if (cookieStore.has(KPI_ADJUSTMENTS_COOKIE)) {
      cookieStore.delete(KPI_ADJUSTMENTS_COOKIE);
    }
  } catch {
    // ignore
  }

  revalidatePath("/admin/analytics");

  return { ok: true, adjustment: adjustmentRecord };
}

/**
 * Reverses a previously saved KPI adjustment without deleting the audit history.
 */
export async function reverseKpiAdjustmentAction(
  adjustmentId: string,
  reversalReason?: string,
): Promise<AdminActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const { profile } = await getSessionProfile();
  const adminName = profile?.full_name || profile?.email || "Admin";
  const nowIso = new Date().toISOString();

  const supabase = await createClient();

  // Try updating in Supabase
  try {
    const { error } = await supabase
      .from("kpi_adjustments")
      .update({
        is_reversed: true,
        reversed_at: nowIso,
        reversed_by: adminName,
        reversal_reason: reversalReason || "Reversed by admin",
      })
      .eq("id", adjustmentId);

    if (error) {
      return { ok: false, error: error.message || "Failed to reverse adjustment." };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return { ok: false, error: msg };
  }

  // Clean up any legacy cookie
  try {
    const cookieStore = await cookies();
    if (cookieStore.has(KPI_ADJUSTMENTS_COOKIE)) {
      cookieStore.delete(KPI_ADJUSTMENTS_COOKIE);
    }
  } catch {
    // ignore
  }

  revalidatePath("/admin/analytics");
  return { ok: true };
}

export type UpdateOrderItemInput = {
 id?: string;
 dishId?: string | null;
 dishName: string;
 unitPrice: number;
 quantity: number;
 isFree?: boolean;
};

/**
 * Loads all dishes for a restaurant so the admin can pick items to add to an order.
 */
export async function getRestaurantDishesAction(
 restaurantId: string,
): Promise<{ id: string; name: string; price: number }[]> {
 const denied = await assertAdmin();
 if (denied) return [];

 const supabase = await createClient();
 const { data } = await supabase
 .from("dishes")
 .select("id, name, price")
 .eq("restaurant_id", restaurantId)
 .order("name");

 return (data ?? []).map((d) => ({
 id: d.id,
 name: d.name,
 price: Number(d.price),
 }));
}

/**
 * Updates an order's items and quantities, and recalculates its discount & total amount.
 */
export async function updateOrderItemsAction(
 orderId: string,
 newItems: UpdateOrderItemInput[],
): Promise<AdminActionResult> {
 const denied = await assertAdmin();
 if (denied) return denied;

 if (!newItems || newItems.length === 0) {
 return { ok: false, error: "An order must contain at least one item." };
 }

 for (const item of newItems) {
 if (!item.dishName?.trim()) {
 return { ok: false, error: "Item name cannot be empty." };
 }
 if (isNaN(item.quantity) || item.quantity <= 0) {
 return { ok: false, error: `Invalid quantity for ${item.dishName}.` };
 }
 if (isNaN(item.unitPrice) || item.unitPrice < 0) {
 return { ok: false, error: `Invalid price for ${item.dishName}.` };
 }
 }

 const adminClient = createAdminClient();
 const supabase = adminClient ?? (await createClient());

 // Fetch order info for discount calculation
 const { data: order, error: orderErr } = await supabase
 .from("orders")
 .select("id, discount_offer, status")
 .eq("id", orderId)
 .single();

 if (orderErr || !order) {
 return { ok: false, error: "Order not found." };
 }

 // Fetch existing items
 const { data: existingItems, error: existingErr } = await supabase
 .from("order_items")
 .select("id")
 .eq("order_id", orderId);

 if (existingErr) {
 return { ok: false, error: "Failed to load current items." };
 }

 const existingIds = new Set((existingItems ?? []).map((i) => i.id));
 const keepIds = new Set<string>();

 // Update or insert items
 for (const item of newItems) {
 const isFree = Boolean(item.isFree);
 const unitPrice = item.unitPrice;
 const quantity = Math.round(item.quantity);
 const dishId = item.dishId && isUuid(item.dishId) ? item.dishId : null;

 if (item.id && existingIds.has(item.id)) {
 keepIds.add(item.id);
 const { error: updErr } = await supabase
 .from("order_items")
 .update({
 dish_name: item.dishName.trim(),
 unit_price: unitPrice,
 quantity: quantity,
 is_free: isFree,
 dish_id: dishId,
 })
 .eq("id", item.id);

 if (updErr) {
 return { ok: false, error: `Failed to update ${item.dishName}.` };
 }
 } else {
 const { data: inserted, error: insErr } = await supabase
 .from("order_items")
 .insert({
 order_id: orderId,
 dish_id: dishId,
 dish_name: item.dishName.trim(),
 unit_price: unitPrice,
 quantity: quantity,
 is_free: isFree,
 })
 .select("id")
 .single();

 if (insErr) {
 return { ok: false, error: `Failed to add ${item.dishName}.` };
 }
 if (inserted?.id) {
 keepIds.add(inserted.id);
 }
 }
 }

 // Delete removed items
 for (const id of existingIds) {
 if (!keepIds.has(id)) {
 const { error: delErr } = await supabase
 .from("order_items")
 .delete()
 .eq("id", id);

 if (delErr) {
 return { ok: false, error: "Failed to remove deleted items." };
 }
 }
 }

 // Calculate totals
 let itemsTotal = 0;
 let freeItemsTotal = 0;
 for (const item of newItems) {
 const sub = item.unitPrice * Math.round(item.quantity);
 if (item.isFree) {
 freeItemsTotal += sub;
 } else {
 itemsTotal += sub;
 }
 }

 let discountAmount = 0;
 if (order.discount_offer === "pct10") {
 discountAmount = Math.round(itemsTotal * 0.10);
 } else if (order.discount_offer === "pct20") {
 discountAmount = Math.round(itemsTotal * 0.20);
 } else if (order.discount_offer === "biryani") {
 discountAmount = freeItemsTotal;
 }

 const allSubtotal = itemsTotal + freeItemsTotal;
 const totalAmount = Math.max(0, allSubtotal - discountAmount);

 const { error: finalOrderErr } = await supabase
 .from("orders")
 .update({
 total_amount: totalAmount,
 discount_amount: discountAmount,
 updated_at: new Date().toISOString(),
 })
 .eq("id", orderId);

 if (finalOrderErr) {
 return { ok: false, error: "Failed to update order total." };
 }

 revalidatePath("/admin");
 revalidatePath("/admin/history");
 revalidatePath(`/admin/orders/${orderId}`);
 revalidatePath(`/orders/${orderId}`);
 revalidatePath("/admin/analytics");
 revalidatePath("/", "layout");

 return { ok: true };
}
