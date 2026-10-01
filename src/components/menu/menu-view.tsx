"use client";

import { useEffect, useState } from "react";
import { Drumstick, Leaf, Search, SearchX, UtensilsCrossed, X, type AppIcon } from "@/components/icons";
import { EmptyState } from "@/components/empty-state";
import { CartBar } from "@/components/cart/cart-bar";
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
import { VegMark } from "@/components/veg-mark";
import { addToCart, conflictsWithCart, setQuantity, useCart } from "@/lib/cart/store";
import { AllCategoriesIcon, getCuisineIcon } from "@/lib/cuisine-icons";
import type { Dish, MenuSection, Restaurant } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { DishCard } from "./dish-card";

const ALL = "all";
const sectionKey = (s: MenuSection) => s.category?.id ?? "uncategorized";
const sectionName = (s: MenuSection) => s.category?.name ?? "More";

export function MenuView({
  restaurant,
  sections,
  profilePhone,
  orderingEnabled,
  closedChip = "Paused",
  closedNote,
  usualDishId,
  highlyReorderedDishIds,
  focusDishId = null,
  spiceLevel = null,
  likedDishIds = [],
}: {
  restaurant: Restaurant;
  sections: MenuSection[];
  profilePhone: string;
  /** Campus-wide kill switch — dishes become un-addable when off, same as a closed restaurant. */
  orderingEnabled: boolean;
  /** "Closed" — shown on dish cards while ordering is shut. */
  closedChip?: string;
  /** "Ordering is closed right now" — shown in the cart while ordering is shut. */
  closedNote?: string;
  /** This student's most-ordered dish at this restaurant, or null — tags it "Your usual". */
  usualDishId: string | null;
  /** Dishes campus-wide with a strong repeat-purchase signal — tags them "Highly re-ordered". */
  highlyReorderedDishIds: Set<string>;
  /** Dish to scroll to and briefly highlight on arrival (from ?dish=). */
  focusDishId?: string | null;
  /** The taste profile's spice level, for the cart's one-tap note. */
  spiceLevel?: number | null;
  /** Dishes this student has hearted — their hearts start filled. */
  likedDishIds?: string[];
}) {
  const cart = useCart();
  const [filter, setFilter] = useState(ALL);
  const [diet, setDiet] = useState<Diet>("all");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!focusDishId) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let clear: ReturnType<typeof setTimeout> | undefined;
    // Waits out the page's slide-in view transition (~400ms, see
    // globals.css) so the scroll doesn't fight it; instant with reduced motion.
    const start = setTimeout(
      () => {
        const el = document.getElementById(`dish-${focusDishId}`);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
        setHighlighted(focusDishId);
        clear = setTimeout(() => setHighlighted(null), 3200);
      },
      reduceMotion ? 0 : 350,
    );
    return () => {
      clearTimeout(start);
      clearTimeout(clear);
    };
  }, [focusDishId]);
  // Dish waiting on "replace your cart?" confirmation.
  const [pendingDish, setPendingDish] = useState<Dish | null>(null);

  const cartRestaurant = { id: restaurant.id, name: restaurant.name };
  const quantityOf = (dishId: string) =>
    cart.restaurantId === restaurant.id
      ? (cart.lines.find((l) => l.dishId === dishId)?.quantity ?? 0)
      : 0;

  function closeSearch() {
    setQuery("");
    setSearchOpen(false);
  }

  function handleAdd(dish: Dish) {
    if (conflictsWithCart(restaurant.id)) setPendingDish(dish);
    else addToCart(cartRestaurant, dish);
  }

  const q = query.trim().toLowerCase();
  // Searching looks across the whole menu, not just the selected category
  // chip — a student searching usually doesn't know (or care) which
  // category something's in.
  const byCategory = q || filter === ALL ? sections : sections.filter((s) => sectionKey(s) === filter);
  // Veg / Non-veg only matter on a menu that has both; an all-veg juice bar
  // or an all-chicken biryani shop gets no toggles.
  const hasVeg = sections.some((s) => s.dishes.some((d) => d.is_veg));
  const hasNonVeg = sections.some((s) => s.dishes.some((d) => !d.is_veg));
  const showDiet = hasVeg && hasNonVeg;
  const byDiet =
    diet === "all"
      ? byCategory
      : byCategory
          .map((s) => ({ ...s, dishes: s.dishes.filter((d) => d.is_veg === (diet === "veg")) }))
          .filter((s) => s.dishes.length > 0);
  const visible = q
    ? byDiet
        .map((s) => ({ ...s, dishes: s.dishes.filter((d) => d.name.toLowerCase().includes(q)) }))
        .filter((s) => s.dishes.length > 0)
    : byDiet;

  const chips = [{ key: ALL, name: "All" }, ...sections.map((s) => ({ key: sectionKey(s), name: sectionName(s) }))];

  return (
    <>
      {sections.length > 0 && (
        // One sticky row for every way of narrowing the menu — search, then
        // a scrolling rail of Veg / Non-veg and the categories — so none of
        // them scroll away on a 40-dish menu. Search collapses to an icon
        // and expands in place over the rail.
        <div className="sticky top-0 z-10 -mx-6 border-b bg-background/85 px-6 py-2.5 backdrop-blur-lg">
          <div className="flex items-center gap-2">
            {searchOpen ? (
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search dishes</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                  placeholder="Search this menu…"
                  className="animate-pop-in h-10 w-full rounded-full border bg-card pr-3 pl-10 shadow-card outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/80 [&::-webkit-search-cancel-button]:hidden"
                />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search this menu"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-primary shadow-card outline-none hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                <Search className="size-4.5" />
              </button>
            )}

            {searchOpen && (
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="flex size-10 shrink-0 items-center justify-center rounded-full border bg-card shadow-card outline-none hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80"
              >
                <X className="size-4.5" />
              </button>
            )}

            {!searchOpen && (sections.length > 1 || showDiet) && (
              <nav aria-label="Menu filters" className="-mr-6 min-w-0 flex-1">
                <ul className="flex gap-2 overflow-x-auto pr-6 [scrollbar-width:none]">
                  {showDiet && (
                    <>
                      <li className="shrink-0">
                        <DietToggle kind="veg" active={diet === "veg"} onToggle={() => setDiet((d) => (d === "veg" ? "all" : "veg"))} />
                      </li>
                      <li className="shrink-0">
                        <DietToggle
                          kind="nonveg"
                          active={diet === "nonveg"}
                          onToggle={() => setDiet((d) => (d === "nonveg" ? "all" : "nonveg"))}
                        />
                      </li>
                      {sections.length > 1 && <li aria-hidden="true" className="my-2 w-px shrink-0 bg-border" />}
                    </>
                  )}
                  {sections.length > 1 && chips.map((chip) => {
                    const Icon = chip.key === ALL ? AllCategoriesIcon : getCuisineIcon(chip.name);
                    return (
                      <li key={chip.key} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setFilter(chip.key)}
                          aria-pressed={filter === chip.key}
                          className={cn(
                            "flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
                            filter === chip.key
                              ? "glow-cyan border-transparent bg-chip-active text-chip-active-foreground"
                              : "bg-card text-foreground shadow-card hover:border-ring/50",
                          )}
                        >
                          <Icon className="size-4" aria-hidden="true" />
                          {chip.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <EmptyState compact icon={UtensilsCrossed} title="Nothing on the menu yet">
          Check back soon.
        </EmptyState>
      )}

      {sections.length > 0 && visible.length === 0 && (
        <EmptyState
          compact
          icon={q ? SearchX : diet === "veg" ? Leaf : Drumstick}
          title={q ? `No dishes match “${query.trim()}”` : `No ${diet === "veg" ? "veg" : "non-veg"} dishes here`}
        >
          {q ? "Try a different search." : `Try another category, or switch ${diet === "veg" ? "Veg" : "Non-veg"} off.`}
        </EmptyState>
      )}

      {visible.map((section) => (
        <section key={sectionKey(section)} aria-labelledby={`sec-${sectionKey(section)}`} className="pt-7">
          <SectionHeading
            id={`sec-${sectionKey(section)}`}
            name={sectionName(section)}
            count={section.dishes.length}
            icon={getCuisineIcon(sectionName(section))}
          />
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6">
            {section.dishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                restaurantName={restaurant.name}
                quantity={quantityOf(dish.id)}
                orderable={restaurant.is_active && orderingEnabled}
                pausedOnly={restaurant.is_active && !orderingEnabled}
                pausedLabel={closedChip}
                isUsual={dish.id === usualDishId}
                liked={likedDishIds.includes(dish.id)}
                isHighlyReordered={highlyReorderedDishIds.has(dish.id)}
                highlighted={highlighted === dish.id}
                onAdd={() => handleAdd(dish)}
                onChangeQuantity={(q) => setQuantity(dish.id, q)}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="h-8" aria-hidden="true" />

      <CartBar
        profilePhone={profilePhone}
        currentRestaurantId={restaurant.id}
        orderingEnabled={orderingEnabled}
        closedNote={closedNote}
        spiceLevel={spiceLevel}
      />

      <AlertDialog open={pendingDish !== null} onOpenChange={(open) => !open && setPendingDish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Start a new cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items from {cart.restaurantName}. Each order is from one restaurant, so
              adding this will clear that cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my cart</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDish) addToCart(cartRestaurant, pendingDish);
                setPendingDish(null);
              }}
            >
              Start new cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type Diet = "all" | "veg" | "nonveg";

/** One half of the Veg / Non-veg filter — tap again to show everything. */
function DietToggle({ kind, active, onToggle }: { kind: "veg" | "nonveg"; active: boolean; onToggle: () => void }) {
  const veg = kind === "veg";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={veg ? "Veg only" : "Non-veg only"}
      className={cn(
        "flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/80",
        !active && "bg-card text-foreground shadow-card hover:border-ring/50",
        active && veg && "border-success bg-success-soft text-success",
        active && !veg && "border-destructive bg-destructive/10 text-destructive",
      )}
    >
      <VegMark isVeg={veg} className="size-4" />
      {veg ? "Veg" : "Non-veg"}
    </button>
  );
}

/** A menu section's heading: its food icon on a small lit tile, the name, and how many dishes. */
function SectionHeading({ id, name, count, icon: Icon }: { id: string; name: string; count: number; icon: AppIcon }) {
  return (
    <h2 id={id} className="flex items-center gap-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-soft text-pink-soft-foreground">
        <Icon className="icon-tint-gold size-5" />
      </span>
      <span className="min-w-0 font-heading text-title font-bold">{name}</span>
      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
        {count}
      </span>
    </h2>
  );
}
