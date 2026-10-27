import "server-only";

import { createClient } from "@/lib/supabase/server";
import { formatOrderNumber } from "@/lib/orders/status";
import { formatOrderTimestamp, istDayKey } from "@/lib/date";
import {
  type DateFilterMode,
  type RestaurantFilterKey,
  type AnalyticsItemDetail,
  type DeliveredOrderRecord,
  type RestaurantPerformance,
  type CategoryStat,
  type BiryaniNationBreakdown,
  type OrdersAnalyticsData,
  type ProfitRates,
  DEFAULT_COMMISSION_PER_ITEM,
  DEFAULT_PROFIT_RATES,
  RESTAURANT_TABS,
} from "./analytics-types";

export * from "./analytics-types";

/**
 * Maps a restaurant name to one of the 4 tab keys.
 */
export function identifyRestaurantKey(name: string): RestaurantFilterKey {
  const lower = name.toLowerCase();
  if (lower.includes("biryani") || lower.includes("biriyani")) return "biryani";
  if (lower.includes("triangle")) return "triangle";
  if (lower.includes("home")) return "home";
  return "all";
}

/**
 * Resolves a ProfitRates configuration from an input or JSON string.
 */
export function resolveProfitRates(
  param?: string | number | Partial<ProfitRates> | null,
): ProfitRates {
  if (!param && param !== 0) return DEFAULT_PROFIT_RATES;

  if (typeof param === "object") {
    return {
      biryani: {
        full: Number(param.biryani?.full) >= 0 ? Number(param.biryani?.full) : DEFAULT_PROFIT_RATES.biryani.full,
        single: Number(param.biryani?.single) >= 0 ? Number(param.biryani?.single) : DEFAULT_PROFIT_RATES.biryani.single,
        starters: Number(param.biryani?.starters) >= 0 ? Number(param.biryani?.starters) : DEFAULT_PROFIT_RATES.biryani.starters,
        chinese: Number(param.biryani?.chinese) >= 0 ? Number(param.biryani?.chinese) : DEFAULT_PROFIT_RATES.biryani.chinese,
      },
      triangle: Number(param.triangle) >= 0 ? Number(param.triangle) : DEFAULT_PROFIT_RATES.triangle,
      home: Number(param.home) >= 0 ? Number(param.home) : DEFAULT_PROFIT_RATES.home,
    };
  }

  if (typeof param === "string") {
    try {
      const parsed = JSON.parse(param);
      if (typeof parsed === "object" && parsed !== null) {
        return resolveProfitRates(parsed);
      }
    } catch {
      // not JSON, continue to numeric check
    }
    const num = Number(param);
    if (!isNaN(num) && num >= 0) {
      return {
        biryani: { full: num, single: num, starters: num, chinese: num },
        triangle: num,
        home: num,
      };
    }
  }

  if (typeof param === "number" && param >= 0) {
    return {
      biryani: { full: param, single: param, starters: param, chinese: param },
      triangle: param,
      home: param,
    };
  }

  return DEFAULT_PROFIT_RATES;
}

/**
 * Converts IST YYYY-MM-DD into a UTC start and end Date object.
 */
function istDayBounds(dateStr: string): { startUtc: Date; endUtc: Date } {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || 1;

  // IST is UTC+5:30. Subtract 5h 30m to convert IST midnight to UTC.
  const istOffsetMs = (5 * 60 + 30) * 60_000;
  const startUtc = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - istOffsetMs);
  const endUtc = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - istOffsetMs);
  return { startUtc, endUtc };
}

/**
 * Returns today's IST date as YYYY-MM-DD.
 */
export function getTodayIstString(): string {
  return istDayKey(new Date().toISOString());
}

/**
 * Fetches and aggregates order analytics for College Bites.
 *
 * STRICT REQUIREMENT:
 * Only orders whose status is "delivered" are queried and counted.
 * Pending, confirmed, preparing, out_for_delivery, at_gate, and cancelled
 * orders are strictly excluded from all KPIs, collections, items, and profit.
 */
export async function getOrdersAnalyticsData(params?: {
  mode?: string;
  startDate?: string;
  endDate?: string;
  restaurant?: string;
  profitRate?: number | string;
  rates?: string | ProfitRates;
}): Promise<OrdersAnalyticsData> {
  const supabase = await createClient();
  const todayIst = getTodayIstString();

  // Resolve granular profit rates
  const rates: ProfitRates = resolveProfitRates(params?.rates || params?.profitRate);
  const baseProfitRate = rates.biryani.full;

  const mode: DateFilterMode = params?.mode === "custom" ? "custom" : "today";
  let startDate = params?.startDate && /^\d{4}-\d{2}-\d{2}$/.test(params.startDate) ? params.startDate : todayIst;
  let endDate = params?.endDate && /^\d{4}-\d{2}-\d{2}$/.test(params.endDate) ? params.endDate : todayIst;

  // If in Today mode, force both start and end to today
  if (mode === "today") {
    startDate = todayIst;
    endDate = todayIst;
  } else if (startDate > endDate) {
    // Swap if start date is after end date
    const temp = startDate;
    startDate = endDate;
    endDate = temp;
  }

  const selectedRestaurant: RestaurantFilterKey =
    params?.restaurant === "biryani" ||
    params?.restaurant === "triangle" ||
    params?.restaurant === "home"
      ? params.restaurant
      : "all";

  // Calculate UTC query boundaries
  const { startUtc } = istDayBounds(startDate);
  const { endUtc } = istDayBounds(endDate);

  // 1. Fetch all restaurants for names, IDs, and active statuses
  const { data: rawRestaurants } = await supabase
    .from("restaurants")
    .select("id, name, is_active")
    .order("name");

  const restaurants = rawRestaurants ?? [];
  const restaurantMap = new Map<string, { id: string; name: string; isActive: boolean; key: RestaurantFilterKey }>();

  for (const r of restaurants) {
    const key = identifyRestaurantKey(r.name);
    restaurantMap.set(r.id, { id: r.id, name: r.name, isActive: r.is_active, key });
  }

  // 2. Fetch dish categories for category-level breakdown
  const { data: rawCategories } = await supabase
    .from("dish_categories")
    .select("id, restaurant_id, name");
  const categoryNameMap = new Map<string, string>();
  for (const c of rawCategories ?? []) {
    categoryNameMap.set(c.id, c.name);
  }

  // 3. Fetch dishes to map dish_id to category name
  const { data: rawDishes } = await supabase
    .from("dishes")
    .select("id, category_id, name");
  const dishToCategoryMap = new Map<string, string>();
  for (const d of rawDishes ?? []) {
    if (d.category_id && categoryNameMap.has(d.category_id)) {
      dishToCategoryMap.set(d.id, categoryNameMap.get(d.category_id)!);
    }
  }

  // 4. Query ONLY delivered orders in the given date range (STRICT REQUIREMENT)
  let ordersQuery = supabase
    .from("orders")
    .select(`
      id,
      daily_number,
      restaurant_id,
      status,
      total_amount,
      contact_phone,
      created_at,
      users:user_id ( full_name ),
      restaurants:restaurant_id ( id, name ),
      order_items ( id, dish_id, dish_name, unit_price, quantity, subtotal )
    `)
    .eq("status", "delivered")
    .gte("created_at", startUtc.toISOString())
    .lte("created_at", endUtc.toISOString())
    .order("created_at", { ascending: false });

  // If a specific restaurant is selected, filter at query level
  if (selectedRestaurant !== "all") {
    const matchingRest = restaurants.find((r) => identifyRestaurantKey(r.name) === selectedRestaurant);
    if (matchingRest) {
      ordersQuery = ordersQuery.eq("restaurant_id", matchingRest.id);
    }
  }

  const { data: deliveredRows, error: ordersError } = await ordersQuery;
  if (ordersError) {
    console.error("Error fetching analytics delivered orders:", ordersError);
  }

  // Process delivered orders and compute KPIs
  const deliveredOrders: DeliveredOrderRecord[] = [];
  const restaurantStatsMap = new Map<
    string,
    {
      deliveredOrders: number;
      itemsSold: number;
      collections: number;
      profit: number;
    }
  >();

  // Initialize stats for each restaurant
  for (const r of restaurants) {
    restaurantStatsMap.set(r.id, {
      deliveredOrders: 0,
      itemsSold: 0,
      collections: 0,
      profit: 0,
    });
  }

  // Specific Biryani Nation breakdown counters
  const biryaniBreakdown: BiryaniNationBreakdown = {
    fulls: { count: 0, collections: 0, rate: rates.biryani.full, profit: 0 },
    singles: { count: 0, collections: 0, rate: rates.biryani.single, profit: 0 },
    starters: { count: 0, collections: 0, rate: rates.biryani.starters, profit: 0 },
    chinese: { count: 0, collections: 0, rate: rates.biryani.chinese, profit: 0 },
    others: { count: 0, collections: 0, rate: rates.biryani.full, profit: 0 },
    totalItems: 0,
    totalCollections: 0,
    totalProfit: 0,
  };

  // Category stats map for restaurant-specific breakdown
  const categoryMap = new Map<string, { itemsSold: number; collections: number; rate: number }>();

  let totalCollections = 0;
  let totalItemsSold = 0;
  let totalProfit = 0;

  for (const o of deliveredRows ?? []) {
    // Distinct order count guarantee
    const restaurantInfo = restaurantMap.get(o.restaurant_id) ?? {
      id: o.restaurant_id,
      name: (o.restaurants as { name?: string } | null)?.name ?? "Unknown Restaurant",
      isActive: true,
      key: identifyRestaurantKey((o.restaurants as { name?: string } | null)?.name ?? ""),
    };

    const orderAmount = Number(o.total_amount) || 0;
    totalCollections += orderAmount;

    let orderItemsCount = 0;
    let orderProfit = 0;
    const itemDetails: AnalyticsItemDetail[] = [];

    const rawItems = (o.order_items as Array<{
      id: string;
      dish_id: string | null;
      dish_name: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }>) ?? [];

    for (const item of rawItems) {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const subtotal = Number(item.subtotal) || unitPrice * qty;

      let itemCommissionRate = baseProfitRate;
      let categoryTag: "full" | "single" | "starters" | "chinese" | "other" = "other";

      if (restaurantInfo.key === "biryani") {
        const dishCatName = (item.dish_id && dishToCategoryMap.get(item.dish_id)) || "";
        const isChinese =
          dishCatName.toLowerCase().includes("chinese") ||
          /fried rice|noodles/i.test(item.dish_name);
        const isStarter =
          dishCatName.toLowerCase().includes("starter") ||
          /65|chilli|manchurian|dragon|crispy|lollipop|fry/i.test(item.dish_name);

        if (item.dish_name.includes("(Full)")) {
          categoryTag = "full";
          itemCommissionRate = rates.biryani.full;
          biryaniBreakdown.fulls.count += qty;
          biryaniBreakdown.fulls.collections += subtotal;
          biryaniBreakdown.fulls.profit += qty * itemCommissionRate;
        } else if (item.dish_name.includes("(Single)")) {
          categoryTag = "single";
          itemCommissionRate = rates.biryani.single;
          biryaniBreakdown.singles.count += qty;
          biryaniBreakdown.singles.collections += subtotal;
          biryaniBreakdown.singles.profit += qty * itemCommissionRate;
        } else if (isChinese) {
          categoryTag = "chinese";
          itemCommissionRate = rates.biryani.chinese;
          biryaniBreakdown.chinese.count += qty;
          biryaniBreakdown.chinese.collections += subtotal;
          biryaniBreakdown.chinese.profit += qty * itemCommissionRate;
        } else if (isStarter) {
          categoryTag = "starters";
          itemCommissionRate = rates.biryani.starters;
          biryaniBreakdown.starters.count += qty;
          biryaniBreakdown.starters.collections += subtotal;
          biryaniBreakdown.starters.profit += qty * itemCommissionRate;
        } else {
          categoryTag = "other";
          itemCommissionRate = rates.biryani.full;
          biryaniBreakdown.others.count += qty;
          biryaniBreakdown.others.collections += subtotal;
          biryaniBreakdown.others.profit += qty * itemCommissionRate;
        }
      } else if (restaurantInfo.key === "triangle") {
        itemCommissionRate = rates.triangle;
      } else if (restaurantInfo.key === "home") {
        itemCommissionRate = rates.home;
      }

      const commission = qty * itemCommissionRate;
      orderItemsCount += qty;
      orderProfit += commission;

      itemDetails.push({
        dishName: item.dish_name,
        quantity: qty,
        unitPrice,
        subtotal,
        commission,
        categoryTag,
      });

      // Track Category breakdown for other restaurants
      const catName =
        (item.dish_id && dishToCategoryMap.get(item.dish_id)) ||
        (item.dish_name.includes("(Full)")
          ? "Full Biryani"
          : item.dish_name.includes("(Single)")
          ? "Single Biryani"
          : "Other Items");

      const existingCat = categoryMap.get(catName) ?? {
        itemsSold: 0,
        collections: 0,
        rate: itemCommissionRate,
      };
      existingCat.itemsSold += qty;
      existingCat.collections += subtotal;
      existingCat.rate = itemCommissionRate;
      categoryMap.set(catName, existingCat);
    }

    totalItemsSold += orderItemsCount;
    totalProfit += orderProfit;

    // Update restaurant totals
    const rStat = restaurantStatsMap.get(o.restaurant_id);
    if (rStat) {
      rStat.deliveredOrders += 1;
      rStat.itemsSold += orderItemsCount;
      rStat.collections += orderAmount;
      rStat.profit += orderProfit;
    }

    const studentName =
      (o.users as { full_name?: string } | null)?.full_name || "SRM Student";

    deliveredOrders.push({
      id: o.id,
      dailyNumber: o.daily_number,
      token: formatOrderNumber(o.daily_number),
      createdAt: o.created_at,
      formattedTime: formatOrderTimestamp(o.created_at),
      studentName,
      contactPhone: o.contact_phone,
      restaurantId: o.restaurant_id,
      restaurantName: restaurantInfo.name,
      restaurantKey: restaurantInfo.key,
      itemCount: orderItemsCount,
      items: itemDetails,
      totalAmount: orderAmount,
      profit: orderProfit,
      status: "delivered",
    });
  }

  // Update Biryani Nation totals
  biryaniBreakdown.totalItems =
    biryaniBreakdown.fulls.count +
    biryaniBreakdown.singles.count +
    biryaniBreakdown.starters.count +
    biryaniBreakdown.chinese.count +
    biryaniBreakdown.others.count;
  biryaniBreakdown.totalCollections =
    biryaniBreakdown.fulls.collections +
    biryaniBreakdown.singles.collections +
    biryaniBreakdown.starters.collections +
    biryaniBreakdown.chinese.collections +
    biryaniBreakdown.others.collections;
  biryaniBreakdown.totalProfit =
    biryaniBreakdown.fulls.profit +
    biryaniBreakdown.singles.profit +
    biryaniBreakdown.starters.profit +
    biryaniBreakdown.chinese.profit +
    biryaniBreakdown.others.profit;

  // Format restaurants performance list
  const restaurantsPerformance: RestaurantPerformance[] = restaurants.map((r) => {
    const s = restaurantStatsMap.get(r.id) ?? {
      deliveredOrders: 0,
      itemsSold: 0,
      collections: 0,
      profit: 0,
    };
    const avgOrderValue = s.deliveredOrders > 0 ? Math.round(s.collections / s.deliveredOrders) : 0;
    return {
      id: r.id,
      name: r.name,
      key: identifyRestaurantKey(r.name),
      isActive: r.is_active,
      deliveredOrders: s.deliveredOrders,
      itemsSold: s.itemsSold,
      collections: s.collections,
      profit: s.profit,
      avgOrderValue,
    };
  });

  // Category breakdown list
  const categoryBreakdown: CategoryStat[] = Array.from(categoryMap.entries())
    .map(([categoryName, data]) => ({
      categoryName,
      itemsSold: data.itemsSold,
      collections: data.collections,
      ratePerItem: data.rate,
      profit: data.itemsSold * data.rate,
    }))
    .sort((a, b) => b.itemsSold - a.itemsSold);

  // Format date range label
  let dateRangeLabel = "";
  if (mode === "today") {
    dateRangeLabel = `Today (${new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })})`;
  } else {
    const fromLabel = new Date(startDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const toLabel = new Date(endDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    dateRangeLabel = startDate === endDate ? fromLabel : `${fromLabel} – ${toLabel}`;
  }

  return {
    mode,
    startDate,
    endDate,
    dateRangeLabel,
    selectedRestaurant,
    profitRate: baseProfitRate,
    rates,
    totalCollections,
    totalOrders: deliveredOrders.length,
    totalItemsSold,
    totalProfit,
    restaurantsPerformance,
    biryaniNationBreakdown: selectedRestaurant === "biryani" ? biryaniBreakdown : null,
    categoryBreakdown: selectedRestaurant !== "all" && selectedRestaurant !== "biryani" ? categoryBreakdown : null,
    deliveredOrders,
  };
}
