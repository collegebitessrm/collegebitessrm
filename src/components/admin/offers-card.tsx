"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Discount, Gift } from "@/components/icons";
import { IconTile } from "@/components/icon-tile";
import { setOfferEnabled } from "@/lib/admin/actions";
import { OFFER_KEYS, OFFERS, type OfferKey } from "@/lib/offers";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const ADMIN_DETAIL: Record<OfferKey, string> = {
  pct10: "Off the whole order, any restaurant",
  pct20: "Off the whole order, any restaurant",
  biryani: "Biryani Nation only. Students pick which Single biryani(s) they get free",
};

/**
 * Dashboard "Offers" card: one switch per discount (app_settings.offer_*).
 * Any mix can be on; students pick one per order in the cart.
 */
export function OffersCard({ active }: { active: OfferKey[] }) {
  const router = useRouter();
  const [on, setOn] = useState(() => new Set(active));
  // Resync when the server re-fetch changes it (another admin, another tab).
  const [prevActive, setPrevActive] = useState(active.join());
  if (active.join() !== prevActive) {
    setPrevActive(active.join());
    setOn(new Set(active));
  }
  const [pendingKey, setPendingKey] = useState<OfferKey | null>(null);
  const [, startTransition] = useTransition();

  function toggle(key: OfferKey) {
    const next = !on.has(key);
    setOn((s) => {
      const copy = new Set(s);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    setPendingKey(key);
    startTransition(async () => {
      const result = await setOfferEnabled(key, next);
      setPendingKey(null);
      if (result.ok) {
        toast.success(`${OFFERS[key].title} is ${next ? "on" : "off"}.`);
        router.refresh();
      } else {
        setOn((s) => {
          const copy = new Set(s);
          if (next) copy.delete(key);
          else copy.add(key);
          return copy;
        });
        toast.error(result.error);
      }
    });
  }

  return (
    <section>
      <h2 className="mb-1 font-heading text-title font-bold">Offers</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {on.size === 0
          ? "No offers on. Turn one on and students see an “Apply discount” bar in their cart."
          : "Students see these in their cart and pick one per order."}
      </p>
      <ul className="divide-y rounded-2xl border bg-card shadow-card">
        {OFFER_KEYS.map((key) => {
          const enabled = on.has(key);
          return (
            <li key={key} className="flex items-center gap-4 px-5 py-4">
              <IconTile>
                {key === "biryani" ? (
                  <Gift className="icon-tint-gold size-5" aria-hidden="true" />
                ) : (
                  <Discount className="icon-tint-gold size-5" aria-hidden="true" />
                )}
              </IconTile>
              <div className="min-w-0 flex-1">
                <p id={`offer-${key}`} className="font-semibold">
                  {OFFERS[key].title}
                </p>
                <p className="text-sm text-muted-foreground">{ADMIN_DETAIL[key]}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-labelledby={`offer-${key}`}
                disabled={pendingKey === key}
                onClick={() => toggle(key)}
                className={cn(
                  "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-input outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-60",
                  enabled ? "surface-primary border-transparent bg-primary" : "bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "size-6 rounded-full bg-card shadow-card transition-transform duration-(--dur-quick) ease-out-expo",
                    enabled ? "translate-x-6.5" : "translate-x-0.5",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
