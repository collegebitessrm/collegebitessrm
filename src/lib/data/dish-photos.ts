// Static photo lookup for restaurant covers and dish thumbnails. Deliberately
// NOT a database column — these are just files under public/photos/, and
// matching them by (restaurant name, dish name) needs no schema change. Only
// dishes with a photo of the same (or, where the client agreed, a very
// close) dish are listed here — a dish missing from a restaurant's map
// falls back to the plain placeholder rather than showing a wrong photo.
// Several dishes share one file on purpose: the same dish at another
// restaurant, a "(White)" version, a Single / Full size.
//
// A changed photo gets a NEW filename rather than overwriting the old one —
// an outside cache can keep serving an old file by its URL.

const COVERS = "/photos/covers";
const D = "/photos/dishes";
const photo = (file: string) => `${D}/${file}.jpg`;

/** Restaurant name -> cover photo shown on the hero banner. */
export const RESTAURANT_COVER_PHOTOS: Record<string, string> = {
  "Triangle Food Court": `${COVERS}/triangle-food-court.jpg`,
  "Local Home Kitchen": `${COVERS}/local-home-kitchen.jpg`,
  "Clg Bites Biryani Nation": `${COVERS}/biryani-nation.jpg`,
};

/** Both sizes of a Biryani Nation dish share one photo. */
function sizes(name: string, file: string): Record<string, string> {
  return { [`${name} (Single)`]: photo(file), [`${name} (Full)`]: photo(file) };
}

/** Restaurant name -> { dish name -> thumbnail photo }. */
export const DISH_PHOTOS: Record<string, Record<string, string>> = {
  "Triangle Food Court": {
    "Veg Manchurian": photo("veg-manchurian"),
    "Paneer Manchurian": photo("paneer-manchurian"),
    "Mushroom Manchurian": photo("mushroom-manchurian"),
    "Baby Corn Manchurian": photo("crispy-baby-corn"),
    "Vegetable Fried Rice": photo("veg-fried-rice"),
    "Paneer Fried Rice": photo("paneer-fried-rice"),
    "Veg Manchurian Fried Rice": photo("veg-manchurian-fried-rice"),
    "Vegetable Noodles": photo("veg-noodles"),
    "Veg Manchurian Noodles": photo("veg-manchurian-noodles"),
    "Paneer Noodles": photo("paneer-noodles"),
    "Cashew Biryani": photo("kaju-biryani"),
    "Paneer Biryani": photo("paneer-biryani"),
    "Mushroom Biryani": photo("mushroom-biryani"),
    "Chicken Manchurian": photo("chicken-manchurian"),
    "Chilli Chicken": photo("chilli-chicken"),
    "Chicken 65": photo("chicken-65"),
    "Majestic Chicken": photo("chicken-majestic"),
    "Chicken Fried Rice": photo("chicken-fried-rice"),
    "Chicken Manchurian Fried Rice": photo("chicken-manchurian-rice-lhk"),
    "Egg Fried Rice (Double Egg)": photo("double-egg-fried-rice"),
    "Egg Manchurian Fried Rice": photo("egg-manchurian-fried-rice"),
    "Chicken Noodles": photo("chicken-noodles"),
    "Chicken Manchurian Noodles": photo("chicken-manchurian-noodles-v2"),
    "Egg Noodles": photo("egg-noodles"),
    "Egg Manchurian Noodles": photo("egg-manchurian-noodles"),
    "Chicken Dum Biryani": photo("chicken-dum-biryani"),
    "Chicken Fry Biryani": photo("chicken-fry-biryani"),
    "Chicken Curry Biryani": photo("chicken-curry-biryani"),
    "Egg Biryani": photo("egg-biryani"),
    "Gongura Chicken Biryani": photo("gongura-chicken-biryani"),
    "Boneless Biryani": photo("boneless-biryani"),
    // Added 1 Oct 2026 (Openverse photos, credited on /terms).
    "Chicken 555": photo("chicken-555"),
    "Garlic Chicken": photo("garlic-chicken"),
    "Lemon Chicken": photo("lemon-chicken"),
    "Pepper Chicken": photo("pepper-chicken"),
    "SP Kaju Noodles": photo("kaju-noodles"),
    "Zeera Fried Rice": photo("jeera-rice"),
    "Tomato Fried Rice": photo("tomato-rice"),
    "Corn Fried Rice": photo("corn-fried-rice"),
    "Baby Corn Fried Rice": photo("corn-fried-rice"),
    // Photos from the developer (1 Oct 2026).
    "Mushroom Noodles": photo("mushroom-noodles"),
  },

  "Local Home Kitchen": {
    "Chicken Dum Biryani": photo("chicken-dum-biryani"),
    "Chicken Fry Biryani": photo("chicken-fry-biryani"),
    "Chicken Boneless Biryani": photo("boneless-biryani"),
    "Chicken 65 Biryani": photo("chicken-65-biryani"),
    "Chicken Lollipop Biryani": photo("chicken-lollipop-biryani"),
    "Mughlai Biryani": photo("mughlai-biryani"),
    "Mushroom Biryani": photo("mushroom-biryani"),
    "Kaju Mushroom Biryani": photo("kaju-mushroom-biryani"),
    "Paneer Biryani": photo("paneer-biryani"),
    "Kaju Paneer Biryani": photo("kaju-paneer-biryani"),

    "Veg Fried Rice": photo("veg-fried-rice"),
    "Veg Fried Rice (White)": photo("veg-fried-rice"),
    "Veg Manchurian Rice": photo("veg-manchurian-fried-rice"),
    "Egg Fried Rice": photo("egg-fried-rice"),
    "Egg Fried Rice (White)": photo("egg-fried-rice"),
    "Egg Manchurian Rice": photo("egg-manchurian-fried-rice"),
    "Chicken Fried Rice": photo("chicken-fried-rice"),
    "Chicken Fried Rice (White)": photo("chicken-fried-rice"),
    "Chicken Manchurian Rice": photo("chicken-manchurian-rice-lhk"),
    "Double Egg Chicken Fried Rice": photo("double-egg-chicken-fried-rice"),
    "Double Egg Chicken Fried Rice (White)": photo("double-egg-chicken-fried-rice"),

    "Veg Noodles": photo("veg-noodles"),
    "Veg Noodles (White)": photo("veg-noodles"),
    "Veg Manchurian Noodles": photo("veg-manchurian-noodles"),
    "Egg Noodles": photo("egg-hakka-noodles"),
    "Egg Noodles (White)": photo("egg-hakka-noodles"),
    "Egg Manchurian Noodles": photo("egg-manchurian-noodles"),
    "Chicken Noodles": photo("chicken-noodles"),
    "Chicken Noodles (White)": photo("chicken-noodles"),
    "Chicken Manchurian Noodles": photo("chicken-manchurian-noodles-v2"),
    "Double Egg Chicken Noodles": photo("double-egg-chicken-noodles"),
    "Double Egg Chicken Noodles (White)": photo("double-egg-chicken-noodles"),

    "Veg Manchurian": photo("veg-manchurian"),
    "Egg Manchurian": photo("egg-manchurian"),
    "Paneer Manchurian": photo("paneer-manchurian"),
    "Paneer Majestic": photo("paneer-majestic"),
    "Kaju Paneer Manchurian": photo("kaju-paneer-manchurian"),
    "Mushroom Manchurian": photo("mushroom-manchurian"),
    "Kaju Mushroom Manchurian": photo("kaju-mushroom-manchurian"),

    "Chicken Manchurian": photo("chicken-manchurian"),
    "Chicken 65": photo("chicken-65"),
    "Chilli Chicken": photo("chilli-chicken"),
    "Chicken Majestic": photo("chicken-majestic"),
    "Kaju Chilli Chicken": photo("kaju-chilli-chicken"),
    "Chicken Lollipop": photo("chicken-lollipop"),
    "KFC Chicken Lollipop": photo("kfc-chicken-lollipop"),

    "Paneer Fried Rice": photo("paneer-fried-rice"),
    "Paneer Noodles": photo("paneer-noodles"),

    "SP Chicken Fried Rice": photo("chicken-fried-rice"),
    "SP Chicken Noodles": photo("chicken-noodles"),
    "SP Paneer Fried Rice": photo("paneer-fried-rice"),
    "SP Paneer Noodles": photo("paneer-noodles"),
    // Added 1 Oct 2026 (Openverse photos, credited on /terms).
    "Pepper Chicken": photo("pepper-chicken"),
    "Mushroom Fried Rice": photo("mushroom-fried-rice"),
    "SP Mushroom Fried Rice": photo("mushroom-fried-rice"),
    "Kaju Rice": photo("kaju-rice"),
    "Kaju Chicken Rice": photo("kaju-chicken-rice"),
    "Kaju Egg Rice": photo("kaju-veg-rice"),
    "Kaju Paneer Rice": photo("kaju-paneer-rice"),
    "Kaju Mushroom Rice": photo("kaju-mushroom-rice"),
    "Kaju Noodles": photo("kaju-noodles"),
    "Kaju Chicken Noodles": photo("kaju-noodles"),
    "Veg Schezwan Noodles": photo("schezwan-noodles"),
    "Egg Schezwan Noodles": photo("egg-schezwan-noodles"),
    "Manchurian Schezwan Noodles": photo("manchurian-schezwan-noodles"),
    "Schezwan Chicken Noodles": photo("schezwan-chicken-noodles-v2"),
    "Veg Schezwan Fried Rice": photo("schezwan-fried-rice"),
    "Egg Schezwan Fried Rice": photo("egg-schezwan-fried-rice"),
    "Manchurian Schezwan Fried Rice": photo("manchurian-schezwan-fried-rice"),
    "Schezwan Chicken Fried Rice": photo("schezwan-chicken-fried-rice"),
    // Photos from the developer (1 Oct 2026).
    "SP Mushroom Noodles": photo("sp-mushroom-noodles"),
    "Mushroom Noodles": photo("mushroom-noodles"),
  },

  "Clg Bites Biryani Nation": {
    ...sizes("Chicken Dum Biryani", "chicken-dum-biryani"),
    ...sizes("Chicken Fry Biryani", "chicken-fry-biryani"),
    ...sizes("Chicken Boneless Biryani", "boneless-biryani"),
    ...sizes("Chicken Lollipop Biryani", "chicken-lollipop-biryani"),
    ...sizes("Chicken Moghalai Biryani", "mughlai-biryani"),
    ...sizes("Chicken 65 Biryani", "chicken-65-biryani"),
    ...sizes("All Mix Chicken Biryani", "mixed-chicken-biryani"),
    ...sizes("Egg Biryani", "egg-biryani"),
    ...sizes("Veg Dum Biryani", "veg-biryani"),
    ...sizes("Paneer Biryani", "paneer-biryani"),
    ...sizes("Cashew Biryani", "kaju-biryani"),
    ...sizes("Cashew Paneer Mixed Biryani", "kaju-paneer-biryani"),
    // Starters and Chinese (added 1 Oct 2026).
    "Chicken 65": photo("chicken-65"),
    "Chilli Chicken": photo("chilli-chicken"),
    "Chicken Manchurian": photo("chicken-manchurian"),
    "Chicken Lollipop": photo("chicken-lollipop"),
    "Veg Manchurian": photo("veg-manchurian"),
    "Veg Fried Rice": photo("veg-fried-rice"),
    "Egg Fried Rice": photo("egg-fried-rice"),
    "Chicken Fried Rice": photo("chicken-fried-rice"),
    "Noodles": photo("veg-noodles"),
    // Added 1 Oct 2026 (Openverse photos, credited on /terms).
    "Gobi Manchurian": photo("gobi-manchurian"),
    "Crispy Chicken": photo("crispy-chicken"),
    "Chicken Fry": photo("chicken-fry"),
    "Dragon Chicken": photo("dragon-chicken"),
  },
};

/** Cover photo for a restaurant's hero banner, or undefined for the placeholder. */
export function getRestaurantCoverPhoto(restaurantName: string): string | undefined {
  return RESTAURANT_COVER_PHOTOS[restaurantName];
}

/** Thumbnail photo for a dish, or undefined for the placeholder. */
export function getDishPhoto(restaurantName: string, dishName: string): string | undefined {
  return DISH_PHOTOS[restaurantName]?.[dishName];
}

/**
 * Tie-breakers for each restaurant's photo slideshow on Home's cards:
 * after order counts, these come first (e.g. before anyone has ordered
 * much). Hand-picked to say what the kitchen is about; every name must
 * exist in DISH_PHOTOS above.
 */
const SIGNATURE_DISHES: Record<string, string[]> = {
  "Triangle Food Court": ["Chicken Noodles", "Chilli Chicken", "Chicken 65"],
  "Local Home Kitchen": ["Chicken Lollipop", "Chicken Dum Biryani", "Paneer Majestic"],
  "Clg Bites Biryani Nation": ["Chicken Dum Biryani (Single)", "All Mix Chicken Biryani (Single)"],
};

/** A restaurant's signature dishes, best first — Home's "Campus favourites" row
 *  falls back to these while there's no trending data yet. */
export function getSignatureDishes(restaurantName: string): string[] {
  return SIGNATURE_DISHES[restaurantName] ?? [];
}

/** Most dish slides per card — each is another photo download on Home. */
const MAX_DISH_SLIDES = 5;

export type CardSlide = { src: string; dish?: { id: string; name: string; price: number; isVeg: boolean } };

/**
 * The photos Home's restaurant card slides through: the cover first
 * (no caption), then up to MAX_DISH_SLIDES available dishes with their
 * own distinct photo — most ordered first (`orderCounts`, dishId →
 * count), ties broken by SIGNATURE_DISHES, then menu order. A dish
 * without a photo is skipped however popular it is. A restaurant with no
 * cover just starts on its first dish.
 */
export function getRestaurantCardSlides(
  restaurantName: string,
  dishes: { id: string; name: string; price: number; isVeg: boolean; isAvailable: boolean }[],
  orderCounts: Record<string, number> = {},
): CardSlide[] {
  const photos = DISH_PHOTOS[restaurantName] ?? {};
  const signature = SIGNATURE_DISHES[restaurantName] ?? [];
  const rank = (name: string) => {
    const i = signature.indexOf(name);
    return i === -1 ? signature.length : i;
  };

  const cover = getRestaurantCoverPhoto(restaurantName);
  const seen = new Set<string>(cover ? [cover] : []);
  const dishSlides: CardSlide[] = [];
  const count = (id: string) => orderCounts[id] ?? 0;
  // Stable sort keeps menu order among the rest.
  const ordered = dishes
    .filter((d) => d.isAvailable)
    .sort((a, b) => count(b.id) - count(a.id) || rank(a.name) - rank(b.name));
  for (const d of ordered) {
    const src = photos[d.name];
    if (!src || seen.has(src)) continue;
    seen.add(src);
    dishSlides.push({ src, dish: { id: d.id, name: d.name, price: d.price, isVeg: d.isVeg } });
    if (dishSlides.length === MAX_DISH_SLIDES) break;
  }
  return cover ? [{ src: cover }, ...dishSlides] : dishSlides;
}
