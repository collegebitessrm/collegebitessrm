import "server-only";

import { cache } from "react";
import { OFFER_KEYS, type FreeChoice, type OfferKey, type OffersState } from "@/lib/offers";
import { createClient } from "@/lib/supabase/server";

type SingleRow = {
 id: string;
 restaurant_id: string;
 name: string;
 price: number;
 is_available: boolean;
 restaurants: { name: string } | null;
};

/**
 * Which discount offers are on (app_settings, public-read) and, while the
 * biryani offer is on, the Single biryanis a student can pick for free.
 * Only drives the cart; place_order() re-checks everything.
 */
export const getOffers = cache(async (): Promise<OffersState> => {
 const supabase = await createClient();
 const { data, error } = await supabase
 .from("app_settings")
 .select("offer_pct10, offer_pct20, offer_biryani")
 .eq("id", true)
 .single();
 if (error) throw error;

 const flags: Record<OfferKey, boolean> = {
 pct10: data.offer_pct10,
 pct20: data.offer_pct20,
 biryani: data.offer_biryani,
 };
 const active = OFFER_KEYS.filter((k) => flags[k]);

 let freeChoices: FreeChoice[] = [];
 if (flags.biryani) {
 const { data: dishes, error: dishesError } = await supabase
 .from("dishes")
 .select("id, restaurant_id, name, price, is_available, restaurants(name)")
 .like("name", "% Biryani (Single)")
 .order("price")
 .order("name")
 .returns<SingleRow[]>();
 if (dishesError) throw dishesError;
 freeChoices = (dishes ?? []).map((d) => ({
 id: d.id,
 restaurantId: d.restaurant_id,
 restaurantName: d.restaurants?.name ?? "",
 name: d.name,
 price: Number(d.price),
 isAvailable: d.is_available,
 }));
 }

 return { active, freeChoices };
});
