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
    "Paneer Manchurian": photo("paneer-65"),
    "Mushroom Manchurian": photo("chilli-mushroom"),
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
    "Chicken Manchurian Fried Rice": photo("chicken-manchurian"),
    "Egg Fried Rice (Double Egg)": photo("double-egg-fried-rice"),
    "Egg Manchurian Fried Rice": photo("egg-manchurian-fried-rice"),
    "Chicken Noodles": photo("chicken-noodles"),
    "Chicken Manchurian Noodles": photo("chicken-manchurian"),
    "Egg Noodles": photo("egg-noodles"),
    "Egg Manchurian Noodles": photo("egg-manchurian-noodles"),
    "Chicken Dum Biryani": photo("chicken-dum-biryani"),
    "Chicken Fry Biryani": photo("chicken-fry-biryani"),
    "Chicken Curry Biryani": photo("chicken-biryani"),
    "Egg Biryani": photo("egg-biryani"),
    "Gongura Chicken Biryani": photo("gongura-chicken-biryani"),
    "Boneless Biryani": photo("chicken-biryani"),
  },

  "Local Home Kitchen": {
    "Chicken Dum Biryani": photo("chicken-dum-biryani"),
    "Chicken Fry Biryani": photo("chicken-fry-biryani"),
    "Chicken Boneless Biryani": photo("chicken-biryani"),
    "Chicken 65 Biryani": photo("chicken-biryani"),
    "Chicken Lollipop Biryani": photo("chicken-lollipop-biryani"),
    "Mughlai Biryani": photo("mughlai-biryani"),
    "Mushroom Biryani": photo("mushroom-biryani"),
    "Kaju Mushroom Biryani": photo("kaju-biryani"),
    "Paneer Biryani": photo("paneer-biryani"),
    "Kaju Paneer Biryani": photo("kaju-biryani"),

    "Veg Fried Rice": photo("veg-fried-rice"),
    "Veg Fried Rice (White)": photo("veg-fried-rice"),
    "Veg Manchurian Rice": photo("veg-manchurian-fried-rice"),
    "Egg Fried Rice": photo("egg-fried-rice"),
    "Egg Fried Rice (White)": photo("egg-fried-rice"),
    "Egg Manchurian Rice": photo("egg-manchurian-fried-rice"),
    "Chicken Fried Rice": photo("chicken-fried-rice"),
    "Chicken Fried Rice (White)": photo("chicken-fried-rice"),
    "Chicken Manchurian Rice": photo("chicken-manchurian"),
    "Double Egg Chicken Fried Rice": photo("double-egg-chicken-fried-rice"),
    "Double Egg Chicken Fried Rice (White)": photo("double-egg-chicken-fried-rice"),

    "Veg Noodles": photo("veg-noodles"),
    "Veg Noodles (White)": photo("veg-noodles"),
    "Veg Manchurian Noodles": photo("veg-manchurian-noodles"),
    "Egg Noodles": photo("egg-noodles"),
    "Egg Noodles (White)": photo("egg-noodles"),
    "Egg Manchurian Noodles": photo("egg-manchurian-noodles"),
    "Chicken Noodles": photo("chicken-noodles"),
    "Chicken Noodles (White)": photo("chicken-noodles"),
    "Chicken Manchurian Noodles": photo("chicken-manchurian"),
    "Double Egg Chicken Noodles": photo("double-egg-chicken-noodles"),
    "Double Egg Chicken Noodles (White)": photo("double-egg-chicken-noodles"),

    "Veg Manchurian": photo("veg-manchurian"),
    "Egg Manchurian": photo("egg-manchurian"),
    "Paneer Manchurian": photo("paneer-65"),
    "Paneer Majestic": photo("paneer-majestic"),
    "Kaju Paneer Manchurian": photo("paneer-65"),
    "Mushroom Manchurian": photo("chilli-mushroom"),
    "Kaju Mushroom Manchurian": photo("chilli-mushroom"),

    "Chicken Manchurian": photo("chicken-manchurian"),
    "Chicken 65": photo("chicken-65"),
    "Chilli Chicken": photo("chilli-chicken"),
    "Chicken Majestic": photo("chicken-majestic"),
    "Kaju Chilli Chicken": photo("chilli-chicken"),
    "Chicken Lollipop": photo("chicken-lollipop"),
    "KFC Chicken Lollipop": photo("chicken-lollipop"),

    "Paneer Fried Rice": photo("paneer-fried-rice"),
    "Paneer Noodles": photo("paneer-noodles"),

    "SP Chicken Fried Rice": photo("chicken-fried-rice"),
    "SP Chicken Noodles": photo("chicken-noodles"),
    "SP Paneer Fried Rice": photo("paneer-fried-rice"),
    "SP Paneer Noodles": photo("paneer-noodles"),
  },

  "Clg Bites Biryani Nation": {
    ...sizes("Chicken Dum Biryani", "chicken-dum-biryani"),
    ...sizes("Chicken Fry Biryani", "chicken-fry-biryani"),
    ...sizes("Chicken Boneless Biryani", "chicken-biryani"),
    ...sizes("Chicken Lollipop Biryani", "chicken-lollipop-biryani"),
    ...sizes("Chicken Moghalai Biryani", "mughlai-biryani"),
    ...sizes("Chicken 65 Biryani", "chicken-biryani"),
    ...sizes("All Mix Chicken Biryani", "mixed-chicken-biryani"),
    ...sizes("Egg Biryani", "egg-biryani"),
    ...sizes("Veg Dum Biryani", "veg-biryani"),
    ...sizes("Paneer Biryani", "paneer-biryani"),
    ...sizes("Cashew Biryani", "kaju-biryani"),
    ...sizes("Cashew Paneer Mixed Biryani", "kaju-biryani"),
    // Starters and Chinese (added 1 Oct 2026). Dragon Chicken, Chicken Fry,
    // Crispy Chicken and Gobi Manchurian have no matching photo yet.
    "Chicken 65": photo("chicken-65"),
    "Chilli Chicken": photo("chilli-chicken"),
    "Chicken Manchurian": photo("chicken-manchurian"),
    "Chicken Lollipop": photo("chicken-lollipop"),
    "Veg Manchurian": photo("veg-manchurian"),
    "Veg Fried Rice": photo("veg-fried-rice"),
    "Egg Fried Rice": photo("egg-fried-rice"),
    "Chicken Fried Rice": photo("chicken-fried-rice"),
    "Noodles": photo("veg-noodles"),
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
