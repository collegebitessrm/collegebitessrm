"use client";

import { useState, type ReactNode } from "react";
import { Check, X } from "@/components/icons";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { Restaurant } from "@/lib/data/types";
import {
 EMPTY_FILTERS,
 FAST_MINUTES,
 PRICE_BANDS,
 SORTS,
 type Diet,
 type HomeFilters,
 type PriceBand,
 type SortKey,
} from "@/lib/home-filters";
import { cn } from "@/lib/utils";

/**
 * The full filter sheet (bottom sheet, like Swiggy's): sort, diet, price,
 * delivery time, restaurants, popular and sold-out. It edits a draft, so
 * nothing moves behind it while you choose; the footer button shows how
 * many dishes the draft would leave ("Show 24 dishes") and applies it.
 * The draft starts from the live filters each time the sheet opens (the
 * body only mounts while open). Options are native radios / checkboxes,
 * so arrow keys and screen readers work as expected.
 */
export function FilterSheet({
 open,
 onOpenChange,
 filters,
 onApply,
 countFor,
 restaurants,
 showPopular,
}: {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 filters: HomeFilters;
 onApply: (next: HomeFilters) => void;
 /** How many dishes a set of filters would show — for the live count. */
 countFor: (f: HomeFilters) => number;
 restaurants: Restaurant[];
 showPopular: boolean;
}) {
 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent
 side="bottom"
 showCloseButton={false}
 className="mx-auto max-h-[92dvh] w-full max-w-md gap-0 rounded-t-[2rem] border-t-0 bg-background p-0 text-base"
 >
 <SheetBody
 initial={filters}
 onApply={(next) => {
 onApply(next);
 onOpenChange(false);
 }}
 onClose={() => onOpenChange(false)}
 countFor={countFor}
 restaurants={restaurants}
 showPopular={showPopular}
 />
 </SheetContent>
 </Sheet>
 );
}

function SheetBody({
 initial,
 onApply,
 onClose,
 countFor,
 restaurants,
 showPopular,
}: {
 initial: HomeFilters;
 onApply: (next: HomeFilters) => void;
 onClose: () => void;
 countFor: (f: HomeFilters) => number;
 restaurants: Restaurant[];
 showPopular: boolean;
}) {
 // Food type is chosen with Home's tiles; the sheet leaves it as it is.
 const [draft, setDraft] = useState(initial);
 const set = (patch: Partial<HomeFilters>) => setDraft((d) => ({ ...d, ...patch }));
 const count = countFor(draft);
 const open = restaurants.filter((r) => r.is_active);

 return (
 <>
 <header className="flex items-center gap-3 border-b px-6 pt-6 pb-4">
 <div className="min-w-0 flex-1">
 <SheetTitle className="font-heading text-headline font-bold">Filters</SheetTitle>
 <SheetDescription className="mt-0.5 text-sm">Narrow the dishes on Home.</SheetDescription>
 </div>
 <button
 type="button"
 onClick={() => setDraft({ ...EMPTY_FILTERS, type: draft.type })}
 className="rounded-full px-3 py-2 text-sm font-semibold text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 Clear all
 </button>
 <button
 type="button"
 onClick={onClose}
 aria-label="Close"
 className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary outline-none hover:bg-border focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <X className="size-5" />
 </button>
 </header>

 <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
 <Group legend="Sort by">
 {SORTS.map((s) => (
 <Option
 key={s.key}
 type="radio"
 name="sort"
 checked={draft.sort === s.key}
 onChange={() => set({ sort: s.key as SortKey })}
 >
 {s.label}
 </Option>
 ))}
 </Group>

 <Group legend="Diet">
 {([null, "veg", "nonveg"] as (Diet | null)[]).map((diet) => (
 <Option
 key={diet ?? "any"}
 type="radio"
 name="diet"
 checked={draft.diet === diet}
 onChange={() => set({ diet })}
 >
 {diet === null ? "Any" : diet === "veg" ? "Veg only" : "Non-veg only"}
 </Option>
 ))}
 </Group>

 <Group legend="Price">
 <Option type="radio" name="price" checked={draft.price === null} onChange={() => set({ price: null })}>
 Any
 </Option>
 {PRICE_BANDS.map((b) => (
 <Option
 key={b.key}
 type="radio"
 name="price"
 checked={draft.price === b.key}
 onChange={() => set({ price: b.key as PriceBand })}
 >
 {b.label}
 </Option>
 ))}
 </Group>

 {open.length > 1 && (
 <Group legend="Restaurants">
 {open.map((r) => {
 const on = draft.restaurants.includes(r.id);
 return (
 <Option
 key={r.id}
 type="checkbox"
 checked={on}
 onChange={() =>
 set({ restaurants: on ? draft.restaurants.filter((id) => id !== r.id) : [...draft.restaurants, r.id] })
 }
 >
 {r.name}
 </Option>
 );
 })}
 </Group>
 )}

 <Group legend="More">
 <Option type="checkbox" checked={draft.fast} onChange={() => set({ fast: !draft.fast })}>
 {FAST_MINUTES}-min delivery
 </Option>
 {showPopular && (
 <Option type="checkbox" checked={draft.popular} onChange={() => set({ popular: !draft.popular })}>
 Popular on campus
 </Option>
 )}
 <Option type="checkbox" checked={draft.soldOut} onChange={() => set({ soldOut: !draft.soldOut })}>
 Show sold-out dishes
 </Option>
 </Group>
 </div>

 <footer className="border-t bg-background px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
 <button
 type="button"
 onClick={() => onApply(draft)}
 disabled={count === 0}
 className=" flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-lg font-bold text-primary-foreground outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-60 disabled:shadow-none"
 >
 {count === 0 ? (
 "No dishes match. Try fewer"
 ) : (
 <>
 Show{" "}
 <span key={count} className="animate-bounce-count inline-block tabular-nums">
 {count}
 </span>{" "}
 {count === 1 ? "dish" : "dishes"}
 </>
 )}
 </button>
 </footer>
 </>
 );
}

function Group({ legend, children }: { legend: string; children: ReactNode }) {
 return (
 <fieldset className="mt-5">
 <legend className="text-label text-muted-foreground">{legend}</legend>
 <div className="mt-2.5 flex flex-wrap gap-2">{children}</div>
 </fieldset>
 );
}

/** A pill that is really a radio / checkbox (visually hidden input, styled label). */
function Option({
 type,
 name,
 checked,
 onChange,
 children,
}: {
 type: "radio" | "checkbox";
 name?: string;
 checked: boolean;
 onChange: () => void;
 children: ReactNode;
}) {
 return (
 <label className="relative cursor-pointer">
 <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
 <span
 className={cn(
 "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-[background-color,color,border-color,box-shadow] duration-(--dur-base) peer-focus-visible:ring-3 peer-focus-visible:ring-ring/80",
 checked ? " border-transparent bg-primary text-primary-foreground" : "bg-card shadow-card",
 )}
 >
 {checked && <Check className="animate-pop-in size-3.5" />}
 {children}
 </span>
 </label>
 );
}
