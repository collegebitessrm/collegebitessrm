// Static photo lookup for restaurant covers and dish thumbnails. Deliberately
// NOT a database column — these are just files under public/MuteBites/, and
// matching them by (restaurant name, dish name) needs no schema change. Only
// dishes with an unambiguous, correctly-matched photo are listed here — a
// dish missing from a restaurant's map falls back to the plain placeholder
// rather than showing a mismatched photo. A few "Single X Biryani" /
// glass-vs-bottle entries intentionally reuse the same file as their
// full-size counterpart: same dish, different serving size.

const BASE = "/MuteBites";

/**
 * Restaurant name -> cover photo shown on the hero banner. The "-v2"
 * filenames (vs. their original bare names still sitting in
 * public/MuteBites/covers/) are deliberate: an intermediate cache
 * somewhere between this server and at least one browser kept re-serving
 * the original files by URL even after direct, verified-fresh server
 * responses and full dev-server restarts — renaming forces a URL neither
 * that cache nor any other has ever seen.
 */
export const RESTAURANT_COVER_PHOTOS: Record<string, string> = {
  "Bheemasena Restaurant": `${BASE}/covers/bheemasena-v2.jpg`,
  "A1 Biryani Point": `${BASE}/covers/a1-biryani-v2.jpg`,
  "Bismillah Fruit Juice": `${BASE}/covers/bismillah-juice.jpg`,
  "Food Corner": `${BASE}/covers/mutebites-chinese-v2.jpg`,
  "MuteBites Fresh Fruits": `${BASE}/covers/mutebites-fresh-fruits.jpg`,
  "MuteBites Sugarcane Juice": `${BASE}/covers/mutebites-sugarcane-juice.jpg`,
};

const BHEEMASENA = `${BASE}/Bheemasena`;
const A1 = `${BASE}/A1 biryani`;
const BISMILLAH = `${BASE}/Bismillah fruit juice`;
// Folder keeps the restaurant's old name (now "Food Corner") — paths are cached URLs.
const CHINESE = `${BASE}/MuteBites Chinese`;
const FRUITS = `${BASE}/Mutebites fresh fruits`;
const SUGARCANE = `${BASE}/MuteBites Sugarcane Juice`;

/** Restaurant name -> { dish name -> thumbnail photo }. */
export const DISH_PHOTOS: Record<string, Record<string, string>> = {
  "Bheemasena Restaurant": {
    "Veg Manchuria": `${BHEEMASENA}/Veg manchurian.jpg`,
    "Chilli Mushroom": `${BHEEMASENA}/Chilli mushroom.jpg`,
    "Crispy Baby Corn": `${BHEEMASENA}/Crispy babycorn.jpg`,
    "Paneer 65": `${BHEEMASENA}/Paneer 65.jpg`,
    "Paneer Majestic": `${BHEEMASENA}/Paneer majestic.jpg`,
    "Chilli Chicken": `${BHEEMASENA}/Chilli chicken.jpg`,
    "Chicken Manchuria": `${BHEEMASENA}/Chicken manchurian.jpg`,
    "Chicken 65": `${BHEEMASENA}/Chicken 65.jpg`,
    "Chicken Majestic": `${BHEEMASENA}/Chicken majestic.jpg`,
    "Special Paneer Biryani": `${BHEEMASENA}/Special paneer biryani.jpg`,
    "Special Mushroom Biryani": `${BHEEMASENA}/Special mushroom biryani.jpg`,
    "Special Veg Biryani": `${BHEEMASENA}/Special veg biryani.jpg`,
    "Ulavacharu Biryani": `${BHEEMASENA}/UlavaCharu Veg Biryani.jpg`,
    "Kaju Biryani": `${BHEEMASENA}/Kaju biryani.jpg`,
    "Special Kaju Biryani": `${BHEEMASENA}/Special kaju biryani.jpg`,
    "Special Egg Biryani": `${BHEEMASENA}/Special egg biryani.jpg`,
    "Chicken Dum Biryani": `${BHEEMASENA}/Chicken dum biryani.jpg`,
    "Kundan Biryani": `${BHEEMASENA}/Kunda biryani.jpg`,
    "Chicken Fry Biryani": `${BHEEMASENA}/Chicken fry biryani.jpg`,
    "Special Chicken Biryani": `${BHEEMASENA}/Special chicken biryani .jpg`,
    "Joint Biryani": `${BHEEMASENA}/Joint biryani.jpg`,
    "Chicken Mughlai Biryani": `${BHEEMASENA}/Mughlai biryani.jpg`,
    "Chicken Lollipop Biryani": `${BHEEMASENA}/Chicken lollipop biryani.jpg`,
    "Gongura Chicken Fry Biryani": `${BHEEMASENA}/Gongura chicken fry biryani.jpg`,
    // Single Biryani — same dish as its full-size counterpart above, smaller portion.
    "Single Dum Biryani": `${BHEEMASENA}/Chicken dum biryani.jpg`,
    "Single Fry Biryani": `${BHEEMASENA}/Chicken fry biryani.jpg`,
    "Single Special Chicken Biryani": `${BHEEMASENA}/Special chicken biryani .jpg`,
    "Single Paneer Biryani": `${BHEEMASENA}/Special paneer biryani.jpg`,
    "Single Mushroom Biryani": `${BHEEMASENA}/Special mushroom biryani.jpg`,
    "Single Mughlai Biryani": `${BHEEMASENA}/Mughlai biryani.jpg`,
    "Single Gongura Biryani": `${BHEEMASENA}/Gongura chicken fry biryani.jpg`,
    "Mixed Biryani": `${BHEEMASENA}/Mixed Biryani-v2.jpg`, // new photo, new name — see CLAUDE.md on caches
    "Butter Naan": `${BHEEMASENA}/Butter naan.jpg`,
    Roti: `${BHEEMASENA}/Roti.jpg`,
    "Paneer Butter Masala": `${BHEEMASENA}/Paneer butter masala .jpg`,
    "Egg Burji": `${BHEEMASENA}/Egg bhurji.jpg`,
    "Butter Chicken": `${BHEEMASENA}/Butter chicken.jpg`,
    "Chicken Curry": `${BHEEMASENA}/Chicken Curry.jpg`,
    "Mutton Afghani Biryani": `${BHEEMASENA}/Mutton Afghani biryani.jpg`,
    "Mutton Keema Biryani": `${BHEEMASENA}/Mutton keema biryani.jpg`,
    // -v2: the first upload had a watermark, replaced after it was already published.
    "Mutton Mughlai Biryani": `${BHEEMASENA}/Mutton Mughlai biryani-v2.jpg`,
    "Mutton Fry Biryani": `${BHEEMASENA}/Mutton fry biryani.jpg`,
    "Chicken Wings Biryani": `${BHEEMASENA}/Chicken Wings biryani.jpg`,
    "Chicken Tandoori Biryani": `${BHEEMASENA}/Chicken tandoori biryani.jpg`,
    "Nawab Biryani": `${BHEEMASENA}/Nawab biryani.jpg`,
    "Bheemasena Special Biryani": `${BHEEMASENA}/Bheemasena special biryani.jpg`,
    "Loose Prawns": `${BHEEMASENA}/Loose prawns.jpg`,
    "Chilli Prawns": `${BHEEMASENA}/Chilli prawns.jpg`,
    "Methi Chaman": `${BHEEMASENA}/Methi chaman.jpg`,
    // Filename keeps the supplied spelling ("panner"); the dish is Kaju Paneer Curry.
    "Kaju Paneer Curry": `${BHEEMASENA}/Kaju panner curry.jpg`,
    "Punjabi Chicken": `${BHEEMASENA}/Punjabi chicken.jpg`,
    "Hyderabadi Chicken": `${BHEEMASENA}/Hyderabadi chicken.jpg`,
    "Kadai Chicken": `${BHEEMASENA}/Kadai chicken.jpg`,
    "Chicken Tikka Masala": `${BHEEMASENA}/Chicken tikka masala.jpg`,
    "Mughlai Chicken Curry": `${BHEEMASENA}/Mughlai Chicken curry.jpg`,
    "Prawn Biryani": `${BHEEMASENA}/Prawn biryani.jpg`,
    "Chicken Tandoori Half": `${BHEEMASENA}/Chicken tandoori.jpeg`,
    "Chicken Tandoori Full": `${BHEEMASENA}/Chicken tandoori.jpeg`,
    "Kaju Paneer Butter Masala": `${BHEEMASENA}/Kaju Paneer Butter Masala.jpg`,
  },

  "A1 Biryani Point": {
    "A1 Biryani Dum Biryani": `${A1}/A1 Dum Biryani.jpg`,
    "A1 Biryani Fry Pieces Biryani": `${A1}/A1 Fry Piece Biryani.jpg`,
    "A1 Biryani Mixed Biryani": `${A1}/A1 Mixed Biryani-v2.jpg`,
  },

  "Bismillah Fruit Juice": {
    "Carrot Juice": `${BISMILLAH}/Carrot juice.jpg`,
    "Beetroot Juice": `${BISMILLAH}/Beetroot juice.jpg`,
    "Pineapple Juice": `${BISMILLAH}/Pineapple juice.jpg`,
    "Grape Juice": `${BISMILLAH}/Grape juice.jpg`,
    "Pomegranate Juice": `${BISMILLAH}/Pomegranate juice.jpg`,
    "Apple Juice": `${BISMILLAH}/Apple juice.jpg`,
    "Muskmelon Juice": `${BISMILLAH}/Muskmelon-Juice.jpg`,
    "Watermelon Juice": `${BISMILLAH}/Watermelon juice.jpg`,
    "Banana Juice": `${BISMILLAH}/Banana juice.jpg`,
    "Sweet Lemon Juice (Mosambi)": `${BISMILLAH}/Sweet lemon mosambi juice.jpg`,
    "Sugarcane Juice (Glass)": `${BISMILLAH}/Sugarcane juice.jpg`,
    "Sugarcane Juice (1 Bottle)": `${BISMILLAH}/Sugarcane juice.jpg`,
  },

  "Food Corner": {
    "Veg Noodles": `${CHINESE}/Veg noodles.jpg`,
    "Veg Manchurian Noodles": `${CHINESE}/Veg Manchurian Noodles.jpg`,
    "Veg Paneer Noodles": `${CHINESE}/Veg paneer noodles.jpg`,
    "Egg Noodles": `${CHINESE}/Egg Noodles.jpg`,
    "Double Egg Noodles": `${CHINESE}/Double egg noodles.jpg`,
    "Egg Manchurian Noodles": `${CHINESE}/Egg manchurian noodles.jpg`,
    "Egg Paneer Noodles": `${CHINESE}/Egg paneer noodles.jpg`,
    "Chicken Noodles": `${CHINESE}/Chicken noodles.jpg`,
    "Veg Fried Rice": `${CHINESE}/Veg friedrice.jpg`,
    "Veg Manchurian Fried Rice": `${CHINESE}/Veg manchurian friedrice.jpg`,
    "Veg Paneer Fried Rice": `${CHINESE}/Veg paneer friedrice.jpg`,
    "Egg Fried Rice": `${CHINESE}/Egg friedrice.jpg`,
    "Double Egg Fried Rice": `${CHINESE}/Double egg friedrice.jpg`,
    "Egg Manchurian Fried Rice": `${CHINESE}/Egg manchurian friedrice.jpg`,
    "Egg Paneer Fried Rice": `${CHINESE}/Egg paneer friedrice.jpg`,
    "Chicken Fried Rice": `${CHINESE}/Chicken friedrice.jpg`,
    "Double Egg Chicken Fried Rice": `${CHINESE}/Double egg chicken friedrice.jpg`,
    "Veg Manchurian": `${CHINESE}/Veg manchurian.jpg`,
    "Egg Manchurian": `${CHINESE}/Egg manchurian.jpg`,
    "Double Egg Manchurian": `${CHINESE}/Double egg manchurian.jpg`,
    "Chicken Manchurian": `${CHINESE}/Chicken manchurian.jpg`,
    "Chicken Chilli": `${CHINESE}/Chicken chilli.jpg`,
    "4P Chicken Lollipop": `${CHINESE}/Chicken lollipop 4P.jpg`,
    "Double Egg Chicken Noodles": `${CHINESE}/Double egg chicken noodles.jpg`,
  },

  "MuteBites Fresh Fruits": {
    "Pomegranate (500 g)": `${FRUITS}/Pomegranate 500g.jpg`,
    "Pomegranate (1 kg)": `${FRUITS}/Pomegranate 1kg.jpg`,
    "Apples (500 g)": `${FRUITS}/Apple 500g.jpg`,
    "Apples (1 kg)": `${FRUITS}/Apple 1kg.jpg`,
    "Bananas (500 g)": `${FRUITS}/Banana 30g.jpg`, // filename typo upstream (30g), same photo
    "Bananas (1 kg)": `${FRUITS}/Banana 1kg.jpg`,
    "Guava (500 g)": `${FRUITS}/Guava 30g.jpg`, // filename typo upstream (30g), same photo
    "Guava (1 kg)": `${FRUITS}/Guava 1kg.jpg`,
    "Black Grapes (500 g)": `${FRUITS}/Grapes 500g.jpg`,
    "Black Grapes (1 kg)": `${FRUITS}/Grapes 1kg.jpg`,
    "Dragon Fruit (500 g)": `${FRUITS}/Dragon fruit 500g.jpg`,
    "Dragon Fruit (1 kg)": `${FRUITS}/Dragon fruit 1kg.jpg`,
    "Papaya (1 kg)": `${FRUITS}/Papaya 1kg.jpg`,
  },

  "MuteBites Sugarcane Juice": {
    "1 Litre Sugarcane Juice Bottle": `${SUGARCANE}/1 Litre Sugarcane Juice Bottle.jpg`,
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
 * much). Hand-picked for photo quality (no watermarks, reads well small)
 * and to say what the kitchen is about; every name must exist in
 * DISH_PHOTOS above.
 */
const SIGNATURE_DISHES: Record<string, string[]> = {
  "Bheemasena Restaurant": ["Paneer 65", "Chilli Chicken"],
  "A1 Biryani Point": ["A1 Biryani Dum Biryani", "A1 Biryani Fry Pieces Biryani"],
  "Bismillah Fruit Juice": ["Pomegranate Juice", "Pineapple Juice"],
  "Food Corner": ["Chicken Noodles", "4P Chicken Lollipop"],
  "MuteBites Fresh Fruits": ["Dragon Fruit (500 g)", "Black Grapes (1 kg)"],
  "MuteBites Sugarcane Juice": ["1 Litre Sugarcane Juice Bottle"],
};

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
