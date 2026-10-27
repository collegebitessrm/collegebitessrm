"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Receipt, Search, X } from "@/components/icons";
import { formatRupees } from "@/lib/format";
import type { DeliveredOrderRecord } from "@/lib/data/analytics-types";

type Props = {
  orders: DeliveredOrderRecord[];
};

export function DeliveredOrdersTable({ orders }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return orders;
    return orders.filter((o) => {
      const itemsText = o.items.map((i) => i.dishName).join(" ");
      const haystack = `${o.token} ${o.studentName} ${o.contactPhone} ${o.restaurantName} ${itemsText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [orders, q]);

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xs">
      {/* Header and Search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-base sm:text-lg font-bold text-[#0F172A]">
            Delivered Orders Log ({filtered.length})
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-500">
            Real order-by-order records contributing to collections and profit
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order #, student, dish…"
            className="h-9 sm:h-10 w-full rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50/70 pl-9 pr-8 text-xs font-medium text-[#0F172A] outline-none transition focus:border-[#FF6B00] focus:bg-white"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Card-Based Order Log (< sm) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white shadow-2xs text-gray-400">
              <Receipt className="size-6" />
            </div>
            <p className="mt-3 text-sm font-bold text-[#0F172A]">
              No delivered orders found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {query ? "Try searching for a different token, student, or dish." : "Only orders with delivered status appear in this report."}
            </p>
          </div>
        ) : (
          filtered.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-2xs transition active:bg-gray-50/80"
            >
              {/* Header: Token, Time & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex items-center gap-1 font-mono text-sm font-extrabold text-[#FF6B00] hover:underline"
                  >
                    <span>{order.token}</span>
                    <span className="text-xs text-gray-300">↗</span>
                  </Link>
                  <span className="text-[11px] text-gray-400">· {order.formattedTime}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Check className="size-2.5" />
                  Delivered
                </span>
              </div>

              {/* Student & Restaurant Info */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#0F172A]">{order.studentName}</p>
                  <p className="text-[11px] text-gray-400">{order.contactPhone}</p>
                </div>
                <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                  {order.restaurantName}
                </span>
              </div>

              {/* Items List */}
              <div className="mt-3 rounded-xl bg-gray-50/70 p-2.5 border border-gray-100 text-xs">
                <ul className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between text-gray-700">
                      <span className="truncate pr-2 font-medium">
                        <span className="inline-block rounded bg-white px-1.5 py-0.2 text-[10px] font-bold text-[#FF6B00] border border-gray-200/80 mr-1.5">
                          {item.quantity}x
                        </span>
                        {item.dishName}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500 tabular-nums whitespace-nowrap">
                        {formatRupees(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Financials: Collection & Profit */}
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Collected</span>
                  <p className="font-bold text-[#0F172A] tabular-nums text-sm">
                    {formatRupees(order.totalAmount)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#FF6B00] uppercase font-bold">
                    Profit
                  </span>
                  <p className="font-extrabold text-[#FF6B00] tabular-nums text-sm">
                    {formatRupees(order.profit)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= sm) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
              <th className="py-3 px-4">Order</th>
              <th className="py-3 px-4">Time</th>
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Restaurant</th>
              <th className="py-3 px-4">Items Delivered</th>
              <th className="py-3 px-4 text-right">Collected</th>
              <th className="py-3 px-4 text-right">Profit</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                    <Receipt className="size-6" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                    No delivered orders found
                  </p>
                  <p className="text-xs text-gray-400">
                    {query
                      ? "No records match your search query."
                      : "Only orders marked 'delivered' appear in this analytics report."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gray-50/70">
                  <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono text-[#FF6B00] hover:underline"
                    >
                      {order.token}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-gray-500 whitespace-nowrap">
                    {order.formattedTime}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#0F172A]">
                      {order.studentName}
                    </div>
                    <div className="text-xs text-gray-400">{order.contactPhone}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                    {order.restaurantName}
                  </td>
                  <td className="py-3.5 px-4 text-xs max-w-xs">
                    <ul className="space-y-0.5">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="truncate text-gray-600">
                          <span className="font-semibold text-[#0F172A]">
                            {item.quantity}x
                          </span>{" "}
                          {item.dishName}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[#0F172A] tabular-nums whitespace-nowrap">
                    {formatRupees(order.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-[#FF6B00] tabular-nums whitespace-nowrap">
                    {formatRupees(order.profit)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      <Check className="size-3" />
                      Delivered
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
