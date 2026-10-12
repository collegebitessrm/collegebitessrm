import Link from "next/link";
import { BlurImage } from "@/components/blur-image";
import { Heart } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import type { LikedDish } from "@/lib/data/favorites";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Profile's "Liked dishes": every dish the student hearted on a menu,
 * newest first, as a snap-scrolling row of photo cards that open the menu
 * at that dish (?dish=). Sold-out ones stay, greyed. Empty → a one-line
 * hint pointing at the heart.
 */
export function LikedDishes({ dishes }: { dishes: LikedDish[] }) {
 return (
 <section aria-labelledby="liked-heading" className="mt-8">
 <div className="flex items-end justify-between gap-3">
 <h2 id="liked-heading" className="flex items-center gap-2 font-heading text-title font-bold">
 <Heart weight="fill" className="size-5 text-primary" />
 Liked dishes
 </h2>
 {dishes.length > 0 && <p className="pb-0.5 text-sm text-muted-foreground">{dishes.length}</p>}
 </div>

 {dishes.length === 0 ? (
 <p className="mt-3 rounded-[1.5rem] border bg-card px-5 py-4 text-muted-foreground shadow-card">
 Tap the heart on any dish in a menu to keep it here.
 </p>
 ) : (
 <ul className="-mx-6 mt-3 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
 {dishes.map((d) => {
 const photo = getDishPhoto(d.restaurantName, d.name);
 return (
 <li key={d.id} className="w-32 shrink-0 snap-start">
 <Link
 href={`/restaurants/${d.restaurantId}?dish=${d.id}`}
 transitionTypes={["nav-forward"]}
 className="pressable group block rounded-[1.25rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
 >
 <div className="relative aspect-square overflow-hidden rounded-[1.25rem] bg-secondary shadow-card">
 {photo ? (
 <BlurImage
 src={photo}
 alt=""
 sizes="128px"
 className={cn("object-cover", !d.isAvailable && "opacity-60 grayscale")}
 />
 ) : (
 <span
 aria-hidden="true"
 className="flex size-full items-center justify-center font-heading text-4xl font-bold text-foreground/60"
 >
 {d.name.trim().charAt(0)}
 </span>
 )}
 <span className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-lg bg-card/90 backdrop-blur-sm">
 <VegMark isVeg={d.isVeg} className="size-3.5 [&>span]:size-1.5" />
 </span>
 {!d.isAvailable && (
 <span className="absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full bg-card/90 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
 Sold out
 </span>
 )}
 </div>
 <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold">{d.name}</p>
 <p className="truncate text-xs text-muted-foreground">{d.restaurantName}</p>
 <p className="mt-0.5 font-heading font-bold text-primary">{formatRupees(d.price)}</p>
 </Link>
 </li>
 );
 })}
 </ul>
 )}
 </section>
 );
}
