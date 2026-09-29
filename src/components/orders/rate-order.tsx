"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareText, Star, X } from "lucide-react";
import { BlurImage } from "@/components/blur-image";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { OrderItem, OrderReview } from "@/lib/data/orders";
import { submitReview } from "@/lib/reviews/actions";
import { MAX_REVIEW_NOTE, REVIEW_WINDOW_MS } from "@/lib/reviews/limits";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const STAR_WORDS = ["", "Not good", "Meh", "Okay", "Good", "Loved it"];

/**
 * The rating card on a delivered order's tracking page: "How was it?"
 * (opens the rating sheet) while the 7-day window is open, the student's
 * own stars + note once they've rated ("submit once" — no edits), or a
 * short "ratings closed" line after the window. Ratings are admin-only
 * feedback; nothing here is shown to other students.
 */
export function RateOrder({
  orderId,
  restaurantName,
  items,
  deliveredAt,
  initialReview,
  autoOpen = false,
}: {
  orderId: string;
  restaurantName: string;
  items: OrderItem[];
  deliveredAt: string | null;
  initialReview: OrderReview | null;
  /** From ?rate=1 (Orders-list pill, Home pop-up): open the sheet straight away. */
  autoOpen?: boolean;
}) {
  const [review, setReview] = useState(initialReview);
  const [open, setOpen] = useState(autoOpen && !initialReview);
  // Captured once so the window check doesn't call Date.now() on every render.
  const [now] = useState(() => Date.now());

  if (review) return <RatedSummary review={review} items={items} />;

  // A just-delivered order (via the live status update) may not have its
  // delivered_at in hand yet — treat that as "just now".
  const windowOpen = !deliveredAt || now - new Date(deliveredAt).getTime() < REVIEW_WINDOW_MS;
  if (!windowOpen) {
    return (
      <p className="mt-4 rounded-2xl bg-secondary px-5 py-3.5 text-sm text-muted-foreground">
        Ratings closed — they&apos;re open for 7 days after delivery.
      </p>
    );
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border bg-card p-5 shadow-card">
        <p className="font-heading text-title font-bold">How was it?</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Rate your food from {restaurantName} — only the MuteBites team sees it.
        </p>
        <div className="mt-3 flex items-center gap-1 text-border" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-6" />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="surface-primary mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80"
        >
          Rate your order
        </button>
      </div>
      <RateSheet
        open={open}
        onOpenChange={setOpen}
        orderId={orderId}
        restaurantName={restaurantName}
        items={items}
        onRated={(r) => {
          setReview(r);
          setOpen(false);
        }}
      />
    </>
  );
}

function RatedSummary({ review, items }: { review: OrderReview; items: OrderItem[] }) {
  return (
    <div className="mt-4 rounded-2xl border bg-card p-5 shadow-card">
      <p className="text-label text-muted-foreground">You rated this</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.dishName}</span>
            <Stars value={review.ratings[item.id] ?? 0} size="size-4" />
          </li>
        ))}
      </ul>
      {review.note && (
        <p className="mt-3 flex gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
          <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>“{review.note}”</span>
        </p>
      )}
    </div>
  );
}

function Stars({ value, size }: { value: number; size: string }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(size, n <= value ? "fill-primary text-primary" : "text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function RateSheet({
  open,
  onOpenChange,
  orderId,
  restaurantName,
  items,
  onRated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  restaurantName: string;
  items: OrderItem[];
  onRated: (review: OrderReview) => void;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const allRated = items.every((i) => (ratings[i.id] ?? 0) >= 1);

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitReview({ orderId, ratings, note });
      if (result.ok) {
        toast.success("Thanks for rating!");
        onRated({ note: note.trim() || null, createdAt: new Date().toISOString(), ratings });
        router.refresh();
      } else {
        setError(result.error);
        toast.error(result.error);
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
      >
        <header className="flex items-start gap-3 border-b px-6 pt-6 pb-4">
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-heading text-headline font-bold">Rate your order</SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-base">{restaurantName}</SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <ul className="divide-y">
            {items.map((item) => (
              <DishRating
                key={item.id}
                item={item}
                photo={getDishPhoto(restaurantName, item.dishName)}
                value={ratings[item.id] ?? 0}
                onChange={(v) => setRatings((r) => ({ ...r, [item.id]: v }))}
              />
            ))}
          </ul>

          <label className="mt-4 block">
            <span className="text-label text-muted-foreground">Anything to add? (optional)</span>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={MAX_REVIEW_NOTE}
              rows={3}
              placeholder="e.g. “Biryani was great, raita was warm”"
              className="mt-1.5 min-h-20 resize-none rounded-2xl border-0 bg-secondary px-5 py-4 text-base md:text-base"
            />
            <span className="mt-1 block text-right text-xs text-muted-foreground tabular-nums">
              {note.length}/{MAX_REVIEW_NOTE}
            </span>
          </label>
        </div>

        <footer className="border-t bg-background px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error && (
            <p role="alert" className="mb-3 text-center text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!allRated || pending}
            className="surface-primary flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-50"
          >
            {pending && <Loader2 className="size-5 animate-spin" />}
            {pending ? "Sending…" : allRated ? "Submit rating" : "Rate every dish to submit"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            You can rate an order once. Only the MuteBites team sees it.
          </p>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

function DishRating({
  item,
  photo,
  value,
  onChange,
}: {
  item: OrderItem;
  photo: string | undefined;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-4">
      <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-soft font-heading text-xl font-bold text-brand-soft-foreground/60">
        {photo ? (
          <BlurImage src={photo} alt="" sizes="56px" className="object-cover" />
        ) : (
          <span aria-hidden="true">{item.dishName.trim().charAt(0)}</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{item.dishName}</p>
        <div className="mt-1 flex items-center gap-2">
          <div role="radiogroup" aria-label={`Rating for ${item.dishName}`} className="flex items-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={value === n}
                aria-label={`${n} star${n === 1 ? "" : "s"}`}
                onClick={() => onChange(n)}
                className="flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                <Star
                  className={cn("size-7", n <= value ? "fill-primary text-primary" : "text-muted-foreground")}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold text-muted-foreground">{STAR_WORDS[value]}</span>
        </div>
      </div>
    </li>
  );
}
