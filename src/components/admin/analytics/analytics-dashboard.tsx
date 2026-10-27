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
import { DEFAULT_PROFIT_RATES, type OrdersAnalyticsData, type ProfitRates } from "@/lib/data/analytics-types";

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

  // Sync with localStorage on client mount if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setRates((prev) => ({
            biryani: {
              full: parsed.biryani?.full ?? prev.biryani.full,
              single: parsed.biryani?.single ?? prev.biryani.single,
              starters: parsed.biryani?.starters ?? prev.biryani.starters,
              chinese: parsed.biryani?.chinese ?? prev.biryani.chinese,
            },
            triangle: parsed.triangle ?? prev.triangle,
            home: parsed.home ?? prev.home,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handleRatesChange(newRates: ProfitRates) {
    setRates(newRates);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRates));
    } catch {
      // ignore
    }

    // Sync to URL query param
    const params = new URLSearchParams(searchParams.toString());
    params.set("rate", JSON.stringify(newRates));
    router.replace(`/admin/analytics?${params.toString()}`);
  }

  function openRatesModal(tab?: "biryani" | "triangle" | "home" | "all") {
    setModalTab(tab || (data.selectedRestaurant === "all" ? "biryani" : data.selectedRestaurant));
    setIsProfitModalOpen(true);
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

  // Recalculate delivered orders items and profit dynamically
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

  // Recalculate restaurant performance dynamically
  const dynamicRestaurantsPerformance = useMemo(() => {
    return data.restaurantsPerformance.map((r) => {
      // Sum profit from orders of this restaurant
      const matchingOrders = dynamicDeliveredOrders.filter((o) => o.restaurantId === r.id);
      const profit = matchingOrders.reduce((sum, o) => sum + o.profit, 0);
      return {
        ...r,
        profit,
      };
    });
  }, [data.restaurantsPerformance, dynamicDeliveredOrders]);

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

  // Recalculate grand Total Profit dynamically
  const dynamicTotalProfit = useMemo(() => {
    return dynamicDeliveredOrders.reduce((sum, o) => sum + o.profit, 0);
  }, [dynamicDeliveredOrders]);

  const selectedRestName =
    data.selectedRestaurant === "biryani"
      ? "Biriyani Nation"
      : data.selectedRestaurant === "triangle"
      ? "Triangle Food Court"
      : data.selectedRestaurant === "home"
      ? "Local Home Kitchen"
      : "All Restaurants";

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
            Track your collections, orders, items sold, and profit in one place.
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
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-bold text-[#FF6B00] shadow-2xs transition hover:bg-orange-50"
              title="Configure profit rates per restaurant and category"
            >
              <SlidersHorizontal className="size-3.5" />
              <span>Profit Rates</span>
              <span className="text-[10px] font-normal text-gray-400">· Configure</span>
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

      {/* 3. Overview KPI Cards */}
      <OverviewKPIs
        totalCollections={data.totalCollections}
        totalOrders={data.totalOrders}
        totalItemsSold={data.totalItemsSold}
        totalProfit={dynamicTotalProfit}
        profitRate={rates.biryani.full}
        onChangeProfitClick={() => openRatesModal()}
      />

      {/* 4. Restaurant Breakdown Sections */}
      {data.selectedRestaurant === "all" && (
        <RestaurantTable
          restaurants={dynamicRestaurantsPerformance}
          totalCollections={data.totalCollections}
        />
      )}

      {data.selectedRestaurant === "biryani" && dynamicBiryaniBreakdown && (
        <BiryaniNationBreakdownView
          breakdown={dynamicBiryaniBreakdown}
          onEditRatesClick={() => openRatesModal("biryani")}
        />
      )}

      {(data.selectedRestaurant === "triangle" || data.selectedRestaurant === "home") &&
        dynamicCategoryBreakdown && (
          <CategoryBreakdownTable
            restaurantName={selectedRestName}
            categories={dynamicCategoryBreakdown}
          />
        )}

      {/* 5. Delivered Orders Log Table */}
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
    </div>
  );
}
