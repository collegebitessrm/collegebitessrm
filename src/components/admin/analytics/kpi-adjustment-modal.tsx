"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Banknote,
  Check,
  History,
  Loader2,
  PencilSimple,
  Receipt,
  Storefront,
  TrendUp,
  Utensils,
  X,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createKpiAdjustmentAction,
  reverseKpiAdjustmentAction,
} from "@/lib/admin/actions";
import type {
  KpiAdjustment,
  KpiAdjustmentTotals,
  KpiType,
  PartnerRestaurantInfo,
  RestaurantFilterKey,
} from "@/lib/data/analytics-types";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKpiType?: KpiType;
  currentDate: string; // YYYY-MM-DD
  startDate: string;
  endDate: string;
  selectedRestaurantKey: RestaurantFilterKey;
  partnerRestaurants: PartnerRestaurantInfo[];
  // Baseline calculated stats per restaurant key
  calculatedStats: Record<RestaurantFilterKey, { collections: number; profit: number; orders: number; itemsSold: number }>;
  // Current adjustments list
  adjustments: KpiAdjustment[];
  onAdjustmentSuccess?: (newAdjustment: KpiAdjustment) => void;
  onReversalSuccess?: (adjustmentId: string) => void;
};

const KPI_CONFIG: Record<
  KpiType,
  { label: string; unit: string; isCurrency: boolean; icon: any; placeholder: string; countLabel: string }
> = {
  collections: {
    label: "Collections",
    unit: "₹",
    isCurrency: true,
    icon: Banknote,
    placeholder: "e.g. 500",
    countLabel: "monetary amount",
  },
  profit: {
    label: "Total Profit",
    unit: "₹",
    isCurrency: true,
    icon: TrendUp,
    placeholder: "e.g. 90",
    countLabel: "commission amount",
  },
  orders: {
    label: "Delivered Orders",
    unit: "orders",
    isCurrency: false,
    icon: Receipt,
    placeholder: "e.g. 2",
    countLabel: "whole number of orders",
  },
  items_sold: {
    label: "Items Sold",
    unit: "items",
    isCurrency: false,
    icon: Utensils,
    placeholder: "e.g. 3",
    countLabel: "whole number of items",
  },
};

export function KpiAdjustmentModal({
  open,
  onOpenChange,
  initialKpiType = "profit",
  currentDate,
  startDate,
  endDate,
  selectedRestaurantKey,
  partnerRestaurants,
  calculatedStats,
  adjustments,
  onAdjustmentSuccess,
  onReversalSuccess,
}: Props) {
  // Modal navigation tab: "adjust" | "history"
  const [modalTab, setModalTab] = useState<"adjust" | "history">("adjust");

  // Active form inputs
  const [activeKpi, setActiveKpi] = useState<KpiType>(initialKpiType);
  const [selectedRestId, setSelectedRestId] = useState<string>("");
  const [businessDate, setBusinessDate] = useState<string>(currentDate);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [amountStr, setAmountStr] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const [isSaving, startSave] = useTransition();
  const [reversingId, setReversingId] = useState<string | null>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (open) {
      setModalTab("adjust");
      setActiveKpi(initialKpiType);
      setBusinessDate(currentDate || startDate || new Date().toISOString().split("T")[0]);
      setOperation("add");
      setAmountStr("");
      setReason("");

      // Pick default restaurant
      if (selectedRestaurantKey && selectedRestaurantKey !== "all") {
        const matching = partnerRestaurants.find((r) => r.key === selectedRestaurantKey);
        if (matching) {
          setSelectedRestId(matching.id);
          return;
        }
      }
      // If "all" or not found, default to first partner restaurant
      if (partnerRestaurants.length > 0) {
        setSelectedRestId(partnerRestaurants[0].id);
      }
    }
  }, [open, initialKpiType, selectedRestaurantKey, currentDate, startDate, partnerRestaurants]);

  const selectedRest = useMemo(() => {
    return (
      partnerRestaurants.find((r) => r.id === selectedRestId) ||
      partnerRestaurants[0] || { id: "", name: "Partner Restaurant", key: "biryani" as RestaurantFilterKey }
    );
  }, [partnerRestaurants, selectedRestId]);

  // Current calculated baseline for this restaurant & KPI
  const currentBaseline = useMemo(() => {
    const restKey = selectedRest?.key || "biryani";
    const stats = calculatedStats[restKey] ?? { collections: 0, profit: 0, orders: 0, itemsSold: 0 };
    switch (activeKpi) {
      case "collections":
        return stats.collections;
      case "profit":
        return stats.profit;
      case "orders":
        return stats.orders;
      case "items_sold":
        return stats.itemsSold;
    }
  }, [selectedRest, calculatedStats, activeKpi]);

  // Existing active adjustments for this restaurant, KPI, and active date range
  const existingAdjustmentsSum = useMemo(() => {
    if (!selectedRest) return 0;
    return adjustments
      .filter(
        (a) =>
          !a.isReversed &&
          a.restaurantId === selectedRest.id &&
          a.kpiType === activeKpi &&
          a.businessDate >= startDate &&
          a.businessDate <= endDate,
      )
      .reduce((sum, a) => sum + a.amount, 0);
  }, [adjustments, selectedRest, activeKpi, startDate, endDate]);

  // Current adjusted total before this new adjustment
  const currentTotal = currentBaseline + existingAdjustmentsSum;

  // Parsed amount
  const parsedMagnitude = useMemo(() => {
    const val = parseFloat(amountStr.trim());
    return isNaN(val) ? 0 : Math.abs(val);
  }, [amountStr]);

  const signedAdjustment = operation === "add" ? parsedMagnitude : -parsedMagnitude;
  const previewNewTotal = currentTotal + signedAdjustment;

  const config = KPI_CONFIG[activeKpi];
  const KpiIcon = config.icon;

  // Relevant adjustments list for audit trail
  const relevantAdjustments = useMemo(() => {
    return adjustments.filter((a) => {
      if (selectedRestId && a.restaurantId !== selectedRestId) return false;
      return true;
    });
  }, [adjustments, selectedRestId]);

  function formatValue(num: number, isCurrency: boolean): string {
    if (isCurrency) return formatRupees(num);
    return `${num.toLocaleString("en-IN")}`;
  }

  function handleSave() {
    if (!selectedRestId) {
      toast.error("Please select a partner restaurant.");
      return;
    }
    if (!businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
      toast.error("Please enter a valid business date (YYYY-MM-DD).");
      return;
    }
    if (parsedMagnitude <= 0) {
      toast.error("Please enter a positive adjustment amount.");
      return;
    }
    if (!config.isCurrency && !Number.isInteger(parsedMagnitude)) {
      toast.error(`Adjustment for ${config.label} must be a whole integer.`);
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for this adjustment for the audit log.");
      return;
    }

    startSave(async () => {
      const result = await createKpiAdjustmentAction({
        restaurantId: selectedRestId,
        businessDate,
        kpiType: activeKpi,
        amount: signedAdjustment,
        reason: reason.trim(),
      });

      if (result.ok) {
        toast.success(
          `Adjustment of ${signedAdjustment > 0 ? "+" : "−"}${
            config.isCurrency ? formatRupees(parsedMagnitude) : `${parsedMagnitude} ${config.unit}`
          } saved for ${selectedRest.name}.`,
        );
        onAdjustmentSuccess?.(result.adjustment);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  async function handleReverse(adjustment: KpiAdjustment) {
    if (
      !confirm(
        `Are you sure you want to reverse this adjustment of ${
          adjustment.amount > 0 ? "+" : ""
        }${adjustment.amount} for ${adjustment.restaurantName || "this restaurant"}?`,
      )
    ) {
      return;
    }

    setReversingId(adjustment.id);
    const result = await reverseKpiAdjustmentAction(adjustment.id, "Reversed by admin from audit dialog");
    setReversingId(null);

    if (result.ok) {
      toast.success("Adjustment reversed. Audit trail retained.");
      onReversalSuccess?.(adjustment.id);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl overflow-hidden rounded-3xl border border-orange-100 bg-white p-0 shadow-2xl">
        {/* Header with Orange Accent */}
        <div className="bg-gradient-to-r from-orange-500 via-[#FF6B00] to-orange-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                <PencilSimple className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">
                  KPI Adjustment & Audit
                </DialogTitle>
                <DialogDescription className="text-xs text-orange-100">
                  Restaurant-specific and date-specific manual adjustments with full audit history
                </DialogDescription>
              </div>
            </div>

            {/* Modal Navigation Pills */}
            <div className="flex items-center rounded-full bg-white/15 p-0.5 text-xs font-semibold backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setModalTab("adjust")}
                className={cn(
                  "rounded-full px-3 py-1 transition-all",
                  modalTab === "adjust" ? "bg-white text-[#FF6B00] shadow-xs" : "text-white/90 hover:text-white",
                )}
              >
                Adjust
              </button>
              <button
                type="button"
                onClick={() => setModalTab("history")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 transition-all",
                  modalTab === "history" ? "bg-white text-[#FF6B00] shadow-xs" : "text-white/90 hover:text-white",
                )}
              >
                <History className="size-3" />
                <span>Audit Log</span>
                {relevantAdjustments.length > 0 && (
                  <span className="ml-0.5 rounded-full bg-orange-500/30 px-1.5 py-0.2 text-[10px] font-bold">
                    {relevantAdjustments.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Adjust KPI Form */}
        {modalTab === "adjust" && (
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* 1. Partner Restaurant Selector */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Target Restaurant
              </label>
              <div className="grid grid-cols-3 gap-2">
                {partnerRestaurants.map((r) => {
                  const isSelected = selectedRestId === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRestId(r.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all active:scale-95 text-center",
                        isSelected
                          ? "border-[#FF6B00] bg-orange-50/80 text-[#FF6B00] shadow-xs ring-2 ring-[#FF6B00]/20"
                          : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/30",
                      )}
                    >
                      <Storefront className={cn("size-4 mb-1", isSelected ? "text-[#FF6B00]" : "text-gray-400")} />
                      <span className="truncate w-full">{r.name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Adjustment affects <span className="font-semibold text-gray-800">{selectedRest.name}</span> only. Other restaurants remain untouched.
              </p>
            </div>

            {/* 2. KPI Type Selection Tabs */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Metric to Adjust
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(KPI_CONFIG) as KpiType[]).map((type) => {
                  const c = KPI_CONFIG[type];
                  const Icon = c.icon;
                  const isSelected = activeKpi === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveKpi(type)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border p-2 text-xs font-semibold transition-all active:scale-95",
                        isSelected
                          ? "border-[#FF6B00] bg-[#FF6B00] text-white shadow-xs"
                          : "border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/40",
                      )}
                    >
                      <Icon className="size-3.5 shrink-0" />
                      <span className="truncate">{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Business Date & Current Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                  Business Date
                </label>
                <input
                  type="date"
                  value={businessDate}
                  onChange={(e) => setBusinessDate(e.target.value)}
                  className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                />
                <p className="mt-1 text-[10px] text-gray-400">
                  Adjustment applies strictly to this business date.
                </p>
              </div>

              {/* Current Calculated & Adjusted Info Card */}
              <div className="rounded-xl border border-gray-200/90 bg-gray-50/70 p-3 text-xs flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Current Status
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-gray-600 font-medium">Calculated:</span>
                  <span className="font-bold text-gray-900 tabular-nums">
                    {formatValue(currentBaseline, config.isCurrency)}
                  </span>
                </div>
                {existingAdjustmentsSum !== 0 && (
                  <div className="flex items-baseline justify-between text-orange-600 font-semibold">
                    <span>Saved Adjustments:</span>
                    <span className="tabular-nums">
                      {existingAdjustmentsSum > 0 ? "+" : ""}
                      {formatValue(existingAdjustmentsSum, config.isCurrency)}
                    </span>
                  </div>
                )}
                <div className="mt-1 pt-1 border-t border-gray-200 flex items-baseline justify-between">
                  <span className="font-bold text-gray-800">Effective:</span>
                  <span className="font-extrabold text-[#FF6B00] tabular-nums">
                    {formatValue(currentTotal, config.isCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Operation (+ / -) and Amount */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                Adjustment Amount & Direction
              </label>
              <div className="flex items-center gap-2">
                {/* Operation Buttons */}
                <div className="flex rounded-xl border border-gray-200 bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setOperation("add")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                      operation === "add"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    <span>+ Add</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperation("subtract")}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                      operation === "subtract"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    <span>− Subtract</span>
                  </button>
                </div>

                {/* Amount Input */}
                <div className="relative flex-1">
                  {config.isCurrency && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      ₹
                    </span>
                  )}
                  <input
                    type="number"
                    step={config.isCurrency ? "1" : "1"}
                    min="1"
                    placeholder={config.placeholder}
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className={cn(
                      "w-full h-10 rounded-xl border border-gray-200 bg-white pr-3 text-sm font-bold text-gray-900 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 tabular-nums",
                      config.isCurrency ? "pl-8" : "pl-3",
                    )}
                  />
                  {!config.isCurrency && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      {config.unit}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Reason Input (Required for audit history) */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Reason for Adjustment <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Cash reconciliation, vendor replacement, offline bulk order..."
                className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-xs sm:text-sm font-medium text-gray-800 outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20 placeholder:text-gray-400"
              />
            </div>

            {/* 6. Live Preview Box (Requirement 8) */}
            <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/70 to-orange-100/30 p-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <span>Adjustment Preview</span>
                <span className="text-[#FF6B00] font-extrabold">{selectedRest.name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/90 p-2 border border-orange-100/80">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Current {config.label}</span>
                  <p className="mt-0.5 font-bold text-gray-700 tabular-nums text-sm">
                    {formatValue(currentTotal, config.isCurrency)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/90 p-2 border border-orange-100/80">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Adjustment</span>
                  <p
                    className={cn(
                      "mt-0.5 font-extrabold tabular-nums text-sm",
                      operation === "add" ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {parsedMagnitude > 0
                      ? `${operation === "add" ? "+" : "−"}${formatValue(parsedMagnitude, config.isCurrency)}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-2 border border-orange-300/80 shadow-2xs">
                  <span className="text-[10px] text-[#FF6B00] font-bold uppercase block">New {config.label}</span>
                  <p className="mt-0.5 font-extrabold text-[#FF6B00] tabular-nums text-sm sm:text-base">
                    {formatValue(previewNewTotal, config.isCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
                className="h-10 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-gray-600 transition hover:bg-gray-50 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || parsedMagnitude <= 0 || !reason.trim()}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#FF6B00] px-6 text-xs font-bold text-white shadow-xs transition hover:brightness-105 active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                <span>Save Adjustment</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Audit History Log */}
        {modalTab === "history" && (
          <div className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Adjustment History & Audit Trail</h3>
                <p className="text-xs text-gray-500">
                  Showing recorded adjustments for {selectedRest?.name || "all restaurants"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalTab("adjust")}
                className="text-xs font-bold text-[#FF6B00] hover:underline"
              >
                + New Adjustment
              </button>
            </div>

            {relevantAdjustments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
                <History className="size-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-600">No adjustments recorded yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Manual adjustments made to {selectedRest.name} will appear here with timestamps and audit records.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {relevantAdjustments.map((a) => {
                  const kConfig = KPI_CONFIG[a.kpiType];
                  const isCurrency = kConfig?.isCurrency ?? false;
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "p-3.5 transition-colors text-xs flex flex-col gap-1.5",
                        a.isReversed ? "bg-gray-50/70 opacity-60" : "hover:bg-orange-50/20",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{a.restaurantName || "Restaurant"}</span>
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                            {kConfig?.label || a.kpiType}
                          </span>
                          <span className="text-[10px] text-gray-400 tabular-nums">{a.businessDate}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "font-extrabold tabular-nums text-sm",
                              a.isReversed
                                ? "line-through text-gray-400"
                                : a.amount > 0
                                ? "text-emerald-600"
                                : "text-rose-600",
                            )}
                          >
                            {a.amount > 0 ? "+" : "−"}
                            {formatValue(Math.abs(a.amount), isCurrency)}
                          </span>

                          {a.isReversed ? (
                            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[9px] font-bold text-gray-600 uppercase">
                              Reversed
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReverse(a)}
                              disabled={reversingId === a.id}
                              className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
                              title="Reverse adjustment without deleting audit trail"
                            >
                              {reversingId === a.id ? (
                                <Loader2 className="size-2.5 animate-spin" />
                              ) : (
                                "Reverse"
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500">
                        <p className="italic text-gray-700">“{a.reason}”</p>
                        <p className="text-[10px] text-gray-400 shrink-0 ml-2">
                          By {a.createdBy || "Admin"} · {new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      {a.isReversed && (
                        <p className="text-[10px] text-rose-500 font-medium">
                          Reversed by {a.reversedBy || "Admin"} ({a.reversalReason || "Manual reversal"})
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-full border border-gray-200 bg-white px-5 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
