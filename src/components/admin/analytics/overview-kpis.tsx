import { Banknote, PencilSimple, Receipt, SlidersHorizontal, TrendUp, Utensils } from "@/components/icons";
import type { KpiAdjustmentTotals, KpiOverrides, KpiType } from "@/lib/data/analytics-types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  totalCollections: number;
  totalOrders: number;
  totalItemsSold: number;
  totalProfit: number;
  profitRate?: number;
  onChangeProfitClick?: () => void;
  adjustments?: KpiAdjustmentTotals | null;
  overrides?: KpiOverrides | null;
  onEditKpiClick?: (metric: KpiType) => void;
  restaurantLabel?: string;
};

export function OverviewKPIs({
  totalCollections,
  totalOrders,
  totalItemsSold,
  totalProfit,
  profitRate = 10,
  onChangeProfitClick,
  adjustments,
  overrides,
  onEditKpiClick,
}: Props) {
  // 1. Collections: check manual adjustment first, then legacy override
  const collAdj = adjustments?.collections ?? 0;
  const isCollectionsAdjusted = collAdj !== 0;
  const isCollectionsOverride =
    typeof overrides?.collections === "number" && !isNaN(overrides.collections);
  const displayCollections = isCollectionsAdjusted
    ? totalCollections + collAdj
    : isCollectionsOverride
    ? overrides!.collections!
    : totalCollections;

  // 2. Total Profit
  const profitAdj = adjustments?.profit ?? 0;
  const isProfitAdjusted = profitAdj !== 0;
  const isProfitOverride =
    typeof overrides?.profit === "number" && !isNaN(overrides.profit);
  const displayProfit = isProfitAdjusted
    ? totalProfit + profitAdj
    : isProfitOverride
    ? overrides!.profit!
    : totalProfit;

  // 3. Orders
  const ordersAdj = adjustments?.orders ?? 0;
  const isOrdersAdjusted = ordersAdj !== 0;
  const isOrdersOverride =
    typeof overrides?.orders === "number" && !isNaN(overrides.orders);
  const displayOrders = isOrdersAdjusted
    ? totalOrders + ordersAdj
    : isOrdersOverride
    ? overrides!.orders!
    : totalOrders;

  // 4. Items Sold
  const itemsAdj = adjustments?.itemsSold ?? 0;
  const isItemsSoldAdjusted = itemsAdj !== 0;
  const isItemsSoldOverride =
    typeof overrides?.itemsSold === "number" && !isNaN(overrides.itemsSold);
  const displayItemsSold = isItemsSoldAdjusted
    ? totalItemsSold + itemsAdj
    : isItemsSoldOverride
    ? overrides!.itemsSold!
    : totalItemsSold;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      {/* 1. Total Collections */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Collections
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onEditKpiClick && (
              <button
                type="button"
                onClick={() => onEditKpiClick("collections")}
                className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-gray-600 shadow-2xs transition hover:border-[#FF6B00] hover:text-[#FF6B00] hover:bg-orange-50/50 active:scale-95 cursor-pointer"
                title="Edit Collections (manual adjustment)"
              >
                <PencilSimple className="size-2 sm:size-3" />
                <span>Edit</span>
              </button>
            )}
            <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
              <Banknote className="size-3.5 sm:size-5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
              {formatRupees(displayCollections)}
            </p>
            {(isCollectionsAdjusted || isCollectionsOverride) && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                Adjusted
              </span>
            )}
          </div>

          {isCollectionsAdjusted ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1 flex-wrap">
                <span>Calculated:</span>
                <span className="font-bold text-gray-700">{formatRupees(totalCollections)}</span>
                <span className="text-gray-300">·</span>
                <span className={cn("font-bold", collAdj > 0 ? "text-emerald-600" : "text-rose-600")}>
                  Adj: {collAdj > 0 ? "+" : "−"}{formatRupees(Math.abs(collAdj))}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Delivered orders
              </p>
            </div>
          ) : isCollectionsOverride ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1">
                <span>Actual:</span>
                <span className="font-bold text-gray-700">{formatRupees(totalCollections)}</span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Delivered orders
              </p>
            </div>
          ) : (
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
              Delivered orders
            </p>
          )}
        </div>
      </div>

      {/* 2. Total Profit (Highlighted Card with Light Orange Background) */}
      <div className="relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-[#FF6B00]/30 bg-gradient-to-br from-[#FFF8F3] to-[#FFF0E6] p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-[#FF6B00] uppercase">
            Total Profit
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onChangeProfitClick && (
              <button
                type="button"
                onClick={onChangeProfitClick}
                className="flex items-center gap-0.5 rounded-full border border-orange-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-[#FF6B00] shadow-2xs transition hover:bg-white active:scale-95 cursor-pointer"
                title="Configure commission rates"
              >
                <SlidersHorizontal className="size-2 sm:size-3" />
                <span>Rates</span>
              </button>
            )}
            {onEditKpiClick && (
              <button
                type="button"
                onClick={() => onEditKpiClick("profit")}
                className="flex items-center gap-0.5 rounded-full border border-orange-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-[#FF6B00] shadow-2xs transition hover:bg-white active:scale-95 cursor-pointer"
                title="Edit Total Profit (manual adjustment)"
              >
                <PencilSimple className="size-2 sm:size-3" />
                <span>Edit</span>
              </button>
            )}
            <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#FF6B00] text-white shadow-xs">
              <TrendUp className="size-3.5 sm:size-5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#FF6B00] tabular-nums tracking-tight">
              {formatRupees(displayProfit)}
            </p>
            {(isProfitAdjusted || isProfitOverride) && (
              <span className="rounded-full bg-orange-200/80 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                Adjusted
              </span>
            )}
          </div>

          {isProfitAdjusted ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 flex items-center gap-1 flex-wrap">
                <span>Commission:</span>
                <span className="font-bold text-[#0F172A]">{formatRupees(totalProfit)}</span>
                <span className="text-gray-400">·</span>
                <span className={cn("font-bold", profitAdj > 0 ? "text-emerald-700" : "text-rose-700")}>
                  Adj: {profitAdj > 0 ? "+" : "−"}{formatRupees(Math.abs(profitAdj))}
                </span>
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 truncate">
                  Final Adjusted Profit
                </p>
                {onEditKpiClick && (
                  <button
                    type="button"
                    onClick={() => onEditKpiClick("profit")}
                    className="text-[9px] sm:text-xs font-bold text-[#FF6B00] hover:underline whitespace-nowrap ml-1 sm:inline hidden cursor-pointer"
                  >
                    Adjust →
                  </button>
                )}
              </div>
            </div>
          ) : isProfitOverride ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 flex items-center gap-1">
                <span>Actual:</span>
                <span className="font-bold text-[#0F172A]">{formatRupees(totalProfit)}</span>
              </p>
              <div className="flex items-center justify-between">
                <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 truncate">
                  Net Commission
                </p>
                {onEditKpiClick && (
                  <button
                    type="button"
                    onClick={() => onEditKpiClick("profit")}
                    className="text-[9px] sm:text-xs font-bold text-[#FF6B00] hover:underline whitespace-nowrap ml-1 sm:inline hidden cursor-pointer"
                  >
                    Edit →
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-0.5 sm:mt-1 flex items-center justify-between">
              <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 truncate">
                Net Commission
              </p>
              {onEditKpiClick && (
                <button
                  type="button"
                  onClick={() => onEditKpiClick("profit")}
                  className="text-[9px] sm:text-xs font-bold text-[#FF6B00] hover:underline whitespace-nowrap ml-1 sm:inline hidden cursor-pointer"
                >
                  Edit →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Total Orders */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Orders
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onEditKpiClick && (
              <button
                type="button"
                onClick={() => onEditKpiClick("orders")}
                className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-gray-600 shadow-2xs transition hover:border-[#FF6B00] hover:text-[#FF6B00] hover:bg-orange-50/50 active:scale-95 cursor-pointer"
                title="Edit Orders (manual adjustment)"
              >
                <PencilSimple className="size-2 sm:size-3" />
                <span>Edit</span>
              </button>
            )}
            <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
              <Receipt className="size-3.5 sm:size-5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
              {displayOrders}
            </p>
            {(isOrdersAdjusted || isOrdersOverride) && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                Adjusted
              </span>
            )}
          </div>

          {isOrdersAdjusted ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1 flex-wrap">
                <span>Delivered:</span>
                <span className="font-bold text-gray-700">{totalOrders}</span>
                <span className="text-gray-300">·</span>
                <span className={cn("font-bold", ordersAdj > 0 ? "text-emerald-600" : "text-rose-600")}>
                  Adj: {ordersAdj > 0 ? `+${ordersAdj}` : `−${Math.abs(ordersAdj)}`}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Completed deliveries
              </p>
            </div>
          ) : isOrdersOverride ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1">
                <span>Actual:</span>
                <span className="font-bold text-gray-700">{totalOrders}</span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Completed deliveries
              </p>
            </div>
          ) : (
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
              Completed deliveries
            </p>
          )}
        </div>
      </div>

      {/* 4. Total Items Sold */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Items Sold
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {onEditKpiClick && (
              <button
                type="button"
                onClick={() => onEditKpiClick("items_sold")}
                className="flex items-center gap-0.5 rounded-full border border-gray-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-gray-600 shadow-2xs transition hover:border-[#FF6B00] hover:text-[#FF6B00] hover:bg-orange-50/50 active:scale-95 cursor-pointer"
                title="Edit Items Sold (manual adjustment)"
              >
                <PencilSimple className="size-2 sm:size-3" />
                <span>Edit</span>
              </button>
            )}
            <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
              <Utensils className="size-3.5 sm:size-5" />
            </div>
          </div>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
              {displayItemsSold}
            </p>
            {(isItemsSoldAdjusted || isItemsSoldOverride) && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                Adjusted
              </span>
            )}
          </div>

          {isItemsSoldAdjusted ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1 flex-wrap">
                <span>Actual:</span>
                <span className="font-bold text-gray-700">{totalItemsSold}</span>
                <span className="text-gray-300">·</span>
                <span className={cn("font-bold", itemsAdj > 0 ? "text-emerald-600" : "text-rose-600")}>
                  Adj: {itemsAdj > 0 ? `+${itemsAdj}` : `−${Math.abs(itemsAdj)}`}
                </span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Dishes delivered
              </p>
            </div>
          ) : isItemsSoldOverride ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 flex items-center gap-1">
                <span>Actual:</span>
                <span className="font-bold text-gray-700">{totalItemsSold}</span>
              </p>
              <p className="text-[10px] sm:text-xs font-medium text-gray-400 truncate">
                Dishes delivered
              </p>
            </div>
          ) : (
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
              Dishes delivered
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
