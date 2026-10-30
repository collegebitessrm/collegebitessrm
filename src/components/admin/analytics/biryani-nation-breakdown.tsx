import { CookingPot, PencilSimple } from "@/components/icons";
import { formatRupees } from "@/lib/format";
import type { BiryaniNationBreakdown } from "@/lib/data/analytics-types";

type Props = {
  breakdown: BiryaniNationBreakdown;
  onEditRatesClick?: () => void;
  overrideProfit?: number | null;
};

export function BiryaniNationBreakdownView({ breakdown, onEditRatesClick, overrideProfit }: Props) {
  const rows = [
    {
      label: "Full Biryani",
      note: "Dishes with portion '(Full)'",
      data: breakdown.fulls,
      key: "full",
    },
    {
      label: "Single Biryani",
      note: "Dishes with portion '(Single)'",
      data: breakdown.singles,
      key: "single",
    },
    {
      label: "Starters",
      note: "Chicken 65, Manchurian, Crispy, Chilli, etc.",
      data: breakdown.starters,
      key: "starters",
    },
    {
      label: "Chinese",
      note: "Fried Rice, Noodles, etc.",
      data: breakdown.chinese,
      key: "chinese",
    },
  ];

  if (breakdown.others.count > 0) {
    rows.push({
      label: "Other Items",
      note: "Sides, beverages, and additions",
      data: breakdown.others,
      key: "others",
    });
  }

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xs">
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">
            Biriyani Nation — Category & Commission
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Delivered items, collections, and commission profit for Full, Single, Starters, and Chinese
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEditRatesClick && (
            <button
              type="button"
              onClick={onEditRatesClick}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50/70 px-3 py-1.5 text-xs font-bold text-[#FF6B00] shadow-2xs transition hover:bg-orange-100 active:scale-95"
            >
              <PencilSimple className="size-3" />
              Edit Rates
            </button>
          )}
          <div className="flex size-8 sm:size-9 items-center justify-center rounded-xl bg-orange-50 text-[#FF6B00]">
            <CookingPot className="size-4 sm:size-5" />
          </div>
        </div>
      </div>

      {/* Mobile Card-Based View (< sm) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((r, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-gray-200/90 bg-white p-3.5 shadow-2xs transition active:bg-gray-50/80"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-[#0F172A]">{r.label}</h3>
                <p className="text-[10px] text-gray-400 truncate">{r.note}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-[#0F172A] tabular-nums">
                  {r.data.count} sold
                </span>
                <span className="rounded-lg border border-orange-200/70 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B00] tabular-nums">
                  ₹{r.data.rate}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Collections</span>
                <p className="font-bold text-[#0F172A] tabular-nums text-sm">
                  {formatRupees(r.data.collections)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#FF6B00] uppercase font-bold">
                  Profit
                </span>
                <p className="font-extrabold text-[#FF6B00] tabular-nums text-sm">
                  {formatRupees(r.data.profit)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Mobile Total Card */}
        <div className="rounded-2xl border border-[#FF6B00]/40 bg-gradient-to-br from-[#FFF8F3] to-[#FFF0E6] p-4 shadow-2xs">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="text-left">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Items</span>
              <p className="mt-0.5 font-extrabold text-[#0F172A] text-sm tabular-nums truncate">
                {breakdown.totalItems} sold
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Collections</span>
              <p className="mt-0.5 font-extrabold text-[#0F172A] text-sm tabular-nums truncate">
                {formatRupees(breakdown.totalCollections)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#FF6B00] uppercase">Total Profit</span>
              <p className="mt-0.5 font-extrabold text-[#FF6B00] text-sm tabular-nums truncate">
                {formatRupees(breakdown.totalProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="py-3 px-4">Menu Category / Portion</th>
              <th className="py-3 px-4 text-center">Items Delivered</th>
              <th className="py-3 px-4 text-right">Collections</th>
              <th className="py-3 px-4 text-right">Profit Rate</th>
              <th className="py-3 px-4 text-right">Total Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {rows.map((r, idx) => (
              <tr key={idx} className="transition-colors hover:bg-gray-50/70">
                <td className="py-3.5 px-4 font-semibold text-[#0F172A]">
                  <div>{r.label}</div>
                  <div className="text-xs font-normal text-gray-400">{r.note}</div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-[#0F172A] tabular-nums">
                  {r.data.count}
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-[#0F172A] tabular-nums">
                  {formatRupees(r.data.collections)}
                </td>
                <td className="py-3.5 px-4 text-right text-gray-700 font-medium tabular-nums">
                  ₹{r.data.rate} / item
                </td>
                <td className="py-3.5 px-4 text-right font-extrabold text-[#FF6B00] tabular-nums">
                  {formatRupees(r.data.profit)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-orange-50/40 text-sm font-bold text-[#0F172A]">
              <td className="py-3.5 px-4 uppercase text-xs tracking-wide">
                Total
              </td>
              <td className="py-3.5 px-4 text-center tabular-nums font-extrabold">
                {breakdown.totalItems}
              </td>
              <td className="py-3.5 px-4 text-right tabular-nums font-extrabold">
                {formatRupees(breakdown.totalCollections)}
              </td>
              <td className="py-3.5 px-4 text-right text-gray-500 text-xs font-normal">
                Configured rates
              </td>
              <td className="py-3.5 px-4 text-right tabular-nums font-extrabold text-[#FF6B00]">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span>{formatRupees(typeof overrideProfit === "number" ? overrideProfit : breakdown.totalProfit)}</span>
                    {typeof overrideProfit === "number" && overrideProfit !== breakdown.totalProfit && (
                      <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-[#FF6B00] uppercase tracking-wide">
                        Edited
                      </span>
                    )}
                  </div>
                  {typeof overrideProfit === "number" && overrideProfit !== breakdown.totalProfit && (
                    <span className="text-[10px] font-normal text-gray-400">
                      Actual: {formatRupees(breakdown.totalProfit)}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
