"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, MapPin, Phone, Plus, QrCode, X } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { IconTile } from "@/components/icon-tile";
import { CartLineRow } from "@/components/cart/cart-line-row";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTES } from "@/lib/cart/limits";
import { cartTotals, clearCart, reconcileCart, useCart, type Cart } from "@/lib/cart/store";
import { formatRupees } from "@/lib/format";
import { placeOrder } from "@/lib/orders/actions";
import { formatLocalMobile, formatStoredMobile, normalizeIndianMobile } from "@/lib/phone";
import { toast } from "@/lib/toast/store";
import { spiceNote } from "@/lib/taste/options";
import { cn } from "@/lib/utils";

const eyebrow = "text-label text-muted-foreground";

export function CartSheet({
  open,
  onOpenChange,
  profilePhone,
  orderingEnabled,
  closedNote,
  spiceLevel = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Stored "+91XXXXXXXXXX" — the default contact number for the order. */
  profilePhone: string;
  /** Campus-wide kill switch — disables the "Place order" button when off. */
  orderingEnabled: boolean;
  closedNote?: string;
  spiceLevel?: number | null;
}) {
  const cart = useCart();
  const empty = cart.lines.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        <header className="flex items-start gap-3 border-b px-6 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-heading text-headline font-bold">Your cart</SheetTitle>
            <SheetDescription className={cn("mt-0.5 truncate text-base", empty && "sr-only")}>
              {empty
                ? "Your cart is empty"
                : `${cart.restaurantName} · ${cartTotals(cart).items} ${cartTotals(cart).items === 1 ? "item" : "items"}`}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close cart"
            className="flex size-12 shrink-0 items-center justify-center rounded-full border bg-card shadow-card outline-none hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <X className="size-5" />
          </button>
        </header>

        {empty ? (
          <EmptyCart onBrowse={() => onOpenChange(false)} />
        ) : (
          <CartContents
            cart={cart}
            profilePhone={profilePhone}
            orderingEnabled={orderingEnabled}
            closedNote={closedNote}
            spiceLevel={spiceLevel}
            onPlaced={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EmptyCart({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="px-8 pb-14">
      <EmptyState
        art="plates"
        title="Nothing here yet"
        action={
          <Link
            href="/"
            onClick={onBrowse}
            className="pressable surface-primary glow-neon flex h-14 items-center rounded-full bg-primary px-8 text-lg font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            Browse restaurants
          </Link>
        }
      >
        Pick a restaurant and add a few dishes. Most orders take under a minute.
      </EmptyState>
    </div>
  );
}

function CartContents({
  cart,
  profilePhone,
  orderingEnabled,
  closedNote,
  spiceLevel,
  onPlaced,
}: {
  cart: Cart;
  profilePhone: string;
  orderingEnabled: boolean;
  closedNote?: string;
  spiceLevel: number | null;
  onPlaced: () => void;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState(profilePhone);
  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();
  const { amount } = cartTotals(cart);
  // From the taste profile: a one-tap note, offered until it's in the box.
  const suggestedNote = spiceNote(spiceLevel);
  const showSuggestion =
    suggestedNote !== null &&
    !notes.toLowerCase().includes(suggestedNote.toLowerCase()) &&
    notes.length + suggestedNote.length + 2 <= MAX_NOTES;

  function submit() {
    setError(null);
    startPlacing(async () => {
      const result = await placeOrder({
        restaurantId: cart.restaurantId!,
        lines: cart.lines.map((l) => ({ dishId: l.dishId, quantity: l.quantity, price: l.price })),
        notes,
        contactPhone,
      });
      if (result.ok) {
        clearCart();
        onPlaced();
        router.push(`/orders/${result.orderId}?placed=1`, { transitionTypes: ["nav-forward"] });
        return;
      }
      if (result.removedDishIds || result.updatedPrices) {
        reconcileCart(result.removedDishIds ?? [], result.updatedPrices ?? []);
      }
      setError(result.error);
      toast.error(result.error);
    });
  }

  // Only the Place-order button is pinned. The bill, payment notes and the
  // handover/contact card all scroll with the items: the old pinned footer
  // (bill + payment box + button, ~300px) left so little room on a phone
  // that the contact card got cut off mid-sentence. The bottom edge of the
  // scroll area fades out so it reads as "more below", not as clipped.
  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 [mask-image:linear-gradient(to_bottom,#000_calc(100%-1.5rem),transparent)]">
        <ul>
          {cart.lines.map((line) => (
            <CartLineRow key={line.dishId} line={line} restaurantName={cart.restaurantName} />
          ))}
        </ul>

        <label className="mt-5 block">
          <span className="sr-only">Order notes</span>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={MAX_NOTES}
            rows={2}
            placeholder="Order notes, e.g. “less spicy”"
            className="min-h-14 resize-none rounded-2xl bg-card px-5 py-4 text-base shadow-card md:text-base"
          />
        </label>
        {showSuggestion && (
          <button
            type="button"
            onClick={() => setNotes((n) => (n.trim() ? `${n.trim()}. ${suggestedNote}` : suggestedNote))}
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-pink-soft px-3.5 text-sm font-semibold text-pink-soft-foreground outline-none hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/80"
          >
            <Plus className="size-3.5" />
            {suggestedNote}
          </button>
        )}

        <div className="mt-4 divide-y rounded-2xl border bg-card shadow-card">
          <div className="flex items-center gap-4 px-5 py-4">
            <IconTile>
              <MapPin className="icon-tint-primary size-5" aria-hidden="true" />
            </IconTile>
            <div>
              <p className={eyebrow}>Handover point</p>
              <p className="font-semibold">Gate 3</p>
            </div>
          </div>
          <ContactPhone value={contactPhone} onChange={setContactPhone} />
        </div>

        <div className="mt-4 rounded-2xl border bg-card px-5 py-4 shadow-card">
          <dl className="space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <dt>Item total</dt>
              <dd className="tabular-nums">{formatRupees(amount)}</dd>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <dt>Delivery to Gate 3</dt>
              <dd className="rounded-full bg-success-soft px-2.5 py-0.5 text-sm font-semibold text-success">Free</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-dashed pt-2.5">
              <dt className="font-semibold">To pay at pickup</dt>
              <dd key={amount} className="animate-bounce-count font-heading text-3xl font-bold tabular-nums text-primary">
                {formatRupees(amount)}
              </dd>
            </div>
          </dl>
          <ul className="mt-3 space-y-1.5 border-t pt-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Banknote className="size-4 shrink-0 text-aqua" aria-hidden="true" />
              Pay on delivery, cash or UPI at the gate.
            </li>
            <li className="flex items-center gap-2.5">
              <QrCode className="size-4 shrink-0 text-aqua" aria-hidden="true" />
              Paying cash? Exact change helps.
            </li>
          </ul>
        </div>
      </div>

      <footer className="border-t bg-background px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {!orderingEnabled && (
          <p className="mb-3 rounded-2xl border border-pink-soft-foreground/15 bg-pink-soft px-4 py-3 text-center text-sm text-pink-soft-foreground">
            {closedNote ? `${closedNote}.` : "Ordering is paused campus-wide right now."} Your cart will
            wait.
          </p>
        )}

        {error && (
          <p id="place-order-error" role="alert" className="mb-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={placing || !orderingEnabled}
          aria-describedby={error ? "place-order-error" : undefined}
          className={cn(
            "surface-primary glow-neon flex h-14 w-full items-center justify-between gap-2 rounded-full bg-primary px-6 text-lg font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70 disabled:shadow-none",
            placing && "animate-shimmer",
          )}
        >
          <span className="flex items-center gap-2">
            {placing && <Loader2 className="size-5 animate-spin" />}
            {placing ? "Placing order…" : "Place order"}
          </span>
          <span className="font-heading text-xl tabular-nums">{formatRupees(amount)}</span>
        </button>
      </footer>
    </>
  );
}

/** The order's contact number. Changing it here affects only this order. */
function ContactPhone({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);

  function save() {
    const normalized = normalizeIndianMobile(draft);
    if (!normalized) return setInvalid(true);
    onChange(normalized);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-4 px-5 py-4">
        <IconTile>
          <Phone className="icon-tint-gold size-5" aria-hidden="true" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <p className={eyebrow}>Your number</p>
          <p className="font-semibold tabular-nums">{formatStoredMobile(value)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Make sure this is your WhatsApp number before placing the order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDraft(formatLocalMobile(value.replace(/^\+91/, "")));
            setInvalid(false);
            setEditing(true);
          }}
          className="rounded-md font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/80"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <label htmlFor="contact-phone" className={eyebrow}>
        Number for this order
      </label>
      <div className="mt-2 flex gap-2">
        <div
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center rounded-xl border bg-background focus-within:border-ring",
            invalid && "border-destructive focus-within:border-destructive",
          )}
        >
          <span className="pl-3 text-muted-foreground">+91</span>
          <span className="mx-2 h-6 w-px bg-border" aria-hidden="true" />
          <input
            id="contact-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            autoFocus
            value={draft}
            onChange={(e) => {
              setDraft(formatLocalMobile(e.target.value));
              setInvalid(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && save()}
            aria-invalid={invalid || undefined}
            aria-describedby="contact-phone-hint"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 tabular-nums outline-none"
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="surface-primary h-12 rounded-full bg-primary px-5 font-semibold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Save
        </button>
      </div>
      <p id="contact-phone-hint" className={cn("mt-1.5 text-sm", invalid ? "text-destructive" : "text-muted-foreground")}>
        {invalid ? "Enter a valid 10-digit mobile number." : "Only for this order. Your profile number stays the same."}
      </p>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="mt-1 text-sm font-medium text-muted-foreground hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
