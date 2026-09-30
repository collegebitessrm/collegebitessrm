"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "@/components/icons";
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
import { BlurImage } from "@/components/blur-image";
import { getRestaurantCoverPhoto } from "@/lib/data/dish-photos";
import type { AdminRestaurant } from "@/lib/data/admin";
import { setOrderingMode, setRestaurantActive } from "@/lib/admin/actions";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

function RestaurantToggleCard({
  restaurant,
  orderingEnabled,
  forcedClosed,
  closedChip,
}: {
  restaurant: AdminRestaurant;
  /** Campus-wide kill switch — a restaurant can be individually "open" and still not actually take orders while this is off. */
  orderingEnabled: boolean;
  /** An admin set ordering to Closed — turning a restaurant on first asks to reopen ordering. */
  forcedClosed: boolean;
  closedChip: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(restaurant.is_active);
  // Resync when the server re-fetch changes this restaurant from elsewhere
  // (pausing ordering turns every restaurant off) — set during render, see
  // "Adjusting state based on a prop change" in the React docs.
  const [prevPropActive, setPrevPropActive] = useState(restaurant.is_active);
  if (restaurant.is_active !== prevPropActive) {
    setPrevPropActive(restaurant.is_active);
    setActive(restaurant.is_active);
  }
  const [pending, startTransition] = useTransition();
  const [askReopen, setAskReopen] = useState(false);
  // This restaurant itself is open, but campus-wide ordering is off — its
  // own toggle didn't do this, so it gets a distinct label rather than
  // being shown as plain "Open" (which would read as taking orders right
  // now) or "Closed" (which would misattribute the pause to this restaurant).
  const paused = active && !orderingEnabled;
  const cover = getRestaurantCoverPhoto(restaurant.name);

  function toggle() {
    const next = !active;
    if (next && forcedClosed) {
      setAskReopen(true);
      return;
    }
    startTransition(async () => {
      const result = await setRestaurantActive(restaurant.id, next);
      if (result.ok) {
        setActive(next);
        toast.success(`${restaurant.name} is now ${next ? "open" : "closed"}.`);
      } else {
        toast.error(result.error);
      }
    });
  }

  function reopenOrdering() {
    startTransition(async () => {
      const ordering = await setOrderingMode("open");
      if (!ordering.ok) {
        toast.error(ordering.error);
        return;
      }
      const result = await setRestaurantActive(restaurant.id, true);
      if (result.ok) {
        setActive(true);
        toast.success(`Ordering is open again, and ${restaurant.name} is on.`);
      } else {
        toast.error(`Ordering is open again, but ${restaurant.name} couldn't be turned on. Try again.`);
      }
      setAskReopen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-3xl border bg-card p-3 pr-4 shadow-card">
      <span className={cn("relative size-14 shrink-0 overflow-hidden rounded-2xl bg-stripes", !active && "grayscale")}>
        {cover && <BlurImage src={cover} alt="" sizes="56px" className="object-cover" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{restaurant.name}</p>
        <p
          className={cn(
            "mt-0.5 flex items-center gap-1.5 text-sm font-semibold",
            !active ? "text-destructive" : paused ? "text-primary" : "text-success",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              !active ? "bg-destructive" : paused ? "bg-primary" : "bg-success",
            )}
            aria-hidden="true"
          />
          {!active ? "Closed" : paused ? closedChip : "Open"}
        </p>
        {paused && (
          <p className="mt-1 text-xs text-muted-foreground">Campus ordering is closed. See Today above.</p>
        )}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={toggle}
        className={cn(
          "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70",
          active
            ? "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
            : "bg-success text-success-foreground hover:bg-success/90",
        )}
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        {active ? "Turn off" : "Turn on"}
      </button>

      <AlertDialog open={askReopen} onOpenChange={(open) => !open && !pending && setAskReopen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ordering is closed</AlertDialogTitle>
            <AlertDialogDescription>
              Open ordering first, then turn on the restaurants you want. Do you want to open ordering now?{" "}
              {restaurant.name} will be turned on too.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>No</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={reopenOrdering}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Open ordering
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function RestaurantToggleList({
  restaurants,
  orderingEnabled,
  forcedClosed,
  closedChip,
}: {
  restaurants: AdminRestaurant[];
  orderingEnabled: boolean;
  forcedClosed: boolean;
  closedChip: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((restaurant) => (
        <RestaurantToggleCard
          key={restaurant.id}
          restaurant={restaurant}
          orderingEnabled={orderingEnabled}
          forcedClosed={forcedClosed}
          closedChip={closedChip}
        />
      ))}
    </div>
  );
}
