"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RESTAURANT_TABS, type RestaurantFilterKey } from "@/lib/data/analytics-types";
import { cn } from "@/lib/utils";

type Props = {
  selectedRestaurant: RestaurantFilterKey;
};

export function RestaurantTabs({ selectedRestaurant }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function selectTab(key: RestaurantFilterKey) {
    if (key === selectedRestaurant) return;
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === "all") {
        params.delete("restaurant");
      } else {
        params.set("restaurant", key);
      }
      router.push(`/admin/analytics?${params.toString()}`);
    });
  }

  return (
    <div className="relative border-b border-gray-200/80 pb-3">
      {/* Scrollable container on mobile, wrapped on larger screens */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap touch-pan-x overscroll-x-contain">
        {RESTAURANT_TABS.map((tab) => {
          const isSelected = selectedRestaurant === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectTab(tab.key)}
              disabled={isPending}
              className={cn(
                "flex h-9 sm:h-10 shrink-0 items-center justify-center rounded-full px-4 sm:px-5 text-xs sm:text-sm font-bold transition-all outline-none whitespace-nowrap active:scale-95",
                isSelected
                  ? "bg-[#FF6B00] text-white shadow-xs shadow-orange-500/20"
                  : "border border-gray-200/90 bg-white text-[#0F172A] hover:border-orange-200 hover:bg-orange-50/50 hover:text-[#FF6B00]",
                isPending && "opacity-80",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
