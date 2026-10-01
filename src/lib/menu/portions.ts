import type { Dish } from "@/lib/data/types";

// Some menus list each option of a dish as its own dish, and the menu
// groups them into ONE card with a picker, so a long menu doesn't read as
// near-identical cards side by side. Nothing changes underneath: each
// option is still its own dish (id, price, cart line, order item).
//
//   Sizes   "Chicken Dum Biryani (Half)" / "(Single)" / "(Full)"
//           (Biryani Nation) → Half / Single / Full
//   Styles  "Veg Fried Rice" + "Veg Fried Rice (White)" (Local Home
//           Kitchen) → Regular / White — the plain dish is the "Regular".

const TAGGED = /^(.*\S)\s+\((Half|Single|Full|White)\)$/;
const ORDER = ["Half", "Single", "Full", "Regular", "White"];
/** Tags whose untagged twin is the dish's other option. */
const PAIRS_WITH_PLAIN: Record<string, string> = { White: "Regular" };

/** "Chicken Dum Biryani (Full)" → { base: "Chicken Dum Biryani", portion: "Full" }; others → portion null. */
export function splitPortion(name: string): { base: string; portion: string | null } {
  const m = name.match(TAGGED);
  return m ? { base: m[1], portion: m[2] } : { base: name, portion: null };
}

export type MenuItem =
  | { kind: "dish"; dish: Dish }
  | { kind: "portions"; base: string; portions: { label: string; dish: Dish }[] };

/** What the picker asks: sizes are portions, Regular / White is a style. */
export function pickerPrompt(labels: string[]): string {
  return labels.includes("White") ? "Choose a style" : "Choose a portion";
}

/**
 * A section's dishes as menu cards: a dish's options become one "portions"
 * item at the first one's place (Single before Full, Regular before
 * White). A tag with no sibling stays a plain dish.
 */
export function groupPortions(dishes: Dish[]): MenuItem[] {
  const byName = new Map(dishes.map((d) => [d.name, d]));
  const groups = new Map<string, { label: string; dish: Dish }[]>();
  for (const d of dishes) {
    const { base, portion } = splitPortion(d.name);
    if (!portion) continue;
    const list = groups.get(base) ?? [];
    list.push({ label: portion, dish: d });
    const plainLabel = PAIRS_WITH_PLAIN[portion];
    const plain = plainLabel ? byName.get(base) : undefined;
    if (plain && !list.some((x) => x.dish.id === plain.id)) list.push({ label: plainLabel, dish: plain });
    groups.set(base, list);
  }
  const groupOf = (d: Dish) => {
    const { base, portion } = splitPortion(d.name);
    const g = groups.get(portion ? base : d.name);
    return g && g.length > 1 && g.some((x) => x.dish.id === d.id) ? { base: portion ? base : d.name, g } : null;
  };
  const items: MenuItem[] = [];
  const placed = new Set<string>();
  for (const d of dishes) {
    const found = groupOf(d);
    if (!found) {
      items.push({ kind: "dish", dish: d });
      continue;
    }
    if (placed.has(found.base)) continue;
    placed.add(found.base);
    items.push({
      kind: "portions",
      base: found.base,
      portions: [...found.g].sort((a, b) => ORDER.indexOf(a.label) - ORDER.indexOf(b.label)),
    });
  }
  return items;
}
