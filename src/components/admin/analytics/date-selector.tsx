"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Check, Loader2 } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { DateFilterMode } from "@/lib/data/analytics-types";

type Props = {
  mode: DateFilterMode;
  startDate: string;
  endDate: string;
};

export function DateSelector({ mode, startDate, endDate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [activeMode, setActiveMode] = useState<DateFilterMode>(mode);
  const [customStart, setCustomStart] = useState(startDate);
  const [customEnd, setCustomEnd] = useState(endDate);
  const [isPickerOpen, setIsPickerOpen] = useState(mode === "custom");

  function applyDateChange(newMode: DateFilterMode, start?: string, end?: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("mode", newMode);
      if (newMode === "custom" && start && end) {
        params.set("from", start);
        params.set("to", end);
      } else {
        params.delete("from");
        params.delete("to");
      }
      router.push(`/admin/analytics?${params.toString()}`);
    });
  }

  function handleModeClick(newMode: DateFilterMode) {
    setActiveMode(newMode);
    if (newMode === "today") {
      setIsPickerOpen(false);
      applyDateChange("today");
    } else {
      setIsPickerOpen(true);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    applyDateChange("custom", customStart, customEnd);
  }

  return (
    <div className="flex w-full flex-col items-stretch sm:w-auto sm:items-end gap-2.5">
      {/* Mode Toggle Pills */}
      <div className="flex w-full items-center justify-between rounded-full border border-gray-200/90 bg-white p-1 shadow-2xs sm:w-auto">
        <button
          type="button"
          onClick={() => handleModeClick("today")}
          disabled={isPending}
          className={cn(
            "flex h-9 sm:h-8 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all outline-none",
            activeMode === "today"
              ? "bg-[#FF6B00] text-white shadow-xs"
              : "text-[#0F172A] hover:bg-orange-50 hover:text-[#FF6B00]",
          )}
        >
          {isPending && activeMode === "today" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Calendar className="size-3.5" />
          )}
          Today
        </button>

        <button
          type="button"
          onClick={() => handleModeClick("custom")}
          disabled={isPending}
          className={cn(
            "flex h-9 sm:h-8 flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all outline-none",
            activeMode === "custom"
              ? "bg-[#FF6B00] text-white shadow-xs"
              : "text-[#0F172A] hover:bg-orange-50 hover:text-[#FF6B00]",
          )}
        >
          {isPending && activeMode === "custom" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Calendar className="size-3.5" />
          )}
          Custom Date
        </button>
      </div>

      {/* Custom Date Range Controls */}
      {isPickerOpen && (
        <form
          onSubmit={handleCustomSubmit}
          className="flex w-full flex-col gap-2.5 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-xs sm:w-auto sm:flex-row sm:items-center sm:gap-2 sm:p-2"
        >
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs font-semibold text-[#0F172A]">
              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 sm:h-8 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 text-sm sm:text-xs font-medium text-[#0F172A] outline-none transition focus:border-[#FF6B00] focus:bg-white"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs font-semibold text-[#0F172A]">
              <span className="text-[11px] font-medium text-gray-500 sm:text-xs">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 sm:h-8 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-2.5 text-sm sm:text-xs font-medium text-[#0F172A] outline-none transition focus:border-[#FF6B00] focus:bg-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-9 sm:h-8 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-[#FF6B00] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[#E05E00] active:scale-95 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
