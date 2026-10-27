import { Utensils } from "@/components/icons";
import { formatRupees } from "@/lib/format";
import type { CategoryStat } from "@/lib/data/analytics-types";

type Props = {
  restaurantName: string;
  categories: CategoryStat[];
};

export function CategoryBreakdownTable({ restaurantName, categories }: Props) {
  const totalItems = categories.reduce((sum, c) => sum + c.itemsSold, 0);
  const totalCollections = categories.reduce((sum, c) => sum + c.collections, 0);
  const totalProfit = categories.reduce((sum, c) => sum + c.profit, 0);

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">
            {restaurantName} — Category Breakdown
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Delivered items, collections, and commission profit by menu category
          </p>
        </div>
        <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
          <Utensils className="size-4 sm:size-5" />
        </div>
      </div>

      {/* Mobile Card-Based View (< sm) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {categories.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            No delivered items recorded for this restaurant in the selected range.
          </p>
        ) : (
          categories.map((c, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-200/90 bg-white p-3.5 shadow-2xs transition active:bg-gray-50/80"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F172A]">{c.categoryName}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-[#0F172A] tabular-nums">
                    {c.itemsSold} sold
                  </span>
                  <span className="rounded-lg border border-orange-200/70 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B00] tabular-nums">
                    ₹{c.ratePerItem}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Collections</span>
                  <p className="font-bold text-[#0F172A] tabular-nums text-sm">
                    {formatRupees(c.collections)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#FF6B00] uppercase font-bold">
                    Profit
                  </span>
                  <p className="font-extrabold text-[#FF6B00] tabular-nums text-sm">
                    {formatRupees(c.profit)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {categories.length > 0 && (
          <div className="rounded-2xl border border-[#FF6B00]/40 bg-gradient-to-br from-[#FFF8F3] to-[#FFF0E6] p-4 shadow-2xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="text-left">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Items</span>
                <p className="mt-0.5 font-extrabold text-[#0F172A] text-sm tabular-nums truncate">
                  {totalItems} sold
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Collections</span>
                <p className="mt-0.5 font-extrabold text-[#0F172A] text-sm tabular-nums truncate">
                  {formatRupees(totalCollections)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase">Total Profit</span>
                <p className="mt-0.5 font-extrabold text-[#FF6B00] text-sm tabular-nums truncate">
                  {formatRupees(totalProfit)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="py-3 px-4">Menu Category</th>
              <th className="py-3 px-4 text-center">Items Delivered</th>
              <th className="py-3 px-4 text-right">Collections</th>
              <th className="py-3 px-4 text-right">Commission Rate</th>
              <th className="py-3 px-4 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                  No delivered items recorded for this restaurant in the selected time range.
                </td>
              </tr>
            ) : (
              categories.map((c, idx) => (
                <tr key={idx} className="transition-colors hover:bg-gray-50/70">
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                    {c.categoryName}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#0F172A] tabular-nums">
                    {c.itemsSold}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0F172A] tabular-nums">
                    {formatRupees(c.collections)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-gray-600 tabular-nums">
                    ₹{c.ratePerItem} / item
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#FF6B00] tabular-nums">
                    {formatRupees(c.profit)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {categories.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-orange-50/40 text-sm font-bold text-[#0F172A]">
                <td className="py-3.5 px-4 uppercase text-xs tracking-wide">
                  Total
                </td>
                <td className="py-3.5 px-4 text-center tabular-nums font-extrabold">
                  {totalItems}
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums font-extrabold">
                  {formatRupees(totalCollections)}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-500 text-xs font-normal">
                  Configured rate
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums font-extrabold text-[#FF6B00]">
                  {formatRupees(totalProfit)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
