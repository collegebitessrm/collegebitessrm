"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Power } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { setOrderingMode } from "@/lib/admin/actions";
import type { OrderingMode, OrderingState } from "@/lib/ordering";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const MODES: { mode: OrderingMode; label: string }[] = [
  { mode: "auto", label: "Auto" },
  { mode: "open", label: "Open" },
  { mode: "closed", label: "Closed" },
];

const CONFIRM: Record<OrderingMode, { title: string; body: string; action: string }> = {
  auto: {
    title: "Follow the schedule?",
    body: "Ordering opens 10:30 AM – 12:45 PM and 1:30 PM – 7:00 PM, and closes on its own in between.",
    action: "Use schedule",
  },
  open: {
    title: "Force ordering open?",
    body: "Students can order right now even outside the schedule. Orders placed after 7:00 PM have no slot — their ticket says delivery time to be confirmed. Switch back to Auto when you're done.",
    action: "Force open",
  },
  closed: {
    title: "Pause ordering campus-wide?",
    body: "No student can place a new order until you switch back, whatever the schedule says, and every restaurant is turned off. When you reopen, turn on the restaurants you want. Orders already placed aren't affected.",
    action: "Pause ordering",
  },
};

/**
 * Footer row of the dashboard's plum "Today" card: the three-way ordering
 * override (app_settings.ordering_mode) and a line saying what's actually
 * happening right now. Auto follows public.ordering_schedule_open(); Open
 * and Closed force it either way. The status comes from the server
 * (getOrderingState) and is re-fetched after every change.
 */
export function OrderingKillSwitch({ ordering }: { ordering: OrderingState }) {
  const router = useRouter();
  const [target, setTarget] = useState<OrderingMode | null>(null);
  const [pending, startTransition] = useTransition();

  const status =
    ordering.mode === "open"
      ? "Forced open — ignoring the schedule"
      : ordering.mode === "closed"
        ? "Paused by admin"
        : ordering.open
          ? `Following the schedule — open until ${ordering.closesAt}`
          : `Following the schedule — ${ordering.headline.toLowerCase()}`;

  function confirm() {
    if (!target) return;
    startTransition(async () => {
      const result = await setOrderingMode(target);
      if (result.ok) {
        toast.success(
          target === "auto" ? "Ordering follows the schedule." : target === "open" ? "Ordering forced open." : "Ordering paused.",
        );
        setTarget(null);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            ordering.open ? "bg-ink-success/20 text-ink-success" : "bg-ink-danger/20 text-ink-danger",
          )}
          aria-hidden="true"
        >
          {ordering.mode === "auto" ? <CalendarClock className="size-4.5" /> : <Power className="size-4.5" />}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{ordering.open ? "Students can order now" : "Ordering is closed"}</p>
          <p className="max-w-md text-sm text-ink-foreground/75">{status}</p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Ordering mode"
        className="flex shrink-0 rounded-full bg-ink-foreground/10 p-1"
      >
        {MODES.map(({ mode, label }) => {
          const active = ordering.mode === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => !active && setTarget(mode)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ink-foreground/60",
                active ? "bg-ink-foreground text-ink" : "text-ink-foreground/75 hover:text-ink-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <AlertDialog open={target !== null} onOpenChange={(next) => !next && !pending && setTarget(null)}>
        <AlertDialogContent>
          {target && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{CONFIRM[target].title}</AlertDialogTitle>
                <AlertDialogDescription>{CONFIRM[target].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={pending}
                  onClick={confirm}
                  className={cn(target === "closed" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                >
                  {pending && <Loader2 className="size-4 animate-spin" />}
                  {CONFIRM[target].action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
