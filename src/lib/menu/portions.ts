import type { Dish } from "@/lib/data/types";

// Some menus list each size as its own dish: "Chicken Dum Biryani (Single)"
// and "Chicken Dum Biryani (Full)" (Biryani Nation). The menu groups those
// into ONE card with a portion picker, so a 37-dish menu doesn't read as
// two near-identical cards per biryani. Nothing changes underneath: each
// portion is still its own dish (id, price, cart line, order item).

const PORTION = /^(.*\S)\s+\((Single|Full)\)$/;
const ORDER = ["Single", "Full"];

/** "Chicken Dum Biryani (Full)" → { base: "Chicken Dum Biryani", portion: "Full" }; others → portion null. */
export function splitPortion(name: string): { base: string; portion: string | null } {
  const m = name.match(PORTION);
  return m ? { base: m[1], portion: m[2] } : { base: name, portion: null };
}

export type MenuItem =
  | { kind: "dish"; dish: Dish }
  | { kind: "portions"; base: string; portions: { label: string; dish: Dish }[] };

/**
 * A section's dishes as menu cards: portions of the same dish become one
 * "portions" item (at the first one's place, Single before Full); a lone
 * "(Single)" with no sibling stays a plain dish.
 */
export function groupPortions(dishes: Dish[]): MenuItem[] {
  const groups = new Map<string, { label: string; dish: Dish }[]>();
  for (const d of dishes) {
    const { base, portion } = splitPortion(d.name);
    if (!portion) continue;
    groups.set(base, [...(groups.get(base) ?? []), { label: portion, dish: d }]);
  }
  const items: MenuItem[] = [];
  const placed = new Set<string>();
  for (const d of dishes) {
    const { base, portion } = splitPortion(d.name);
    const group = portion ? groups.get(base) : undefined;
    if (!group || group.length < 2) {
      items.push({ kind: "dish", dish: d });
      continue;
    }
    if (placed.has(base)) continue;
    placed.add(base);
    items.push({
      kind: "portions",
      base,
      portions: [...group].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label)),
    });
  }
  return items;
}
