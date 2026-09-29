import type { SearchableDish } from "@/lib/data/restaurants";

/**
 * Lower-cased words of a query, e.g. "Dum  Biryani" → ["dum", "biryani"].
 * "non veg" / "non-veg" become the single word "nonveg" so that "veg" can
 * never match inside it.
 */
export function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/non[\s-]*veg/g, "nonveg")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function words(text: string): string[] {
  return queryTokens(text);
}

/**
 * True when every query word is the start of some word in the text, in any
 * order — "biry" finds "Biryani", but "veg" doesn't match inside "Non-Veg".
 */
export function matchesAll(text: string, tokens: string[]): boolean {
  const ws = words(text);
  return tokens.every((t) => ws.some((w) => w.startsWith(t)));
}

/**
 * Dishes matching the query against the dish name, its category and its
 * restaurant's name — "dum biryani", "biryani dum" and "a1 dum" all work.
 * "veg" / "non veg" filter on the dish's actual veg flag rather than
 * matching text (categories are named "Veg Starters" and "Non-Veg
 * Biryani"). Ranked: whole phrase at the start of the dish name, then
 * inside it, then all words in the name, then matched only via
 * category/restaurant; available before sold out; cheaper first.
 */
export function searchDishes(
  dishes: SearchableDish[],
  restaurantNames: Record<string, string>,
  query: string,
  limit = 20,
): SearchableDish[] {
  const all = queryTokens(query);
  if (all.length === 0) return [];

  const veg = all.includes("nonveg") ? false : all.includes("veg") ? true : null;
  const tokens = all.filter((t) => t !== "veg" && t !== "nonveg");
  const phrase = tokens.join(" ");

  const rank = (d: SearchableDish) => {
    if (!phrase) return 0;
    const name = words(d.name).join(" ");
    if (name.startsWith(phrase)) return 0;
    if (name.includes(phrase)) return 1;
    if (matchesAll(d.name, tokens)) return 2;
    return 3;
  };

  return dishes
    .filter((d) => veg === null || d.isVeg === veg)
    .filter((d) => matchesAll(`${d.name} ${d.category ?? ""} ${restaurantNames[d.restaurantId] ?? ""}`, tokens))
    .map((d) => ({ d, r: rank(d) }))
    .sort(
      (a, b) =>
        a.r - b.r ||
        Number(b.d.isAvailable) - Number(a.d.isAvailable) ||
        a.d.price - b.d.price,
    )
    .slice(0, limit)
    .map(({ d }) => d);
}
