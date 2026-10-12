import type { ReactNode } from "react";
import { ArrowsDownUp, ChevronDown, Flame, SlidersHorizontal, Star, Timer } from "@/components/icons";
import { VegMark } from "@/components/veg-mark";
import { activeCount, FAST_MINUTES, SORTS, type HomeFilters } from "@/lib/home-filters";
import { cn } from "@/lib/utils";

/**
 * Home's quick-filter chips: Filters, Sort, Veg, Non-veg, Rating.
 * Clean bordered pill style matching the screenshot.
 */
export function FilterBar({
	filters,
	onChange,
	onOpenSheet,
	showPopular,
}: {
	filters: HomeFilters;
	onChange: (next: HomeFilters) => void;
	onOpenSheet: () => void;
	showPopular: boolean;
}) {
	const count = activeCount(filters);
	const sortLabel = filters.sort === "recommended" ? "Sort" : SORTS.find((s) => s.key === filters.sort)?.label;
	const set = (patch: Partial<HomeFilters>) => onChange({ ...filters, ...patch });

	return (
		<div className="mt-4 -mx-6 px-6">
			<ul
				aria-label="Quick filters"
				className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				<li className="shrink-0">
					<Chip on={count > 0} onClick={onOpenSheet} label={count ? `Filters, ${count} on` : "Filters"} haspopup>
						<SlidersHorizontal className="size-4" />
						Filters
						{count > 0 && (
							<span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-white tabular-nums">
								{count}
							</span>
						)}
					</Chip>
				</li>
				<li className="shrink-0">
					<Chip on={filters.sort !== "recommended"} onClick={onOpenSheet} haspopup>
						<ArrowsDownUp className="size-4" />
						{sortLabel}
						<ChevronDown className="size-3.5" />
					</Chip>
				</li>
				<li className="shrink-0">
					<Chip on={filters.diet === "veg"} onClick={() => set({ diet: filters.diet === "veg" ? null : "veg" })} toggle>
						<VegMark isVeg className="size-3.5 [&>span]:size-1" />
						Veg
					</Chip>
				</li>
				<li className="shrink-0">
					<Chip
						on={filters.diet === "nonveg"}
						danger
						onClick={() => set({ diet: filters.diet === "nonveg" ? null : "nonveg" })}
						toggle
					>
						<VegMark isVeg={false} className="size-3.5 [&>span]:size-1" />
						Non-veg
					</Chip>
				</li>
				<li className="shrink-0">
					<Chip on={filters.popular} onClick={() => set({ popular: !filters.popular })} toggle>
						<Star className="size-3.5 text-amber-500" />
						Rating
						<ChevronDown className="size-3.5" />
					</Chip>
				</li>
			</ul>
		</div>
	);
}

function Chip({
	on,
	onClick,
	children,
	toggle = false,
	danger = false,
	haspopup = false,
	label,
}: {
	on: boolean;
	onClick: () => void;
	children: ReactNode;
	toggle?: boolean;
	danger?: boolean;
	haspopup?: boolean;
	label?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={toggle ? on : undefined}
			aria-haspopup={haspopup ? "dialog" : undefined}
			aria-label={label}
			className={cn(
				"flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap outline-none transition-all focus-visible:ring-3 focus-visible:ring-ring/80",
				!on && "border-border bg-card text-foreground hover:border-primary/30",
				on && !danger && "border-primary bg-primary/5 text-primary",
				on && danger && "border-destructive/40 bg-destructive/10 text-destructive",
			)}
		>
			{children}
		</button>
	);
}
