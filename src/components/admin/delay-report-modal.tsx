"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, Check, Loader2, Timer, X } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clearOrderDelay, updateOrderDelay } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import { deliveryDue, formatTime } from "@/lib/date";
import { formatOrderNumber } from "@/lib/orders/status";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

// Threshold in minutes: orders within this window get an "Approaching" badge.
export const APPROACHING_THRESHOLD_MINUTES = 10;

/**
 * Standard delay reasons specified in Section 5 of the system requirements.
 */
export const DELAY_REASONS = [
  "Restaurant is experiencing a high order volume.",
  "Food preparation is taking longer than expected.",
  "Delivery person is not yet available.",
  "Delivery person is on the way to the restaurant.",
  "Bad weather is affecting delivery.",
  "Restaurant has reported an operational delay.",
  "Other reason.",
] as const;

export const DELAY_DURATIONS = [
  { label: "+5 min", minutes: 5 },
  { label: "+10 min", minutes: 10 },
  { label: "+15 min", minutes: 15 },
  { label: "+20 min", minutes: 20 },
  { label: "+30 min", minutes: 30 },
  { label: "Custom time", minutes: "custom" },
  { label: "ETA not confirmed", minutes: null },
] as const;

/**
 * Returns the overdue classification for an active (non-delivered/cancelled) order.
 *
 * "overdue"     — current time has passed the current ETA.
 * "approaching" — within APPROACHING_THRESHOLD_MINUTES of the ETA.
 * null          — not yet approaching.
 */
export function getOverdueState(
  order: Pick<AdminOrder, "createdAt" | "deliveryMinutes" | "restaurantName" | "updatedEta" | "status">,
  now: Date = new Date(),
): "overdue" | "approaching" | null {
  if (order.status === "delivered" || order.status === "cancelled") return null;

  // Use the admin-set updated ETA if available, otherwise the computed original.
  const eta = order.updatedEta
    ? new Date(order.updatedEta)
    : deliveryDue(order.createdAt, order.deliveryMinutes, order.restaurantName);

  const diff = eta.getTime() - now.getTime();
  if (diff <= 0) return "overdue";
  if (diff <= APPROACHING_THRESHOLD_MINUTES * 60_000) return "approaching";
  return null;
}

/**
 * Returns the number of minutes an active order is overdue (positive number),
 * or 0 if it is not overdue.
 */
export function getMinutesOverdue(
  order: Pick<AdminOrder, "createdAt" | "deliveryMinutes" | "restaurantName" | "updatedEta" | "status">,
  now: Date = new Date(),
): number {
  if (order.status === "delivered" || order.status === "cancelled") return 0;
  const eta = order.updatedEta
    ? new Date(order.updatedEta)
    : deliveryDue(order.createdAt, order.deliveryMinutes, order.restaurantName);
  const diff = now.getTime() - eta.getTime();
  return diff > 0 ? Math.round(diff / 60_000) : 0;
}

type Props = {
  order: AdminOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelayUpdated: (updated: Pick<AdminOrder, "delayReason" | "updatedEta" | "delayUpdatedAt" | "awaitingEtaConfirmation">) => void;
};

/**
 * Modal that lets an admin report a restaurant delay and manage ETAs:
 * - Predefined reason dropdown or custom reason
 * - Duration quick-selects (+5m, +10m, +15m, +20m, +30m, custom, or unconfirmed)
 * - Optional details field
 * - Clear delay / Resolve delay option
 */
export function DelayReportModal({ order, open, onOpenChange, onDelayUpdated }: Props) {
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();

  const originalEta = deliveryDue(order.createdAt, order.deliveryMinutes, order.restaurantName);

  // Selected predefined reason or "Other reason."
  const [selectedPreset, setSelectedPreset] = useState<string>(() => {
    if (!order.delayReason) return DELAY_REASONS[0];
    const match = DELAY_REASONS.find((r) => r === order.delayReason);
    return match ?? "Other reason.";
  });

  const [customReason, setCustomReason] = useState<string>(() => {
    if (!order.delayReason) return "";
    const isPreset = (DELAY_REASONS as readonly string[]).includes(order.delayReason);
    return isPreset ? "" : order.delayReason;
  });

  const [additionalDetails, setAdditionalDetails] = useState<string>("");

  const [etaTime, setEtaTime] = useState<string>(() => {
    if (order.updatedEta) {
      const d = new Date(order.updatedEta);
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d);
    }
    return "";
  });

  const [awaitingConfirmation, setAwaitingConfirmation] = useState<boolean>(
    order.awaitingEtaConfirmation ?? (!order.updatedEta && !!order.delayReason),
  );

  const hasDelay = !!order.delayReason;
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (order.delayReason) {
        const match = DELAY_REASONS.find((r) => r === order.delayReason);
        if (match) {
          setSelectedPreset(match);
          setCustomReason("");
        } else {
          setSelectedPreset("Other reason.");
          setCustomReason(order.delayReason);
        }
      } else {
        setSelectedPreset(DELAY_REASONS[0]);
        setCustomReason("");
      }

      setAdditionalDetails("");

      if (order.updatedEta) {
        const d = new Date(order.updatedEta);
        setEtaTime(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(d),
        );
        setAwaitingConfirmation(false);
      } else {
        setEtaTime("");
        setAwaitingConfirmation(true);
      }
    }
  }, [open, order.delayReason, order.updatedEta, order.awaitingEtaConfirmation]);

  /** Converts a "HH:MM" IST string to UTC ISO-8601 string for today */
  function etaTimeToIso(timeStr: string): string | null {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;

    const nowIst = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const [year, month, day] = nowIst.split("-").map(Number);
    const utcMs = Date.UTC(year, month - 1, day, h, m) - 330 * 60_000;
    return new Date(utcMs).toISOString();
  }

  function handleSelectDuration(minutes: number | "custom" | null) {
    if (minutes === null) {
      setEtaTime("");
      setAwaitingConfirmation(true);
      return;
    }
    if (minutes === "custom") {
      setAwaitingConfirmation(false);
      return;
    }
    // Calculate originalEta + minutes
    const baseTime = originalEta.getTime();
    const targetMs = baseTime + minutes * 60_000;
    const targetDate = new Date(targetMs);
    const hhMm = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(targetDate);
    setEtaTime(hhMm);
    setAwaitingConfirmation(false);
  }

  function getEffectiveReason(): string {
    const base = selectedPreset === "Other reason." ? customReason.trim() : selectedPreset;
    const details = additionalDetails.trim();
    if (details) {
      return `${base} (${details})`;
    }
    return base;
  }

  function handleSave() {
    startSave(async () => {
      const finalReason = getEffectiveReason();
      if (!finalReason) {
        toast.error("Please enter a delay reason.");
        return;
      }

      const etaIso = awaitingConfirmation ? null : etaTimeToIso(etaTime);
      const awaiting = awaitingConfirmation || !etaIso;

      const result = await updateOrderDelay(order.id, finalReason, etaIso, awaiting);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Delay reported.");
      onDelayUpdated({
        delayReason: finalReason,
        updatedEta: etaIso,
        delayUpdatedAt: new Date().toISOString(),
        awaitingEtaConfirmation: awaiting,
      });
      onOpenChange(false);
    });
  }

  function handleClear() {
    startClear(async () => {
      const result = await clearOrderDelay(order.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Delay resolved.");
      onDelayUpdated({
        delayReason: null,
        updatedEta: null,
        delayUpdatedAt: null,
        awaitingEtaConfirmation: false,
      });
      onOpenChange(false);
    });
  }

  const busy = saving || clearing;
  const updatedEtaIso = awaitingConfirmation ? null : etaTimeToIso(etaTime);
  const delayMinutes = updatedEtaIso
    ? Math.round((new Date(updatedEtaIso).getTime() - originalEta.getTime()) / 60_000)
    : null;

  return (
    <Dialog open={open} onOpenChange={(next) => (busy ? null : onOpenChange(next))}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/15">
              <AlertCircle className="size-4 text-amber-500" />
            </span>
            Report Delay — Order {formatOrderNumber(order.dailyNumber)}
          </DialogTitle>
          <DialogDescription>
            Report delay for <strong className="text-foreground">{order.studentName}</strong> from{" "}
            <strong className="text-foreground">{order.restaurantName}</strong>. The customer will be notified live on their tracking page.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex flex-col gap-4">
          {/* Reference ETAs */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary p-3 text-xs">
            <div>
              <p className="text-muted-foreground">Original ETA</p>
              <p className="font-heading text-base font-bold tabular-nums text-foreground">
                {formatTime(originalEta.toISOString())}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Status</p>
              <p className="font-heading text-base font-bold text-foreground">
                {order.updatedEta
                  ? formatTime(order.updatedEta)
                  : order.awaitingEtaConfirmation
                    ? "Awaiting confirmation"
                    : formatTime(originalEta.toISOString())}
              </p>
            </div>
          </div>

          {/* Reason Selection */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delay-reason-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delay reason <span className="text-destructive">*</span>
            </label>
            <select
              id="delay-reason-select"
              value={selectedPreset}
              onChange={(e) => {
                setSelectedPreset(e.target.value);
                if (e.target.value === "Other reason.") {
                  setTimeout(() => otherInputRef.current?.focus(), 50);
                }
              }}
              disabled={busy}
              className="h-11 rounded-xl border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
            >
              {DELAY_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>

            {selectedPreset === "Other reason." && (
              <div className="mt-1.5 flex flex-col gap-1">
                <input
                  ref={otherInputRef}
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Specify custom reason…"
                  maxLength={150}
                  disabled={busy}
                  className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Optional Details */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delay-details" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Additional details <span className="font-normal lowercase text-muted-foreground">(optional)</span>
            </label>
            <input
              id="delay-details"
              type="text"
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="e.g. 5 orders ahead in kitchen queue"
              maxLength={150}
              disabled={busy}
              className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
            />
          </div>

          {/* Delay Duration Quick-Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estimated delay duration
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DELAY_DURATIONS.map((dur) => {
                const isSelected =
                  dur.minutes === null
                    ? awaitingConfirmation
                    : dur.minutes === "custom"
                      ? !awaitingConfirmation && !!etaTime
                      : delayMinutes === dur.minutes;
                return (
                  <button
                    key={dur.label}
                    type="button"
                    onClick={() => handleSelectDuration(dur.minutes)}
                    disabled={busy}
                    className={cn(
                      "rounded-lg border px-2.5 py-1 text-xs font-semibold transition active:scale-95",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {dur.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Revised ETA Input */}
          <div className="flex flex-col gap-1.5 rounded-2xl border p-3">
            <div className="flex items-center justify-between">
              <label htmlFor="updated-eta-time" className="text-xs font-bold text-foreground">
                Confirmed Delivery Time
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={awaitingConfirmation}
                  onChange={(e) => {
                    setAwaitingConfirmation(e.target.checked);
                    if (e.target.checked) setEtaTime("");
                  }}
                  className="rounded text-primary focus:ring-ring"
                />
                <span>Awaiting confirmation</span>
              </label>
            </div>

            {!awaitingConfirmation && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  id="updated-eta-time"
                  type="time"
                  value={etaTime}
                  onChange={(e) => setEtaTime(e.target.value)}
                  disabled={busy}
                  className="h-10 flex-1 rounded-xl border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-50"
                />
                {etaTime && (
                  <button
                    type="button"
                    onClick={() => {
                      setEtaTime("");
                      setAwaitingConfirmation(true);
                    }}
                    className="flex size-9 items-center justify-center rounded-xl border text-muted-foreground hover:text-foreground"
                    aria-label="Clear time"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            )}

            {/* Delay delta preview */}
            <div className="mt-1 text-xs">
              {awaitingConfirmation ? (
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  Customer will see &quot;Awaiting confirmation&quot; with your delay reason.
                </p>
              ) : updatedEtaIso && delayMinutes !== null ? (
                <p className={cn("font-semibold", delayMinutes > 0 ? "text-amber-600 dark:text-amber-400" : "text-success")}>
                  {delayMinutes > 0
                    ? `+${delayMinutes} min delay from original ETA (${formatTime(originalEta.toISOString())} → ${formatTime(updatedEtaIso)})`
                    : delayMinutes < 0
                      ? `${Math.abs(delayMinutes)} min earlier than original ETA`
                      : "Same as original ETA"}
                </p>
              ) : (
                <p className="text-muted-foreground">Select a duration or enter a confirmed time.</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={busy}
              className="flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={busy || (selectedPreset === "Other reason." && !customReason.trim())}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-sm font-bold text-white outline-none transition hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <AlertCircle className="size-4" />}
              {saving ? "Saving…" : hasDelay ? "Update delay" : "Confirm Delay"}
            </button>

            {hasDelay && (
              <button
                type="button"
                onClick={handleClear}
                disabled={busy}
                className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-success/30 bg-success/5 px-3 text-sm font-semibold text-success outline-none transition hover:bg-success/10 active:scale-95 disabled:opacity-50"
                title="Mark delay as resolved"
              >
                {clearing ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                <span>Resolve</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact badge shown on order cards and the admin list for overdue / approaching orders.
 */
export function OverdueBadge({ state }: { state: "overdue" | "approaching" }) {
  if (state === "overdue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
        <AlertCircle className="size-3" aria-hidden="true" />
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
      <Timer className="size-3" aria-hidden="true" />
      Approaching
    </span>
  );
}

/**
 * Small inline banner shown inside an order card when delay info has been recorded.
 */
export function DelayBanner({
  delayReason,
  updatedEta,
  delayUpdatedAt,
  awaitingEtaConfirmation,
  originalEtaIso,
  onEdit,
}: {
  delayReason: string;
  updatedEta: string | null;
  delayUpdatedAt: string | null;
  awaitingEtaConfirmation: boolean;
  originalEtaIso: string;
  onEdit?: () => void;
}) {
  const delayMinutes = updatedEta
    ? Math.round((new Date(updatedEta).getTime() - new Date(originalEtaIso).getTime()) / 60_000)
    : null;

  return (
    <div className="mt-2.5 rounded-xl border border-amber-200/60 bg-amber-50/80 px-3.5 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Delay reported</p>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="relative z-10 text-[11px] font-bold text-amber-700 underline underline-offset-2 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
              >
                Update
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-300">{delayReason}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-amber-600 dark:text-amber-400">
            {updatedEta ? (
              <>
                <span>
                  New ETA: <span className="font-semibold tabular-nums">{formatTime(updatedEta)}</span>
                </span>
                {delayMinutes !== null && delayMinutes > 0 && (
                  <span className="font-semibold">(+{delayMinutes} min)</span>
                )}
              </>
            ) : awaitingEtaConfirmation ? (
              <span className="font-semibold">ETA: Awaiting confirmation</span>
            ) : null}
            {delayUpdatedAt && (
              <span className="text-amber-500/70">· Updated {formatTime(delayUpdatedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
