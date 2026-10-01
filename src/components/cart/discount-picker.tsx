"use client";

import { useState } from "react";
import { Check, ChevronDown, Discount, Gift, Minus, Plus } from "@/components/icons";
import { IconTile } from "@/components/icon-tile";
import { formatRupees } from "@/lib/format";
import { splitPortion } from "@/lib/menu/portions";
import { OFFERS, type FreeChoice, type OfferKey } from "@/lib/offers";
import { cn } from "@/lib/utils";

export type OfferOption = {
  key: OfferKey;
  /** What the student saves with it right now (0 when not usable yet). */
  saving: number;
  /** Why it can't be used on this cart, or null when it can. */
  blocked: string | null;
};

/**
 * The cart's "Apply discount" bar: shown while the admin has any offer on.
 * Collapsed it's one row (the applied offer, or how many there are);
 * opened it lists the offers as a radio group — one per order, never
 * stacked — and, for the biryani offer, the Single biryanis to pick free.
 */
export function DiscountPicker({
  options,
  selected,
  onSelect,
  freeChoices,
  allowance,
  picks,
  onPick,
}: {
  options: OfferOption[];
  selected: OfferKey | null;
  onSelect: (offer: OfferKey | null) => void;
  /** This restaurant's available Single biryanis. */
  freeChoices: FreeChoice[];
  /** Free Singles this cart has earned. */
  allowance: number;
  /** Picked free Singles, already clamped to the allowance. */
  picks: Record<string, number>;
  onPick: (dishId: string, quantity: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const applied = options.find((o) => o.key === selected && !o.blocked) ?? null;
  const picked = Object.values(picks).reduce((n, q) => n + q, 0);
  const needsPick = selected === "biryani" && picked === 0;

  return (
    <div
      className={cn(
        "mt-4 rounded-2xl border bg-card shadow-card",
        applied ? "border-success/40" : "border-dashed border-primary/50",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="discount-options"
        className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
      >
        <IconTile className={cn(applied && "bg-success-soft text-success")}>
          <Discount className="icon-tint-gold size-5" aria-hidden="true" />
        </IconTile>
        <span className="min-w-0 flex-1">
          {applied ? (
            <>
              <span className="block font-semibold">{OFFERS[applied.key].short} applied</span>
              <span className="block text-sm font-semibold text-success">
                {needsPick ? "Pick your free biryani below" : `You save ${formatRupees(applied.saving)}`}
              </span>
            </>
          ) : (
            <>
              <span className="block font-semibold">Apply discount</span>
              <span className="block text-sm text-muted-foreground">
                {options.length === 1 ? "1 offer available" : `${options.length} offers available`}
              </span>
            </>
          )}
        </span>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform duration-(--dur-base) ease-out-expo", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id="discount-options" className="border-t px-3 pt-3 pb-3">
          <div role="radiogroup" aria-label="Discount" className="space-y-2">
            {options.map((o) => (
              <OfferRow
                key={o.key}
                option={o}
                checked={selected === o.key}
                onCheck={() => onSelect(selected === o.key ? null : o.key)}
              />
            ))}
          </div>

          {selected === "biryani" && !options.find((o) => o.key === "biryani")?.blocked && (
            <div className="mt-3 rounded-2xl bg-secondary px-4 py-3">
              <p className="flex items-center gap-2 font-semibold">
                <Gift className="icon-tint-gold size-5 shrink-0" aria-hidden="true" />
                Pick {allowance === 1 ? "your free Single biryani" : `${allowance} free Single biryanis`}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
                {picked} of {allowance} picked
              </p>
              <ul className="mt-2 divide-y divide-border">
                {freeChoices.map((c) => {
                  const qty = picks[c.id] ?? 0;
                  const name = splitPortion(c.name).base;
                  return (
                    <li key={c.id} className="flex items-center gap-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block leading-snug font-medium">{name}</span>
                        <span className="text-sm text-muted-foreground">
                          Single · <s className="tabular-nums">{formatRupees(c.price)}</s>{" "}
                          <span className="font-semibold text-success">Free</span>
                        </span>
                      </span>
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => onPick(c.id, 1)}
                          disabled={picked >= allowance}
                          aria-label={`Pick ${name} free`}
                          className="h-9 shrink-0 rounded-full border bg-card px-4 text-sm font-semibold text-primary shadow-card outline-none hover:border-ring/50 focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-40"
                        >
                          Pick
                        </button>
                      ) : (
                        <div className="flex h-9 shrink-0 items-center gap-1 rounded-full border bg-card p-1 shadow-card">
                          <button
                            type="button"
                            onClick={() => onPick(c.id, qty - 1)}
                            aria-label={`One less free ${name}`}
                            className="flex size-7 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring/80"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                          <button
                            type="button"
                            onClick={() => onPick(c.id, qty + 1)}
                            disabled={picked >= allowance}
                            aria-label={`One more free ${name}`}
                            className="surface-primary flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring/80 disabled:opacity-40"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <p className="mt-3 px-2 text-sm text-muted-foreground">One offer per order.</p>
        </div>
      )}
    </div>
  );
}

function OfferRow({ option, checked, onCheck }: { option: OfferOption; checked: boolean; onCheck: () => void }) {
  const { key, saving, blocked } = option;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={blocked !== null}
      onClick={onCheck}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:cursor-not-allowed",
        checked ? "border-primary bg-background" : "bg-background hover:border-ring/50",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          checked ? "surface-primary border-primary bg-primary text-primary-foreground" : "border-input",
        )}
        aria-hidden="true"
      >
        {checked && <Check className="size-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block font-semibold", blocked && "text-muted-foreground")}>{OFFERS[key].title}</span>
        <span className="block text-sm text-muted-foreground">{blocked ?? OFFERS[key].detail}</span>
      </span>
      {!blocked && saving > 0 && (
        <span className="shrink-0 rounded-full bg-success-soft px-2.5 py-0.5 text-sm font-semibold text-success tabular-nums">
          −{formatRupees(saving)}
        </span>
      )}
    </button>
  );
}
