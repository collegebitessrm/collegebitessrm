"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { markAllConfirmedDelivered } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * Bulk "confirmed → delivered" for every confirmed order (any day — not
 * just today's list). `confirmedCount` comes from the page; the server
 * re-reads the confirmed orders itself (markAllConfirmedDelivered) and
 * reports how many it actually delivered.
 *
 * `disabled` goes on AlertDialogTrigger itself, not on the rendered
 * <button>: Base UI's trigger merges its own button props last, and its
 * default `disabled: false` silently overrode the element's `disabled`, so
 * the button only *looked* disabled and opened a "Mark 0 orders" dialog.
 */
export function MarkAllDeliveredButton({ confirmedCount }: { confirmedCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const disabled = confirmedCount === 0;
  const label = `Mark all delivered (${confirmedCount})`;

  function confirm() {
    startTransition(async () => {
      const result = await markAllConfirmedDelivered();
      if (result.ok) {
        setOpen(false);
        router.refresh();
        toast.success(`${result.count} order${result.count === 1 ? "" : "s"} marked delivered.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  // Why it's disabled, so a greyed-out button doesn't read as broken.
  const hint = disabled ? "No confirmed orders to deliver" : null;

  return (
    <AlertDialog open={open} onOpenChange={(next) => (pending ? null : setOpen(next))}>
      <div className="flex flex-col items-end gap-1">
        <AlertDialogTrigger
          disabled={disabled}
          render={
            <button
              type="button"
              className={cn(
                "flex h-10 items-center rounded-full bg-success px-4 text-sm font-bold text-success-foreground outline-none hover:bg-success/90 focus-visible:ring-3 focus-visible:ring-ring/80",
                disabled && "cursor-not-allowed opacity-50 hover:bg-success",
              )}
            />
          }
        >
          {label}
        </AlertDialogTrigger>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Mark {confirmedCount} order{confirmedCount === 1 ? "" : "s"} delivered?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Every confirmed order will jump straight to delivered.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={confirm}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Mark all delivered
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
