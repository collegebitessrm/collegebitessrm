import { BlurImage } from "@/components/blur-image";
import type { FoodType } from "@/lib/home-filters";
import { cn } from "@/lib/utils";

/**
 * "What's on your mind?" — Zomato-style round food images with labels below.
 * Each chip is a circular photo on top and the category name underneath.
 */
export function FoodTypeRail({
	types,
	selected,
	onSelect,
}: {
	/** Only the types that have something to order right now. */
	types: FoodType[];
	selected: string | null;
	onSelect: (key: string | null) => void;
}) {
	if (types.length === 0) return null;

	return (
		<section aria-labelledby="food-types-heading" className="mt-8">
			<h2 id="food-types-heading" className="font-heading text-title font-bold text-foreground">
				What&apos;s on your mind?
			</h2>
			<ul className="-mx-1 mt-4 flex snap-x scroll-px-1 gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				{types.map((type) => {
					const isSelected = type.key === selected;
					return (
						<li key={type.key} className="shrink-0 snap-start">
							<button
								type="button"
								aria-pressed={isSelected}
								onClick={() => onSelect(isSelected ? null : type.key)}
								className="group flex flex-col items-center gap-2 outline-none"
							>
								<span
									className={cn(
										"relative block size-16 overflow-hidden rounded-full transition-all",
										isSelected
											? "ring-3 ring-primary shadow-lg shadow-primary/20"
											: "ring-2 ring-border group-hover:ring-primary/40 group-hover:shadow-md",
									)}
								>
									<BlurImage
										src={type.photo}
										alt=""
										sizes="64px"
										className="size-full object-cover"
									/>
								</span>
								<span
									className={cn(
										"text-xs font-semibold transition-colors",
										isSelected ? "text-primary" : "text-foreground group-hover:text-primary",
									)}
								>
									{type.label}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
