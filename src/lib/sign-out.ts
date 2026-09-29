"use client";

import { signOut } from "@/app/actions";
import { clearCart } from "@/lib/cart/store";

/**
 * Use this instead of calling the signOut action directly. The cart lives
 * in localStorage, which a server action can't reach, so it's cleared here
 * first — otherwise the next student to sign in on this device (a shared
 * phone or lab machine) would inherit the previous student's cart.
 */
export async function signOutAndClearCart() {
  clearCart();
  await signOut();
}
