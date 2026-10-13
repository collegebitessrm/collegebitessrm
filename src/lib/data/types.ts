// Row shapes mirroring supabase/migrations. Only columns the UI reads.

export type Restaurant = {
 id: string;
 name: string;
 phone: string;
 description: string | null;
 cuisine_tags: string[];
 is_active: boolean;
 /** Minutes from ordering to the promised delivery (40; Biryani Nation 60). */
 delivery_minutes: number;
 /** Admin-uploaded cover image URL (falls back to static photo if null). */
 cover_image_url: string | null;
};

export type DishCategory = {
 id: string;
 restaurant_id: string;
 name: string;
 sort_order: number;
};

export type Dish = {
 id: string;
 restaurant_id: string;
 category_id: string | null;
 name: string;
 price: number;
 is_veg: boolean;
 note: string | null;
 is_available: boolean;
 sort_order: number;
 /** Admin-uploaded dish photo URL (falls back to static photo if null). */
 image_url: string | null;
};

export type OrderStatus =
 | "pending"
 | "confirmed"
 | "preparing"
 | "out_for_delivery"
 | "at_gate"
 | "delivered"
 | "cancelled";

export type MenuSection = {
 /** null = dishes with no category, shown last as "More". */
 category: DishCategory | null;
 dishes: Dish[];
};
