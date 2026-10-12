"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyUser, type PushPayload } from "@/lib/notifications/send";
import type { OrderStatus } from "@/lib/data/types";
import type { OrderingMode } from "@/lib/ordering";
import { isOfferKey, type OfferKey } from "@/lib/offers";
import { formatOrderNumber, nextStatus } from "@/lib/orders/status";
import { getSessionProfile } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

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

 revalidatePath("/admin");
 return { ok: true };
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
