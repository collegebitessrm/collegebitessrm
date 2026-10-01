import {
  Carrot,
  Citrus,
  Coffee,
  Cookie,
  CookingPot,
  Egg,
  Hamburger,
  IceCream,
  Pepper,
  Pizza,
  Popcorn,
  Soup,
  type AppIcon,
} from "@/components/icons";
import { FOOD_TYPES } from "@/lib/home-filters";

// The taste profile's choices (public.taste_profiles). Client-safe — the
// sheet, the avatar and the server action all read these lists. The
// database checks the same rules (spice 1–5, the three diets, cravings
// from FOOD_TYPES, avatar a short id), so change them together.

/** How an avatar tile is lit — each one picks a surface from the current palette. */
export type AvatarTone = "hero" | "primary" | "chip" | "pink" | "aqua" | "gold";

export const AVATARS: { id: string; label: string; Icon: AppIcon; tone: AvatarTone }[] = [
  { id: "pot", label: "Biryani pot", Icon: CookingPot, tone: "hero" },
  { id: "noodles", label: "Noodle bowl", Icon: Soup, tone: "chip" },
  { id: "chilli", label: "Chilli", Icon: Pepper, tone: "primary" },
  { id: "egg", label: "Egg", Icon: Egg, tone: "gold" },
  { id: "pizza", label: "Pizza", Icon: Pizza, tone: "pink" },
  { id: "burger", label: "Burger", Icon: Hamburger, tone: "aqua" },
  { id: "chai", label: "Chai", Icon: Coffee, tone: "hero" },
  { id: "icecream", label: "Ice cream", Icon: IceCream, tone: "pink" },
  { id: "cookie", label: "Cookie", Icon: Cookie, tone: "gold" },
  { id: "carrot", label: "Carrot", Icon: Carrot, tone: "chip" },
  { id: "orange", label: "Orange", Icon: Citrus, tone: "primary" },
  { id: "popcorn", label: "Popcorn", Icon: Popcorn, tone: "aqua" },
];

/** Everyone starts with the biryani pot (the column's default). */
export const DEFAULT_AVATAR = "pot";

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export type Diet = "veg" | "egg" | "nonveg";

export const DIETS: { id: Diet; label: string }[] = [
  { id: "veg", label: "Veg" },
  { id: "egg", label: "Egg is fine" },
  { id: "nonveg", label: "Non-veg" },
];

export const SPICE_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "Mild" },
  { level: 2, label: "Gentle" },
  { level: 3, label: "Medium" },
  { level: 4, label: "Spicy" },
  { level: 5, label: "Extra spicy" },
];

/** The food types a student can say they crave — Home's tiles. */
export const CRAVINGS = FOOD_TYPES.map((t) => ({ key: t.key, label: t.label, photo: t.photo }));

export type TasteProfile = {
  avatar: string;
  spiceLevel: number | null;
  diet: Diet | null;
  cravings: string[];
};

export const EMPTY_TASTE: TasteProfile = { avatar: DEFAULT_AVATAR, spiceLevel: null, diet: null, cravings: [] };

/** How many of the three questions (spice, diet, cravings) are answered. */
export function answeredCount(t: TasteProfile): number {
  return (t.spiceLevel ? 1 : 0) + (t.diet ? 1 : 0) + (t.cravings.length > 0 ? 1 : 0);
}

/**
 * A one-tap note for the cart, from the spice answer: mild eaters get
 * "Less spicy please", spice lovers "Extra spicy please", the middle
 * nothing. Only ever offered, never typed in for them.
 */
export function spiceNote(level: number | null): string | null {
  if (level === 1 || level === 2) return "Less spicy please";
  if (level === 5) return "Extra spicy please";
  return null;
}

/** "Medium · Veg · Biryani, Noodles" — the Profile row's summary. */
export function tasteSummary(t: TasteProfile): string {
  const parts: string[] = [];
  if (t.spiceLevel) parts.push(SPICE_LEVELS[t.spiceLevel - 1].label);
  if (t.diet) parts.push(DIETS.find((d) => d.id === t.diet)!.label);
  if (t.cravings.length) {
    parts.push(
      t.cravings
        .map((k) => CRAVINGS.find((c) => c.key === k)?.label)
        .filter(Boolean)
        .join(", "),
    );
  }
  return parts.join(" · ");
}
