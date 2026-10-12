"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power } from "@/components/icons";
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
 { mode: "open", label: "Open" },
 { mode: "closed", label: "Closed" },
];

const CONFIRM: Record<OrderingMode, { title: string; body: string; action: string }> = {
 open: {
 title: "Open ordering?",
 body: "Students can order right away from every restaurant that's turned on. It stays open until you close it.",
 action: "Open ordering",
 },
 closed: {
 title: "Close ordering campus-wide?",
 body: "No student can place a new order until you open it again, and every restaurant is turned off. When you reopen, turn on the restaurants you want. Orders already placed aren't affected.",
 action: "Close ordering",
 },
};

/**
 * Footer row of the dashboard's sunset "Today" card: the campus Open / Closed
 * switch (app_settings.ordering_mode — no daily schedule). The status comes
 * from the server (getOrderingState) and is re-fetched after every change.
 */
export function OrderingKillSwitch({ ordering }: { ordering: OrderingState }) {
 const router = useRouter();
 const [target, setTarget] = useState<OrderingMode | null>(null);
 const [pending, startTransition] = useTransition();

 const status = ordering.open ? "Open until you close it" : "Closed until you open it";

 function confirm() {
 if (!target) return;
 startTransition(async () => {
 const result = await setOrderingMode(target);
 if (result.ok) {
 toast.success(target === "open" ? "Ordering is open." : "Ordering is closed.");
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
 ordering.open ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
 )}
 aria-hidden="true"
 >
 <Power className="size-4.5" />
 </span>
 <div className="min-w-0">
 <p className="font-semibold">{ordering.open ? "Students can order now" : "Ordering is closed"}</p>
 <p className="max-w-md text-sm text-primary-foreground/85">{status}</p>
 </div>
 </div>

 <div
 role="radiogroup"
 aria-label="Ordering mode"
 className="flex shrink-0 rounded-full bg-primary-foreground/10 p-1"
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
 "h-9 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-hero-foreground/60",
 active ? "bg-primary-foreground text-primary" : "text-primary-foreground/85 hover:text-primary-foreground",
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
