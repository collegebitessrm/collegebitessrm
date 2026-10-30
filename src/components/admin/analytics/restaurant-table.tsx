import { Storefront } from "@/components/icons";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RestaurantPerformance } from "@/lib/data/analytics-types";

type Props = {
  restaurants: RestaurantPerformance[];
  totalCollections: number;
};

export function RestaurantTable({ restaurants, totalCollections }: Props) {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">
            Restaurant Performance
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Delivered orders, collections, items, and profit per partner restaurant
          </p>
        </div>
        <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
          <Storefront className="size-4 sm:size-5" />
        </div>
      </div>

      {/* Mobile Card-Based View (< sm) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {restaurants.map((r) => {
          const share = totalCollections > 0 ? Math.round((r.collections / totalCollections) * 100) : 0;
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-2xs transition active:bg-gray-50/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 rounded-full ring-2 ring-white shadow-2xs",
                      r.isActive ? "bg-emerald-500" : "bg-gray-300",
                    )}
                    aria-hidden="true"
                  />
                  <h3 className="font-bold text-sm text-[#0F172A]">{r.name}</h3>
                </div>
                <span className="rounded-full border border-orange-200/70 bg-orange-50 px-2.5 py-0.5 text-[11px] font-bold text-[#FF6B00]">
                  {share}% share
                </span>
              </div>

              {/* Progress bar of revenue share */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#FF6B00] transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
                />
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-gray-50/70 p-2.5 border border-gray-100">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Orders / Items</span>
                  <p className="mt-0.5 font-bold text-[#0F172A] tabular-nums">
                    {r.deliveredOrders} orders · {r.itemsSold} items
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50/70 p-2.5 border border-gray-100">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Avg Order</span>
                  <p className="mt-0.5 font-bold text-[#0F172A] tabular-nums">
                    {r.deliveredOrders > 0 ? formatRupees(r.avgOrderValue) : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50/70 p-2.5 border border-gray-100">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Collections</span>
                  <p className="mt-0.5 font-bold text-[#0F172A] tabular-nums">
                    {formatRupees(r.collections)}
                  </p>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-orange-50/90 to-orange-100/40 p-2.5 border border-orange-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#FF6B00]">Profit</span>
                    {r.isEdited && typeof r.actualProfit === "number" && r.actualProfit !== r.profit && (
                      <span className="rounded-full bg-orange-200/70 px-1 py-0.2 text-[8px] font-bold text-[#FF6B00] uppercase">
                        Adjusted
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-extrabold text-[#FF6B00] tabular-nums">
                    {formatRupees(r.profit)}
                  </p>
                  {r.isEdited && typeof r.actualProfit === "number" && r.actualProfit !== r.profit && (
                    <p className="text-[9px] text-gray-500 font-medium">
                      Actual: {formatRupees(r.actualProfit)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="py-3 px-4">Restaurant</th>
              <th className="py-3 px-4 text-center">Delivered Orders</th>
              <th className="py-3 px-4 text-center">Items Sold</th>
              <th className="py-3 px-4 text-right">Collections</th>
              <th className="py-3 px-4 text-right">Profit</th>
              <th className="py-3 px-4 text-right">Avg Order Value</th>
              <th className="py-3 px-4 text-right">Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {restaurants.map((r) => {
              const share = totalCollections > 0 ? Math.round((r.collections / totalCollections) * 100) : 0;
              return (
                <tr key={r.id} className="transition-colors hover:bg-gray-50/70">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          r.isActive ? "bg-emerald-500" : "bg-gray-300",
                        )}
                        aria-hidden="true"
                      />
                      <span>{r.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#0F172A] tabular-nums">
                    <div>{r.deliveredOrders}</div>
                    {typeof r.actualOrders === "number" && r.actualOrders !== r.deliveredOrders && (
                      <span className="text-[10px] font-normal text-gray-400 block">
                        Act: {r.actualOrders}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#0F172A] tabular-nums">
                    <div>{r.itemsSold}</div>
                    {typeof r.actualItemsSold === "number" && r.actualItemsSold !== r.itemsSold && (
                      <span className="text-[10px] font-normal text-gray-400 block">
                        Act: {r.actualItemsSold}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0F172A] tabular-nums">
                    <div>{formatRupees(r.collections)}</div>
                    {typeof r.actualCollections === "number" && r.actualCollections !== r.collections && (
                      <span className="text-[10px] font-normal text-gray-400 block">
                        Act: {formatRupees(r.actualCollections)}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#FF6B00] tabular-nums">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1.5">
                        <span>{formatRupees(r.profit)}</span>
                        {r.isEdited && typeof r.actualProfit === "number" && r.actualProfit !== r.profit && (
                          <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                            Adjusted
                          </span>
                        )}
                      </div>
                      {r.isEdited && typeof r.actualProfit === "number" && r.actualProfit !== r.profit && (
                        <span className="text-[10px] font-normal text-gray-400">
                          Actual: {formatRupees(r.actualProfit)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-600 tabular-nums">
                    {r.deliveredOrders > 0 ? formatRupees(r.avgOrderValue) : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums">
                    <span className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-bold text-[#FF6B00]">
                      {share}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
