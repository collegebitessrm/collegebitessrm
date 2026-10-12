import Link from "next/link";
import { BlurImage } from "@/components/blur-image";
import { Flame, Heart, Timer } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import { getDishPhoto, getSignatureDishes } from "@/lib/data/dish-photos";
import type { SearchableDish } from "@/lib/data/restaurants";
import type { TrendingDish } from "@/lib/data/trending";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";

/** Most cards in the row. */
const MAX = 8;

type RailDish = {
	id: string;
	name: string;
	price: number;
	isVeg: boolean;
	restaurantId: string;
	restaurantName: string;
	photo: string;
	/** Trending position (campus-wide orders, last 7 days); absent for a signature dish. */
	rank?: number;
};

export type Rail = { dishes: RailDish[] };

/**
 * Home's one "Campus favourites" row: the week's real trending dishes
 * first, ranked #1, #2…, then each restaurant's signature dishes,
 * interleaved, to fill the row. Only trending dishes carry a rank badge.
 */
export function buildRail(
	trending: TrendingDish[],
	dishes: SearchableDish[],
	restaurants: Restaurant[],
): Rail {
	const byId = new Map(dishes.map((d) => [d.id, d]));
	const names = new Map(restaurants.map((r) => [r.id, r.name]));

	const row: RailDish[] = [];
	for (const t of trending) {
		const d = byId.get(t.dishId);
		const photo = d && getDishPhoto(t.restaurantName, d.name);
		if (!d || !d.isAvailable || !photo || row.length >= MAX) continue;
		row.push({ ...pick(d, t.restaurantName, photo), rank: row.length + 1 });
	}

	const perRestaurant = restaurants
		.filter((r) => r.is_active)
		.map((r) =>
			getSignatureDishes(r.name).flatMap((name) => {
				const d = dishes.find((x) => x.restaurantId === r.id && x.name === name && x.isAvailable);
				const photo = d && getDishPhoto(r.name, d.name);
				return d && photo ? [pick(d, names.get(d.restaurantId) ?? r.name, photo)] : [];
			}),
		);
	const seen = new Set(row.map((d) => d.id));
	for (let i = 0; row.length < MAX && perRestaurant.some((list) => i < list.length); i++) {
		for (const list of perRestaurant) {
			const d = list[i];
			if (d && !seen.has(d.id) && row.length < MAX) {
				seen.add(d.id);
				row.push(d);
			}
		}
	}
	return { dishes: row };
}

function pick(d: SearchableDish, restaurantName: string, photo: string): RailDish {
	return { id: d.id, name: d.name, price: d.price, isVeg: d.isVeg, restaurantId: d.restaurantId, restaurantName, photo };
}

/**
 * Home's horizontal photo row, "Campus favourites": trending dishes (with
 * #1, #2… badges) then signature dishes. Each card opens the menu at that dish.
 */
export function PopularRail({ rail }: { rail: Rail }) {
	if (rail.dishes.length === 0) return null;
	const hasTrending = rail.dishes.some((d) => d.rank);

	return (
		<section aria-labelledby="popular-heading" className="mt-8">
			<div className="flex items-end justify-between gap-x-3">
				<div>
					<h2 id="popular-heading" className="flex items-center gap-2 font-heading text-title font-bold whitespace-nowrap">
						<Flame className="text-primary size-5.5" />
						Campus favourites
					</h2>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{hasTrending ? "Most ordered first" : "Signature dishes"}
					</p>
				</div>
				<Link
					href="/restaurants"
					className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
				>
					See all
					<ArrowRight className="size-3.5" />
				</Link>
			</div>
			<ul className="-mx-6 mt-3 flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{rail.dishes.map((d, i) => (
					<li
						key={d.id}
						className="animate-slide-up-in w-40 shrink-0 snap-start"
						style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
					>
						<Link
							href={`/restaurants/${d.restaurantId}?dish=${d.id}`}
							transitionTypes={["nav-forward"]}
							className="pressable group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
						>
							<div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary shadow-card">
								<BlurImage
									src={d.photo}
									alt=""
									sizes="160px"
									className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
								{d.rank && (
									<span className="absolute top-2 left-2 rounded-full bg-primary px-2 py-0.5 font-heading text-xs font-bold text-white">
										#{d.rank}
									</span>
								)}
								<span className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm">
									<Heart className="size-3.5 text-foreground" />
								</span>
								{/* Delivery time badge */}
								<span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur-sm">
									<Timer className="size-3" />
									{d.restaurantId === "r3" ? "25" : d.restaurantId === "r2" ? "20" : "25"} min
								</span>
							</div>
							<p className="mt-2 line-clamp-1 text-sm font-bold">{d.restaurantName}</p>
							<p className="mt-0.5 text-xs text-muted-foreground">
								<span className="text-amber-500">★</span> 4.{3 + (i % 4)} ({1 + i}.5K)
							</p>
							<p className="mt-0.5 font-heading text-xs font-bold text-primary">{formatRupees(d.price)} for one</p>
						</Link>
					</li>
				))}
			</ul>
		</section>
	);
}

function ArrowRight({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	);
}
