import Link from "next/link";
import { ArrowRight, MapPin, Star, Timer } from "@/components/icons";
import type { CardSlide } from "@/lib/data/dish-photos";
import { getFallbackRestaurantRating, type RestaurantRating } from "@/lib/data/restaurant-ratings";
import type { RestaurantMenuStats } from "@/lib/data/restaurants";
import type { Restaurant } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RestaurantPhotoSlides } from "./restaurant-photo-slides";

/*
 * Restaurant card: photo on top with status chip, name + details below.
 * Full-width card with shadow, bold prices, and customer rating.
 */
export function RestaurantCard({
	restaurant,
	orderingEnabled,
	closedChip = "Paused",
	closedLine = "Ordering paused",
	stats,
	slides,
	slideDelay,
	eager = false,
	rating,
}: {
	restaurant: Restaurant;
	orderingEnabled: boolean;
	closedChip?: string;
	closedLine?: string;
	stats?: RestaurantMenuStats;
	slides: CardSlide[];
	slideDelay?: number;
	eager?: boolean;
	rating?: RestaurantRating;
}) {
	const active = restaurant.is_active;
	const open = active && orderingEnabled;
	const paused = active && !orderingEnabled;
	const displayRating = rating ?? getFallbackRestaurantRating(restaurant.name);

	return (
		<Link
			href={`/restaurants/${restaurant.id}`}
			transitionTypes={["nav-forward"]}
			className="pressable group block overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-card outline-none transition-shadow hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80"
		>
			<div className={cn("relative h-44 overflow-hidden", !active && "opacity-60 grayscale")}>
				<RestaurantPhotoSlides
					slides={slides}
					restaurantHref={`/restaurants/${restaurant.id}`}
					autoplay={active}
					startDelay={slideDelay}
					eager={eager}
				>
					<span
						className={cn(
							"pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
							open ? "text-success" : "text-muted-foreground",
						)}
					>
						<span className="relative flex size-1.5" aria-hidden="true">
							{open && <span className="animate-ping-slow absolute inset-0 rounded-full bg-success" />}
							<span className={cn("relative size-1.5 rounded-full", open ? "bg-success" : "bg-muted-foreground")} />
						</span>
						{!active ? "Closed" : paused ? closedChip : "Open"}
					</span>

					{/* Top-right floating rating chip */}
					<span
						className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-xs ring-1 ring-white/10"
						aria-label={`${displayRating.rating} star rating`}
					>
						<Star className="size-3 text-amber-400 icon-solid" />
						<span>{displayRating.rating.toFixed(1)}</span>
						{displayRating.count > 0 && (
							<span className="text-[10px] text-white/70 font-normal">({displayRating.count})</span>
						)}
					</span>
				</RestaurantPhotoSlides>
			</div>

			<div className="p-4">
				<div className="flex items-start justify-between gap-2">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<h3 className="truncate font-heading text-lg font-bold text-foreground">{restaurant.name}</h3>
							<span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[11px] font-extrabold text-white shadow-2xs">
								<span>{displayRating.rating.toFixed(1)}</span>
								<Star className="size-2.5 text-white icon-solid" />
							</span>
						</div>
						{restaurant.description && (
							<p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
								<MapPin className="size-3.5 shrink-0" />
								{restaurant.description}
							</p>
						)}
					</div>
					<span
						className={cn(
							"mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full transition-all group-hover:translate-x-1",
							open ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-secondary text-muted-foreground",
						)}
						aria-hidden="true"
					>
						<ArrowRight className="size-4" />
					</span>
				</div>

				<ul className="mt-3 flex flex-wrap items-center gap-1.5">
					<li className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
						<Star className="size-3 text-amber-500 icon-solid" />
						<span>{displayRating.rating.toFixed(1)}</span>
						{displayRating.count > 0 && (
							<span className="text-[10px] font-medium opacity-75">({displayRating.count}+)</span>
						)}
					</li>
					{restaurant.cuisine_tags.slice(0, 3).map((tag) => (
						<li key={tag} className="rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">
							{tag}
						</li>
					))}
					<li className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
						<Timer className="size-3.5 shrink-0" />
						{restaurant.delivery_minutes} min
					</li>
				</ul>

				{open && stats && (
					<div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
						<span className="text-sm text-muted-foreground">{stats.dishCount} dishes</span>
						<span className="font-heading text-base font-extrabold text-primary">from {formatRupees(stats.minPrice)}</span>
					</div>
				)}
				{!open && (
					<p className="mt-3 border-t border-border/50 pt-3 text-sm font-semibold text-muted-foreground">
						{!active ? "Closed right now" : `${closedLine}`}
					</p>
				)}
			</div>
		</Link>
	);
}
