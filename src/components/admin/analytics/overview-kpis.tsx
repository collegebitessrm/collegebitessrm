import { Banknote, PencilSimple, Receipt, TrendUp, Utensils } from "@/components/icons";
import { formatRupees } from "@/lib/format";

type Props = {
  totalCollections: number;
  totalOrders: number;
  totalItemsSold: number;
  totalProfit: number;
  profitRate?: number;
  onChangeProfitClick?: () => void;
  restaurantLabel?: string;
};

export function OverviewKPIs({
  totalCollections,
  totalOrders,
  totalItemsSold,
  totalProfit,
  profitRate = 10,
  onChangeProfitClick,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
      {/* 1. Total Collections */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Collections
          </span>
          <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
            <Banknote className="size-3.5 sm:size-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {formatRupees(totalCollections)}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
            Delivered orders
          </p>
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
                className="flex items-center gap-0.5 rounded-full border border-orange-200 bg-white/95 px-1.5 py-0.5 text-[9px] sm:text-[11px] font-bold text-[#FF6B00] shadow-2xs transition hover:bg-white active:scale-95"
                title="Change profit commission rates"
              >
                <PencilSimple className="size-2 sm:size-3" />
                <span>Rates</span>
              </button>
            )}
            <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#FF6B00] text-white shadow-xs">
              <TrendUp className="size-3.5 sm:size-5" />
            </div>
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#FF6B00] tabular-nums tracking-tight">
            {formatRupees(totalProfit)}
          </p>
          <div className="mt-0.5 sm:mt-1 flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-[#0F172A]/70 truncate">
              Net Commission
            </p>
            {onChangeProfitClick && (
              <button
                type="button"
                onClick={onChangeProfitClick}
                className="text-[9px] sm:text-xs font-bold text-[#FF6B00] hover:underline whitespace-nowrap ml-1 sm:inline hidden"
              >
                Edit →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Total Orders */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Orders
          </span>
          <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
            <Receipt className="size-3.5 sm:size-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {totalOrders}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
            Completed deliveries
          </p>
        </div>
      </div>

      {/* 4. Total Items Sold */}
      <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-gray-200/90 bg-white p-3.5 sm:p-5 shadow-2xs transition hover:shadow-md">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Items Sold
          </span>
          <div className="flex size-7 sm:size-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-orange-50 text-[#FF6B00]">
            <Utensils className="size-3.5 sm:size-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-3">
          <p className="font-heading text-lg sm:text-3xl font-extrabold text-[#0F172A] tabular-nums tracking-tight">
            {totalItemsSold}
          </p>
          <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400 sm:text-gray-500 truncate">
            Dishes delivered
          </p>
        </div>
      </div>
    </div>
  );
}
