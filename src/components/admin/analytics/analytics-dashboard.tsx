"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackToDashboardLink } from "@/components/admin/back-to-dashboard-link";
import { PencilSimple, SlidersHorizontal } from "@/components/icons";
import { DateSelector } from "./date-selector";
import { RestaurantTabs } from "./restaurant-tabs";
import { OverviewKPIs } from "./overview-kpis";
import { RestaurantTable } from "./restaurant-table";
import { BiryaniNationBreakdownView } from "./biryani-nation-breakdown";
import { CategoryBreakdownTable } from "./category-breakdown-table";
import { DeliveredOrdersTable } from "./delivered-orders-table";
import { ProfitRateModal } from "./profit-rate-modal";
import { KpiAdjustmentModal } from "./kpi-adjustment-modal";
import { saveProfitRatesAction } from "@/lib/admin/actions";
import {
  DEFAULT_PROFIT_RATES,
  type KpiAdjustment,
  type KpiAdjustmentTotals,
  type KpiType,
  type OrdersAnalyticsData,
  type ProfitRates,
  type RestaurantFilterKey,
} from "@/lib/data/analytics-types";

type Props = {
  data: OrdersAnalyticsData;
};

const STORAGE_KEY = "cb_analytics_profit_rates";

export function AnalyticsDashboard({ data }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active profit rates state
  const [rates, setRates] = useState<ProfitRates>(data.rates || DEFAULT_PROFIT_RATES);
  const [isProfitModalOpen, setIsProfitModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"biryani" | "triangle" | "home" | "all">("biryani");

  // KPI manual adjustments state (persisted to Supabase kpi_adjustments & synced)
  const [adjustments, setAdjustments] = useState<KpiAdjustment[]>(data.adjustments || []);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentKpiTarget, setAdjustmentKpiTarget] = useState<KpiType>("profit");

  // Sync state when server data updates
  useEffect(() => {
    if (data.rates) {
      setRates(data.rates);
    }
  }, [data.rates]);

  useEffect(() => {
    if (data.adjustments) {
      setAdjustments(data.adjustments);
    }
  }, [data.adjustments]);

  // Sync profit rates with localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const loadedRates: ProfitRates = {
            biryani: {
              full: Number(parsed.biryani?.full) >= 0 ? Number(parsed.biryani?.full) : DEFAULT_PROFIT_RATES.biryani.full,
              single: Number(parsed.biryani?.single) >= 0 ? Number(parsed.biryani?.single) : DEFAULT_PROFIT_RATES.biryani.single,
              starters: Number(parsed.biryani?.starters) >= 0 ? Number(parsed.biryani?.starters) : DEFAULT_PROFIT_RATES.biryani.starters,
              chinese: Number(parsed.biryani?.chinese) >= 0 ? Number(parsed.biryani?.chinese) : DEFAULT_PROFIT_RATES.biryani.chinese,
            },
            triangle: Number(parsed.triangle) >= 0 ? Number(parsed.triangle) : DEFAULT_PROFIT_RATES.triangle,
            home: Number(parsed.home) >= 0 ? Number(parsed.home) : DEFAULT_PROFIT_RATES.home,
          };
          setRates(loadedRates);
          document.cookie = `cb_profit_rates=${encodeURIComponent(JSON.stringify(loadedRates))}; path=/; max-age=31536000; SameSite=Lax`;
        }
      } else if (data.rates) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.rates));
      }
    } catch {
      // ignore
    }
  }, [data.rates]);

  function handleRatesChange(newRates: ProfitRates) {
    setRates(newRates);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
    } catch {
      // ignore
    }

    try {
      document.cookie = `cb_profit_rates=${encodeURIComponent(JSON.stringify(newRates))}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }

    saveProfitRatesAction(newRates).catch(() => {});

    const params = new URLSearchParams(searchParams.toString());
    params.set("rate", JSON.stringify(newRates));
    router.replace(`/admin/analytics?${params.toString()}`);
  }

  function openRatesModal(tab?: "biryani" | "triangle" | "home" | "all") {
    setModalTab(tab || (data.selectedRestaurant === "all" ? "biryani" : data.selectedRestaurant));
    setIsProfitModalOpen(true);
  }

  function openAdjustmentModal(target: KpiType = "profit") {
    setAdjustmentKpiTarget(target);
    setIsAdjustmentModalOpen(true);
  }

  // Helper to get commission rate for a specific item
  function getItemRate(restaurantKey: string, categoryTag?: string, dishName?: string): number {
    if (restaurantKey === "biryani") {
      if (categoryTag === "full" || dishName?.includes("(Full)")) return rates.biryani.full;
      if (categoryTag === "single" || dishName?.includes("(Single)")) return rates.biryani.single;
      if (categoryTag === "chinese" || /fried rice|noodles/i.test(dishName || "")) return rates.biryani.chinese;
      if (categoryTag === "starters" || /65|chilli|manchurian|dragon|crispy|lollipop|fry/i.test(dishName || ""))
        return rates.biryani.starters;
      return rates.biryani.full;
    }
    if (restaurantKey === "triangle") return rates.triangle;
    if (restaurantKey === "home") return rates.home;
    return rates.biryani.full;
  }

  // Recalculate delivered orders items and profit dynamically with active rates
  const dynamicDeliveredOrders = useMemo(() => {
    return data.deliveredOrders.map((order) => {
      let orderProfit = 0;
      const items = order.items.map((item) => {
        const rate = getItemRate(order.restaurantKey, item.categoryTag, item.dishName);
        const commission = item.quantity * rate;
        orderProfit += commission;
        return {
          ...item,
          commission,
        };
      });
      return {
        ...order,
        profit: orderProfit,
        items,
      };
    });
  }, [data.deliveredOrders, rates]);

  // Recalculate grand Total Profit dynamically (baseline calculated)
  const dynamicTotalProfit = useMemo(() => {
    return dynamicDeliveredOrders.reduce((sum, o) => sum + o.profit, 0);
  }, [dynamicDeliveredOrders]);

  // Calculate active manual adjustments totals per restaurant and combined
  // ONLY includes adjustments matching the active date range [startDate, endDate]
  const activeAdjustmentsMap = useMemo(() => {
    const res: Record<RestaurantFilterKey, KpiAdjustmentTotals> = {
      all: { collections: 0, profit: 0, orders: 0, itemsSold: 0 },
      biryani: { collections: 0, profit: 0, orders: 0, itemsSold: 0 },
      triangle: { collections: 0, profit: 0, orders: 0, itemsSold: 0 },
      home: { collections: 0, profit: 0, orders: 0, itemsSold: 0 },
    };

    for (const adj of adjustments) {
      if (adj.isReversed) continue;
      // Date-specific filter: only adjustments for dates within the active range
      if (adj.businessDate < data.startDate || adj.businessDate > data.endDate) continue;

      const rKey = adj.restaurantKey;
      const amt = adj.amount;
      if (adj.kpiType === "collections") {
        if (rKey && rKey in res) res[rKey].collections += amt;
        res.all.collections += amt;
      } else if (adj.kpiType === "profit") {
        if (rKey && rKey in res) res[rKey].profit += amt;
        res.all.profit += amt;
      } else if (adj.kpiType === "orders") {
        if (rKey && rKey in res) res[rKey].orders += amt;
        res.all.orders += amt;
      } else if (adj.kpiType === "items_sold") {
        if (rKey && rKey in res) res[rKey].itemsSold += amt;
        res.all.itemsSold += amt;
      }
    }
    return res;
  }, [adjustments, data.startDate, data.endDate]);

  // Recalculate restaurant performance dynamically with adjustments applied
  const dynamicRestaurantsPerformance = useMemo(() => {
    return data.restaurantsPerformance.map((r) => {
      const matchingOrders = dynamicDeliveredOrders.filter((o) => o.restaurantId === r.id);
      const calculatedProfit = matchingOrders.reduce((sum, o) => sum + o.profit, 0);
      const calculatedCollections = r.actualCollections ?? r.collections;
      const calculatedOrders = r.actualOrders ?? r.deliveredOrders;
      const calculatedItems = r.actualItemsSold ?? r.itemsSold;

      const adj = activeAdjustmentsMap[r.key] ?? { collections: 0, profit: 0, orders: 0, itemsSold: 0 };
      const adjustedProfit = calculatedProfit + adj.profit;
      const adjustedCollections = calculatedCollections + adj.collections;
      const adjustedOrders = calculatedOrders + adj.orders;
      const adjustedItems = calculatedItems + adj.itemsSold;
      const avgOrderValue = adjustedOrders > 0 ? Math.round(adjustedCollections / adjustedOrders) : 0;
      const isEdited = adj.collections !== 0 || adj.profit !== 0 || adj.orders !== 0 || adj.itemsSold !== 0;

      return {
        ...r,
        deliveredOrders: adjustedOrders,
        itemsSold: adjustedItems,
        collections: adjustedCollections,
        profit: adjustedProfit,
        avgOrderValue,
        actualProfit: calculatedProfit,
        actualCollections: calculatedCollections,
        actualOrders: calculatedOrders,
        actualItemsSold: calculatedItems,
        adjustments: adj,
        isEdited,
      };
    });
  }, [data.restaurantsPerformance, dynamicDeliveredOrders, activeAdjustmentsMap]);

  // Recalculate Biryani Nation Breakdown dynamically
  const dynamicBiryaniBreakdown = useMemo(() => {
    if (!data.biryaniNationBreakdown) return null;
    const b = data.biryaniNationBreakdown;
    const fullProfit = b.fulls.count * rates.biryani.full;
    const singleProfit = b.singles.count * rates.biryani.single;
    const startersProfit = b.starters.count * rates.biryani.starters;
    const chineseProfit = b.chinese.count * rates.biryani.chinese;
    const othersProfit = b.others.count * rates.biryani.full;

    return {
      fulls: { ...b.fulls, rate: rates.biryani.full, profit: fullProfit },
      singles: { ...b.singles, rate: rates.biryani.single, profit: singleProfit },
      starters: { ...b.starters, rate: rates.biryani.starters, profit: startersProfit },
      chinese: { ...b.chinese, rate: rates.biryani.chinese, profit: chineseProfit },
      others: { ...b.others, rate: rates.biryani.full, profit: othersProfit },
      totalItems: b.totalItems,
      totalCollections: b.totalCollections,
      totalProfit: fullProfit + singleProfit + startersProfit + chineseProfit + othersProfit,
    };
  }, [data.biryaniNationBreakdown, rates]);

  // Recalculate Category breakdown dynamically for other restaurants
  const dynamicCategoryBreakdown = useMemo(() => {
    if (!data.categoryBreakdown) return null;
    const restRate = data.selectedRestaurant === "triangle" ? rates.triangle : rates.home;
    return data.categoryBreakdown.map((c) => ({
      ...c,
      ratePerItem: restRate,
      profit: c.itemsSold * restRate,
    }));
  }, [data.categoryBreakdown, data.selectedRestaurant, rates]);

  // Overview KPIs calculated actuals and applicable adjustment
  const { overviewCalculated, overviewAdjustments } = useMemo(() => {
    if (data.selectedRestaurant === "all") {
      return {
        overviewCalculated: {
          collections: data.totalCollections,
          profit: dynamicTotalProfit,
          orders: data.totalOrders,
          itemsSold: data.totalItemsSold,
        },
        // Combined adjustments from all restaurants
        overviewAdjustments: activeAdjustmentsMap.all,
      };
    }

    // Specific restaurant selected: applies only this restaurant's adjustments
    return {
      overviewCalculated: {
        collections: data.totalCollections,
        profit: dynamicTotalProfit,
        orders: data.totalOrders,
        itemsSold: data.totalItemsSold,
      },
      overviewAdjustments: activeAdjustmentsMap[data.selectedRestaurant] ?? {
        collections: 0,
        profit: 0,
        orders: 0,
        itemsSold: 0,
      },
    };
  }, [
    data.selectedRestaurant,
    data.totalCollections,
    dynamicTotalProfit,
    data.totalOrders,
    data.totalItemsSold,
    activeAdjustmentsMap,
  ]);

  // Stats for the Adjustment Modal preview
  const calculatedStatsForModal = useMemo(() => {
    const getStats = (key: RestaurantFilterKey) => {
      const perf = dynamicRestaurantsPerformance.find((r) => r.key === key);
      return {
        collections: perf?.actualCollections ?? perf?.collections ?? 0,
        profit: perf?.actualProfit ?? perf?.profit ?? 0,
        orders: perf?.actualOrders ?? perf?.deliveredOrders ?? 0,
        itemsSold: perf?.actualItemsSold ?? perf?.itemsSold ?? 0,
      };
    };

    return {
      all: {
        collections: data.totalCollections,
        profit: dynamicTotalProfit,
        orders: data.totalOrders,
        itemsSold: data.totalItemsSold,
      },
      biryani: getStats("biryani"),
      triangle: getStats("triangle"),
      home: getStats("home"),
    };
  }, [dynamicRestaurantsPerformance, data, dynamicTotalProfit]);

  const selectedRestName =
    data.selectedRestaurant === "biryani"
      ? "Biriyani Nation"
      : data.selectedRestaurant === "triangle"
      ? "Triangle Food Court"
      : data.selectedRestaurant === "home"
      ? "Local Home Kitchen"
      : "All Restaurants";

  function handleAdjustmentSuccess(newAdj: KpiAdjustment) {
    setAdjustments((prev) => [newAdj, ...prev.filter((a) => a.id !== newAdj.id)]);
  }

  function handleReversalSuccess(adjId: string) {
    setAdjustments((prev) =>
      prev.map((a) => (a.id === adjId ? { ...a, isReversed: true } : a)),
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* 1. Header with Back link and Date Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BackToDashboardLink />
          <h1 className="mt-3 font-heading text-2xl font-extrabold text-[#0F172A] sm:text-3xl">
            Orders Analytics
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Track your collections, orders, items sold, and profit with manual adjustments & audit logging.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00]">
              <span>Active Range:</span>
              <span className="text-[#0F172A]">{data.dateRangeLabel}</span>
            </div>

            {/* Granular Profit Rates Configuration Button */}
            <button
              type="button"
              onClick={() => openRatesModal()}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-[#FF6B00] shadow-2xs transition hover:bg-orange-50 cursor-pointer"
              title="Configure profit rates per restaurant and category"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Profit Rates</span>
              <span className="text-[10px] font-normal text-gray-400">· Configure</span>
            </button>

            {/* Manual KPI Adjustment Button */}
            <button
              type="button"
              onClick={() => openAdjustmentModal("profit")}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-[#FF6B00] shadow-2xs transition hover:bg-orange-50 cursor-pointer"
              title="Add or review manual KPI adjustments with audit history"
            >
              <PencilSimple className="size-3.5" />
              <span>Adjust KPIs</span>
              <span className="text-[10px] font-normal text-gray-400">· Audit</span>
            </button>
          </div>
        </div>

        {/* Date Selector in the top-right corner */}
        <DateSelector
          mode={data.mode}
          startDate={data.startDate}
          endDate={data.endDate}
        />
      </div>

      {/* 2. Restaurant Filters */}
      <RestaurantTabs selectedRestaurant={data.selectedRestaurant} />

      {/* 3. Overview KPI Cards (with individual Edit buttons) */}
      <OverviewKPIs
        totalCollections={overviewCalculated.collections}
        totalOrders={overviewCalculated.orders}
        totalItemsSold={overviewCalculated.itemsSold}
        totalProfit={overviewCalculated.profit}
        profitRate={rates.biryani.full}
        onChangeProfitClick={() => openRatesModal()}
        adjustments={overviewAdjustments}
        onEditKpiClick={(metric) => openAdjustmentModal(metric)}
      />

      {/* 4. Restaurant Breakdown Sections */}
      {data.selectedRestaurant === "all" && (
        <RestaurantTable
          restaurants={dynamicRestaurantsPerformance}
          totalCollections={overviewCalculated.collections + (overviewAdjustments?.collections || 0)}
        />
      )}

      {data.selectedRestaurant === "biryani" && dynamicBiryaniBreakdown && (
        <BiryaniNationBreakdownView
          breakdown={dynamicBiryaniBreakdown}
          onEditRatesClick={() => openRatesModal("biryani")}
          overrideProfit={
            activeAdjustmentsMap.biryani.profit !== 0
              ? dynamicBiryaniBreakdown.totalProfit + activeAdjustmentsMap.biryani.profit
              : null
          }
        />
      )}

      {(data.selectedRestaurant === "triangle" || data.selectedRestaurant === "home") &&
        dynamicCategoryBreakdown && (
          <CategoryBreakdownTable
            restaurantName={selectedRestName}
            categories={dynamicCategoryBreakdown}
            overrideProfit={
              activeAdjustmentsMap[data.selectedRestaurant].profit !== 0
                ? dynamicCategoryBreakdown.reduce((s, c) => s + c.profit, 0) +
                  activeAdjustmentsMap[data.selectedRestaurant].profit
                : null
            }
          />
        )}

      {/* 5. Delivered Orders Log Table (Strictly delivered orders) */}
      <DeliveredOrdersTable orders={dynamicDeliveredOrders} />

      {/* 6. Granular Profit Rates Configuration Modal */}
      <ProfitRateModal
        open={isProfitModalOpen}
        onOpenChange={setIsProfitModalOpen}
        currentRates={rates}
        totalItemsSold={data.totalItemsSold}
        onRatesChange={handleRatesChange}
        initialTab={modalTab}
      />

      {/* 7. KPI Adjustment & Audit Modal */}
      <KpiAdjustmentModal
        open={isAdjustmentModalOpen}
        onOpenChange={setIsAdjustmentModalOpen}
        initialKpiType={adjustmentKpiTarget}
        currentDate={data.endDate || data.startDate}
        startDate={data.startDate}
        endDate={data.endDate}
        selectedRestaurantKey={data.selectedRestaurant}
        partnerRestaurants={data.partnerRestaurants || []}
        calculatedStats={calculatedStatsForModal}
        adjustments={adjustments}
        onAdjustmentSuccess={handleAdjustmentSuccess}
        onReversalSuccess={handleReversalSuccess}
      />
    </div>
  );
}
