"use client";

import { useEffect, useState, useTransition } from "react";
import { Banknote, Loader2, PencilSimple, Receipt, Storefront, TrendUp, Utensils } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KpiOverrides, RestaurantFilterKey, RestaurantKpiOverridesMap } from "@/lib/data/analytics-types";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

type RestaurantActuals = {
  collections: number;
  profit: number;
  orders: number;
  itemsSold: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRestaurant: RestaurantFilterKey;
  restaurantActuals: Record<RestaurantFilterKey, RestaurantActuals>;
  allOverrides: RestaurantKpiOverridesMap;
  onSaveRestaurantOverrides: (restaurantKey: RestaurantFilterKey, overrides: KpiOverrides | null) => void;
  onResetAllOverrides: () => void;
  targetMetric?: "collections" | "profit" | "orders" | "itemsSold" | "all";
};

const RESTAURANT_TABS: { key: RestaurantFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "biryani", label: "Biriyani Nation" },
  { key: "triangle", label: "Triangle" },
  { key: "home", label: "Home Kitchen" },
];

export function EditKpisModal({
  open,
  onOpenChange,
  selectedRestaurant,
  restaurantActuals,
  allOverrides,
  onSaveRestaurantOverrides,
  onResetAllOverrides,
  targetMetric = "all",
}: Props) {
  const [activeTab, setActiveTab] = useState<RestaurantFilterKey>(selectedRestaurant || "all");
  const [collectionsStr, setCollectionsStr] = useState<string>("");
  const [profitStr, setProfitStr] = useState<string>("");
  const [ordersStr, setOrdersStr] = useState<string>("");
  const [itemsSoldStr, setItemsSoldStr] = useState<string>("");
  const [isSaving, startSave] = useTransition();

  // Reset active tab to the page's selected restaurant whenever modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(selectedRestaurant || "all");
    }
  }, [open, selectedRestaurant]);

  // Load values for the active restaurant tab whenever activeTab or allOverrides change
  useEffect(() => {
    if (open) {
      const current = allOverrides[activeTab];
      setCollectionsStr(
        typeof current?.collections === "number" ? String(current.collections) : "",
      );
      setProfitStr(
        typeof current?.profit === "number" ? String(current.profit) : "",
      );
      setOrdersStr(
        typeof current?.orders === "number" ? String(current.orders) : "",
      );
      setItemsSoldStr(
        typeof current?.itemsSold === "number" ? String(current.itemsSold) : "",
      );
    }
  }, [open, activeTab, allOverrides]);

  const currentActuals = restaurantActuals[activeTab] ?? {
    collections: 0,
    profit: 0,
    orders: 0,
    itemsSold: 0,
  };

  const activeTabLabel =
    activeTab === "biryani"
      ? "Biriyani Nation"
      : activeTab === "triangle"
      ? "Triangle Food Court"
      : activeTab === "home"
      ? "Local Home Kitchen"
      : "All Restaurants";

  function handleSave() {
    startSave(() => {
      const parsedCollections = collectionsStr.trim() === "" ? null : Number(collectionsStr);
      const parsedProfit = profitStr.trim() === "" ? null : Number(profitStr);
      const parsedOrders = ordersStr.trim() === "" ? null : Number(ordersStr);
      const parsedItemsSold = itemsSoldStr.trim() === "" ? null : Number(itemsSoldStr);

      if (parsedCollections !== null && (isNaN(parsedCollections) || parsedCollections < 0)) {
        toast.error("Please enter a valid amount for Collections.");
        return;
      }
      if (parsedProfit !== null && (isNaN(parsedProfit) || parsedProfit < 0)) {
        toast.error("Please enter a valid amount for Profit.");
        return;
      }
      if (parsedOrders !== null && (isNaN(parsedOrders) || parsedOrders < 0)) {
        toast.error("Please enter a valid count for Orders.");
        return;
      }
      if (parsedItemsSold !== null && (isNaN(parsedItemsSold) || parsedItemsSold < 0)) {
        toast.error("Please enter a valid count for Items Sold.");
        return;
      }

      const hasAnyOverride =
        parsedCollections !== null ||
        parsedProfit !== null ||
        parsedOrders !== null ||
        parsedItemsSold !== null;

      const nextOverrides: KpiOverrides | null = hasAnyOverride
        ? {
            collections: parsedCollections,
            profit: parsedProfit,
            orders: parsedOrders,
            itemsSold: parsedItemsSold,
          }
        : null;

      onSaveRestaurantOverrides(activeTab, nextOverrides);
      toast.success(`Updated KPI values for ${activeTabLabel}.`);
      onOpenChange(false);
    });
  }

  function handleResetCurrentRestaurant() {
    setCollectionsStr("");
    setProfitStr("");
    setOrdersStr("");
    setItemsSoldStr("");
    onSaveRestaurantOverrides(activeTab, null);
    toast.success(`Reset ${activeTabLabel} to actual values.`);
  }

  function handleResetAll() {
    setCollectionsStr("");
    setProfitStr("");
    setOrdersStr("");
    setItemsSoldStr("");
    onResetAllOverrides();
    toast.success("Reset all restaurants to actual values.");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (isSaving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl w-[94vw] sm:w-full max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PencilSimple className="size-4" />
            </span>
            <div>
              <DialogTitle className="font-heading text-lg font-bold text-foreground">
                Edit KPI Values
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Set custom values separately per restaurant. Actual values remain visible below each card.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Restaurant selector tabs */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {RESTAURANT_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            const hasOverrides = Boolean(
              allOverrides[tab.key]?.collections != null ||
              allOverrides[tab.key]?.profit != null ||
              allOverrides[tab.key]?.orders != null ||
              allOverrides[tab.key]?.itemsSold != null
            );

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition whitespace-nowrap active:scale-95",
                  isSelected
                    ? "bg-[#FF6B00] text-white shadow-xs"
                    : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-orange-50/60 hover:text-[#FF6B00]",
                )}
              >
                <span>{tab.label}</span>
                {hasOverrides && (
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isSelected ? "bg-white" : "bg-[#FF6B00]",
                    )}
                    title="Has custom overrides"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Target indicator */}
        <div className="mt-2 flex items-center justify-between text-xs px-1">
          <span className="font-semibold text-gray-500">
            Editing: <span className="font-bold text-gray-900">{activeTabLabel}</span>
          </span>
          <button
            type="button"
            onClick={handleResetCurrentRestaurant}
            className="text-[11px] font-semibold text-gray-500 hover:text-destructive transition underline"
          >
            Reset {RESTAURANT_TABS.find((t) => t.key === activeTab)?.label}
          </button>
        </div>

        {/* 4 Cards Inputs */}
        <div className="mt-3 flex flex-col gap-3">
          {/* 1. Collections */}
          <div
            className={`rounded-2xl border p-3 transition ${
              targetMetric === "collections"
                ? "border-[#FF6B00] bg-orange-50/40 ring-1 ring-[#FF6B00]/40"
                : "border-gray-200/90 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-orange-100 text-[#FF6B00]">
                  <Banknote className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Collections
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-500">
                Actual: <span className="font-bold text-gray-800">{formatRupees(currentActuals.collections)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={collectionsStr}
                  onChange={(e) => setCollectionsStr(e.target.value)}
                  placeholder={`Actual (${currentActuals.collections})`}
                  className="w-full rounded-xl border border-gray-300 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                />
              </div>
              {collectionsStr !== "" && (
                <button
                  type="button"
                  onClick={() => setCollectionsStr("")}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-destructive hover:border-destructive/30 transition"
                  title="Reset to actual"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 2. Total Profit */}
          <div
            className={`rounded-2xl border p-3 transition ${
              targetMetric === "profit"
                ? "border-[#FF6B00] bg-orange-50/40 ring-1 ring-[#FF6B00]/40"
                : "border-gray-200/90 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-[#FF6B00] text-white">
                  <TrendUp className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Total Profit
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-500">
                Actual: <span className="font-bold text-gray-800">{formatRupees(currentActuals.profit)}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={profitStr}
                  onChange={(e) => setProfitStr(e.target.value)}
                  placeholder={`Actual (${currentActuals.profit})`}
                  className="w-full rounded-xl border border-gray-300 bg-white py-1.5 pl-7 pr-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                />
              </div>
              {profitStr !== "" && (
                <button
                  type="button"
                  onClick={() => setProfitStr("")}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-destructive hover:border-destructive/30 transition"
                  title="Reset to actual"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 3. Orders */}
          <div
            className={`rounded-2xl border p-3 transition ${
              targetMetric === "orders"
                ? "border-[#FF6B00] bg-orange-50/40 ring-1 ring-[#FF6B00]/40"
                : "border-gray-200/90 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-orange-100 text-[#FF6B00]">
                  <Receipt className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Orders Count
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-500">
                Actual: <span className="font-bold text-gray-800">{currentActuals.orders}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={ordersStr}
                onChange={(e) => setOrdersStr(e.target.value)}
                placeholder={`Actual (${currentActuals.orders})`}
                className="w-full rounded-xl border border-gray-300 bg-white py-1.5 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
              />
              {ordersStr !== "" && (
                <button
                  type="button"
                  onClick={() => setOrdersStr("")}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-destructive hover:border-destructive/30 transition"
                  title="Reset to actual"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 4. Items Sold */}
          <div
            className={`rounded-2xl border p-3 transition ${
              targetMetric === "itemsSold"
                ? "border-[#FF6B00] bg-orange-50/40 ring-1 ring-[#FF6B00]/40"
                : "border-gray-200/90 bg-gray-50/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex size-6 items-center justify-center rounded-lg bg-orange-100 text-[#FF6B00]">
                  <Utensils className="size-3.5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Items Sold Count
                </span>
              </div>
              <div className="text-[11px] font-semibold text-gray-500">
                Actual: <span className="font-bold text-gray-800">{currentActuals.itemsSold}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="1"
                value={itemsSoldStr}
                onChange={(e) => setItemsSoldStr(e.target.value)}
                placeholder={`Actual (${currentActuals.itemsSold})`}
                className="w-full rounded-xl border border-gray-300 bg-white py-1.5 px-3 text-sm font-bold text-gray-900 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
              />
              {itemsSoldStr !== "" && (
                <button
                  type="button"
                  onClick={() => setItemsSoldStr("")}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-gray-500 hover:text-destructive hover:border-destructive/30 transition"
                  title="Reset to actual"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <button
            type="button"
            onClick={handleResetAll}
            className="text-xs font-semibold text-gray-500 hover:text-destructive transition underline underline-offset-2"
          >
            Reset all restaurants
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-[#FF6B00] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#e05f00] active:scale-95 disabled:opacity-50"
            >
              {isSaving && <Loader2 className="size-3 animate-spin" />}
              <span>Save & Apply</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
