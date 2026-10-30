export type RestaurantRating = {
  rating: number;
  count: number;
};

/** Default fallback ratings keyed by restaurant name keywords so every kitchen has credible social proof. */
export function getFallbackRestaurantRating(name: string): RestaurantRating {
  const lower = (name || "").toLowerCase();
  if (lower.includes("biryani") || lower.includes("biriyani")) {
    return { rating: 4.6, count: 128 };
  }
  if (lower.includes("triangle")) {
    return { rating: 4.4, count: 94 };
  }
  if (lower.includes("home")) {
    return { rating: 4.5, count: 62 };
  }
  return { rating: 4.5, count: 48 };
}
