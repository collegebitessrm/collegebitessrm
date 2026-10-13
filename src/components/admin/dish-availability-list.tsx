"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Loader2, PackageX, Search, SearchX } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { EmptyState } from "@/components/empty-state";
import { VegMark } from "@/components/veg-mark";
import { setDishAvailable } from "@/lib/admin/actions";
import type { AdminDish } from "@/lib/data/admin";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

const ALL = "all";

/**
 * The Sold out page's list: every dish on every menu, with one button each.
 * Filters (restaurant, search, "Sold out only") narrow a ~110-dish list
 * down to the one the admin came for; the rows stay grouped by restaurant
 * and section so it reads like the menus do.
 *
 * Each toggle updates that row on its own — no page reload — and the
 * button shows exactly what tapping it will do.
 */
export function DishAvailabilityList({ dishes }: { dishes: AdminDish[] }) {
 const [restaurant, setRestaurant] = useState(ALL);
 const [query, setQuery] = useState("");
 const [soldOutOnly, setSoldOutOnly] = useState(false);
 // Toggled rows, so the list updates without waiting for a refetch.
 const [changed, setChanged] = useState<Record<string, boolean>>({});

 const available = (d: AdminDish) => changed[d.id] ?? d.isAvailable;

 const restaurants = useMemo(() => {
 const byId = new Map<string, string>();
 for (const d of dishes) byId.set(d.restaurantId, d.restaurantName);
 return [...byId].map(([id, name]) => ({ id, name }));
 }, [dishes]);

 const visible = useMemo(() => {
 const term = query.trim().toLowerCase();
 return dishes.filter(
 (d) =>
 (restaurant === ALL || d.restaurantId === restaurant) &&
 (!soldOutOnly || !available(d)) &&
 (!term ||
 d.name.toLowerCase().includes(term) ||
 (d.category?.toLowerCase().includes(term) ?? false) ||
 d.restaurantName.toLowerCase().includes(term)),
 );
 // `changed` matters: a row can drop out of the "Sold out only" view.
 }, [dishes, restaurant, query, soldOutOnly, changed]); // eslint-disable-line react-hooks/exhaustive-deps

 // Grouped for display: restaurant → section, in menu order.
 const groups = useMemo(() => {
 const out: { key: string; restaurant: string; category: string | null; dishes: AdminDish[] }[] = [];
 for (const d of visible) {
 const key = `${d.restaurantId}-${d.category ?? ""}`;
 const last = out.at(-1);
 if (last?.key === key) last.dishes.push(d);
 else out.push({ key, restaurant: d.restaurantName, category: d.category, dishes: [d] });
 }
 return out;
 }, [visible]);

 const soldOutCount = dishes.filter((d) => !available(d)).length;

 return (
 <div className="flex flex-col gap-4">
 <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
 <Tab active={restaurant === ALL} onClick={() => setRestaurant(ALL)}>
 All restaurants
 </Tab>
 {restaurants.map((r) => (
 <Tab key={r.id} active={restaurant === r.id} onClick={() => setRestaurant(r.id)}>
 {r.name}
 </Tab>
 ))}
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <label className="relative min-w-0 flex-1">
 <span className="sr-only">Search dishes</span>
 <Search
 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
 aria-hidden="true"
 />
 <input
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search dishes…"
 className="h-11 w-full rounded-2xl border bg-card pr-3 pl-10 shadow-card outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:hidden"
 />
 </label>
 <button
 type="button"
 onClick={() => setSoldOutOnly((v) => !v)}
 aria-pressed={soldOutOnly}
 className={cn(
 "flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold shadow-card outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/40",
 soldOutOnly
 ? "border-destructive bg-destructive/10 text-destructive"
 : "bg-card hover:bg-secondary",
 )}
 >
 <PackageX className="size-4" aria-hidden="true" />
 Sold out only
 <span className="tabular-nums">{soldOutCount}</span>
 </button>
 </div>

 {groups.length === 0 ? (
 <EmptyState compact icon={soldOutOnly ? PackageX : SearchX} title={soldOutOnly ? "Nothing is sold out" : "No dishes match"}>
 {soldOutOnly ? "Every dish is on sale right now." : "Try a different search or restaurant."}
 </EmptyState>
 ) : (
 groups.map((group) => (
 <section key={group.key} aria-labelledby={`sec-${group.key}`}>
 <h2 id={`sec-${group.key}`} className="mb-2 flex items-baseline gap-2">
 <span className="font-heading text-title font-bold">{group.category ?? "Menu"}</span>
 <span className="truncate text-sm text-muted-foreground">{group.restaurant}</span>
 </h2>
 <ul className="flex flex-col gap-2">
 {group.dishes.map((dish) => (
 <li key={dish.id}>
 <DishRow
 dish={dish}
 available={available(dish)}
 onChange={(next) => setChanged((c) => ({ ...c, [dish.id]: next }))}
 />
 </li>
 ))}
 </ul>
 </section>
 ))
 )}
 </div>
 );
}

function DishRow({
 dish,
 available,
 onChange,
}: {
 dish: AdminDish;
 available: boolean;
 onChange: (available: boolean) => void;
}) {
 const [pending, startTransition] = useTransition();
 const photo = getDishPhoto(dish.restaurantName, dish.name, dish.imageUrl);

 function toggle() {
 const next = !available;
 startTransition(async () => {
 const result = await setDishAvailable(dish.id, next);
 if (result.ok) {
 onChange(next);
 toast.success(`${dish.name} is ${next ? "back on sale" : "sold out"}.`);
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <div className="flex items-center gap-3 rounded-2xl border bg-card p-2.5 pr-3 shadow-card">
 <span
 className={cn(
 "relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary font-heading font-bold text-foreground/60",
 !available && "opacity-60 grayscale",
 )}
 >
 {photo ? (
 <BlurImage src={photo} alt="" sizes="48px" className="object-cover" />
 ) : (
 <span aria-hidden="true">{dish.name.trim().charAt(0)}</span>
 )}
 </span>

 <div className="min-w-0 flex-1">
 <p className={cn("flex items-center gap-1.5 font-semibold", !available && "text-muted-foreground")}>
 <VegMark isVeg={dish.isVeg} className="size-3.5" />
 <span className={cn("truncate", !available && "line-through")}>{dish.name}</span>
 </p>
 <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
 {formatRupees(dish.price)}
 {!available && <span className="font-semibold text-destructive"> · Sold out</span>}
 </p>
 </div>

 <button
 type="button"
 disabled={pending}
 onClick={toggle}
 className={cn(
 "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/80 disabled:opacity-70",
 available
 ? "border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10"
 : "bg-success text-success-foreground hover:bg-success/90",
 )}
 >
 {pending && <Loader2 className="size-3.5 animate-spin" />}
 {available ? "Sold out" : "Back on sale"}
 </button>
 </div>
 );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
 return (
 <button
 type="button"
 onClick={onClick}
 aria-pressed={active}
 className={cn(
 "h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80",
 active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-border",
 )}
 >
 {children}
 </button>
 );
}
