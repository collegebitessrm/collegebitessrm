"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, RotateCcw } from "@/components/icons";
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
import { refillCart, useCart, type Cart } from "@/lib/cart/store";
import type { UsualCart } from "@/lib/data/usual";
import { toast } from "@/lib/toast/store";

/**
 * True if the current cart is already exactly this "usual" (same
 * restaurant, same dish quantities) — refilling would be a no-op, so
 * there's nothing to confirm.
 */
function matchesUsual(cart: Cart, usual: UsualCart): boolean {
 if (cart.restaurantId !== usual.restaurantId) return false;
 if (cart.lines.length !== usual.lines.length) return false;
 const usualQuantities = new Map(usual.lines.map((l) => [l.dishId, l.quantity]));
 return cart.lines.every((l) => usualQuantities.get(l.dishId) === l.quantity);
}

/** One-tap "Your usual" chip — refills the cart with the student's most-repeated order. */
export function YourUsualChip({ usual }: { usual: UsualCart }) {
 const router = useRouter();
 const cart = useCart();
 const [confirmOpen, setConfirmOpen] = useState(false);
 const itemCount = usual.lines.reduce((sum, l) => sum + l.quantity, 0);

 function apply() {
 refillCart({ id: usual.restaurantId, name: usual.restaurantName }, usual.lines);
 toast.success("Your usual is in the cart.");
 router.push(`/restaurants/${usual.restaurantId}`, { transitionTypes: ["nav-forward"] });
 }

 function handleTap() {
 // Anything already in the cart — even from this same restaurant — gets
 // silently replaced by a refill, so confirm first unless it's already
 // empty or already exactly this usual (tapping again should be a no-op,
 // not a scary dialog).
 if (cart.lines.length > 0 && !matchesUsual(cart, usual)) setConfirmOpen(true);
 else apply();
 }

 return (
 <>
 <button
 type="button"
 onClick={handleTap}
 className="mt-5 flex w-full items-center gap-3 rounded-[1.5rem] border bg-card p-3 pr-4 text-left shadow-card outline-none hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
 <RotateCcw className="size-5" weight="bold" aria-hidden="true" />
 </span>
 <span className="min-w-0 flex-1">
 <span className="block font-semibold">Your usual, one tap</span>
 <span className="block truncate text-sm text-muted-foreground">
 {usual.restaurantName} · {itemCount} {itemCount === 1 ? "item" : "items"}
 </span>
 </span>
 <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
 </button>

 <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle className="text-lg font-bold">Replace your cart?</AlertDialogTitle>
 <AlertDialogDescription>
 Your cart already has items in it. Refilling your usual from {usual.restaurantName}{" "}
 will replace what&apos;s there now.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Keep my cart</AlertDialogCancel>
 <AlertDialogAction
 onClick={() => {
 setConfirmOpen(false);
 apply();
 }}
 >
 Refill my usual
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </>
 );
}
