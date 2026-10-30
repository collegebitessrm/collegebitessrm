"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Plus, RotateCcw, Storefront, TrendUp, Utensils } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { DEFAULT_PROFIT_RATES, type ProfitRates } from "@/lib/data/analytics-types";

type Props = {
  currentRates: ProfitRates;
  totalItemsSold: number;
  onRatesChange: (newRates: ProfitRates) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "biryani" | "triangle" | "home" | "all";
};

export function ProfitRateModal({
  currentRates,
  totalItemsSold,
  onRatesChange,
  open,
  onOpenChange,
  initialTab = "biryani",
}: Props) {
  const [rates, setRates] = useState<ProfitRates>(currentRates);
  const [activeTab, setActiveTab] = useState<"biryani" | "triangle" | "home" | "all">(initialTab);

  useEffect(() => {
    setRates(currentRates);
  }, [currentRates]);

  function handleOpenChange(next: boolean) {
    if (next) {
      setRates(currentRates);
      setActiveTab(initialTab);
    }
    onOpenChange(next);
  }

  function updateBiryaniRate(key: keyof ProfitRates["biryani"], val: number) {
    setRates((prev) => ({
      ...prev,
      biryani: {
        ...prev.biryani,
        [key]: Math.max(0, isNaN(val) ? 0 : val),
      },
    }));
  }

  function updateRestaurantRate(key: "triangle" | "home", val: number) {
    setRates((prev) => ({
      ...prev,
      [key]: Math.max(0, isNaN(val) ? 0 : val),
    }));
  }

  function applyGlobalPreset(amt: number) {
    setRates({
      biryani: {
        full: amt,
        single: amt,
        starters: amt,
        chinese: amt,
      },
      triangle: amt,
      home: amt,
    });
  }

  function handleSave() {
    onRatesChange(rates);
    onOpenChange(false);
    toast.success("Profit rates updated successfully.");
  }

  function handleReset() {
    setRates(DEFAULT_PROFIT_RATES);
    onRatesChange(DEFAULT_PROFIT_RATES);
    onOpenChange(false);
    toast.success("Profit rates reset to default (₹10/item).");
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl w-[94vw] sm:w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
              <TrendUp className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">
                Configure Profit Rates
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-gray-500">
                Set profit rates per restaurant and by category for Biriyani Nation.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Global Quick Presets */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl bg-gray-50/80 p-3">
          <span className="text-xs font-semibold text-gray-600">Quick set all:</span>
          <div className="flex flex-wrap gap-1.5">
            {[10, 15, 20, 25].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => applyGlobalPreset(amt)}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0F172A] transition hover:border-[#FF6B00] hover:text-[#FF6B00] active:scale-95"
              >
                ₹{amt} {amt === 10 ? "(Default)" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Sub-tabs */}
        <div className="mt-4 flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("biryani")}
            className={cn(
              "flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 outline-none text-center",
              activeTab === "biryani"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-gray-500 hover:text-[#0F172A]",
            )}
          >
            Biriyani Nation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("triangle")}
            className={cn(
              "flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 outline-none text-center",
              activeTab === "triangle"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-gray-500 hover:text-[#0F172A]",
            )}
          >
            Triangle
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={cn(
              "flex-1 pb-2.5 text-xs font-bold transition-all border-b-2 outline-none text-center",
              activeTab === "home"
                ? "border-[#FF6B00] text-[#FF6B00]"
                : "border-transparent text-gray-500 hover:text-[#0F172A]",
            )}
          >
            Home Kitchen
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "biryani" && (
            <div className="flex flex-col gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">
                  Biriyani Nation Categories
                </span>
                <span className="text-[11px] text-gray-400">Profit per dish</span>
              </div>

              {/* 1. Full Biryani */}
              <RateInputRow
                label="Full Biryani"
                description="Dishes with '(Full)' portion"
                value={rates.biryani.full}
                onChange={(val) => updateBiryaniRate("full", val)}
              />

              {/* 2. Single Biryani */}
              <RateInputRow
                label="Single Biryani"
                description="Dishes with '(Single)' portion"
                value={rates.biryani.single}
                onChange={(val) => updateBiryaniRate("single", val)}
              />

              {/* 3. Starters */}
              <RateInputRow
                label="Starters"
                description="Chicken 65, Manchurian, Crispy, Chilli, etc."
                value={rates.biryani.starters}
                onChange={(val) => updateBiryaniRate("starters", val)}
              />

              {/* 4. Chinese */}
              <RateInputRow
                label="Chinese"
                description="Fried Rice, Noodles, etc."
                value={rates.biryani.chinese}
                onChange={(val) => updateBiryaniRate("chinese", val)}
              />
            </div>
          )}

          {activeTab === "triangle" && (
            <div className="flex flex-col gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">
                  Triangle Food Court Profit
                </span>
                <span className="text-[11px] text-gray-400">Profit per dish</span>
              </div>
              <RateInputRow
                label="All Menu Items"
                description="Starters, Rice, Noodles, and Biryani items"
                value={rates.triangle}
                onChange={(val) => updateRestaurantRate("triangle", val)}
              />
            </div>
          )}

          {activeTab === "home" && (
            <div className="flex flex-col gap-2.5 sm:gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F172A]">
                  Local Home Kitchen Profit
                </span>
                <span className="text-[11px] text-gray-400">Profit per dish</span>
              </div>
              <RateInputRow
                label="All Menu Items"
                description="Biryanis, Starters, Chinese, and Curries"
                value={rates.home}
                onChange={(val) => updateRestaurantRate("home", val)}
              />
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="mt-5 border-t border-gray-100 pt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] sm:text-xs text-gray-500">
            <span>Active rates:</span>
            <span className="font-semibold text-[#0F172A]">
              Full: ₹{rates.biryani.full} · Single: ₹{rates.biryani.single} · Starters: ₹{rates.biryani.starters} · Chinese: ₹{rates.biryani.chinese}
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-bold text-gray-600 transition hover:bg-gray-50 active:scale-95"
            >
              <RotateCcw className="size-3.5" />
              Reset All (₹10)
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl bg-[#FF6B00] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#E05E00] active:scale-95"
            >
              <Check className="size-3.5" />
              Save & Recalculate
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RateInputRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-2xs">
      <div className="min-w-0 flex-1">
        <p className="font-bold text-xs sm:text-sm text-[#0F172A]">{label}</p>
        <p className="text-[10px] sm:text-[11px] text-gray-400 line-clamp-1">{description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 active:scale-90"
        >
          <Minus className="size-3" />
        </button>

        <div className="relative w-16 sm:w-20">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#0F172A]">
            ₹
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={isNaN(value) ? "" : value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/70 pl-5 pr-1.5 text-center text-xs font-bold text-[#0F172A] outline-none transition focus:border-[#FF6B00] focus:bg-white"
          />
        </div>

        <button
          type="button"
          onClick={() => onChange((isNaN(value) ? 0 : value) + 1)}
          className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 transition hover:bg-gray-100 active:scale-90"
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
