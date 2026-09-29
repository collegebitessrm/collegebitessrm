"use client";

import { Download } from "lucide-react";
import type { AdminOrder } from "@/lib/data/admin";
import { formatOrderTimestamp } from "@/lib/date";
import { formatRupees } from "@/lib/format";
import { formatOrderNumber, statusBadge } from "@/lib/orders/status";
import { formatStoredMobile } from "@/lib/phone";
import { adminPill } from "./styles";

const COLUMNS = ["Order", "Date", "Student", "Phone", "Restaurant", "Items", "Amount", "Status"];

// Excel (and everything else) treats a field as one cell only when it's
// quoted and internal quotes are doubled — needed here since names, item
// lists, and notes can all contain commas.
function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function ordersToCsv(orders: AdminOrder[]): string {
  const rows = orders.map((o) =>
    [
      formatOrderNumber(o.dailyNumber),
      formatOrderTimestamp(o.createdAt),
      o.studentName,
      formatStoredMobile(o.contactPhone),
      o.restaurantName,
      o.items.map((i) => `${i.dishName} x${i.quantity}`).join("; "),
      formatRupees(o.totalAmount),
      statusBadge(o.status).label,
    ]
      .map(csvField)
      .join(","),
  );
  return [COLUMNS.map(csvField).join(","), ...rows].join("\r\n");
}

/** Downloads the currently-loaded orders as a .csv file — opens fine in Excel or Sheets. */
export function ExportOrdersButton({ orders }: { orders: AdminOrder[] }) {
  function exportCsv() {
    const csv = ordersToCsv(orders);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mutebites-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      disabled={orders.length === 0}
      onClick={exportCsv}
      className={adminPill}
    >
      <Download className="size-4" aria-hidden="true" />
      Export to Excel
    </button>
  );
}
