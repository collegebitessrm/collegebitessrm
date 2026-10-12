"use client";

import { useEffect, useRef } from "react";
import { Minus, Plus, Repeat, Star } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { VegMark } from "@/components/veg-mark";
import { MAX_QUANTITY } from "@/lib/cart/store";
import { getDishPhoto } from "@/lib/data/dish-photos";
import type { Dish } from "@/lib/data/types";
import { formatRupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { splitPortion } from "@/lib/menu/portions";
import { HeartButton } from "./heart-button";

/*
 * Grid-style dish card: large photo on top with heart (+) overlay,
 * dish name + veg mark below, and portion prices in a row.
 * Bold orange plus button, bold prices.
 */
export function DishCard({
	dish,
	restaurantName,
	quantity,
	orderable,
	pausedOnly = false,
	pausedLabel = "Paused",
	isUsual = false,
	isHighlyReordered = false,
	liked = false,
	highlighted = false,
	portions,
	onChoosePortion,
	onAdd,
	onChangeQuantity,
}: {
	dish: Dish;
	restaurantName: string;
	quantity: number;
	orderable: boolean;
	pausedOnly?: boolean;
	pausedLabel?: string;
	isUsual?: boolean;
	isHighlyReordered?: boolean;
	liked?: boolean;
	highlighted?: boolean;
	portions?: { label: string; dish: Dish; quantity: number }[];
	onChoosePortion?: () => void;
	onAdd: () => void;
	onChangeQuantity: (quantity: number) => void;
}) {
	const portioned = (portions?.length ?? 0) > 1;
	const soldOut = portioned ? portions!.every((p) => !p.dish.is_available) : !dish.is_available;
	const photo = getDishPhoto(restaurantName, dish.name);
	const displayName = portioned ? splitPortion(dish.name).base : dish.name;
	const inCart = quantity > 0;

	const addRef = useRef<HTMLButtonElement>(null);
	const moreRef = useRef<HTMLButtonElement>(null);
	const moveFocus = useRef(false);
	useEffect(() => {
		if (!moveFocus.current) return;
		moveFocus.current = false;
		(inCart ? moreRef : addRef).current?.focus();
	}, [inCart]);

	const addControl = soldOut ? null : !orderable ? (
		<span className="flex size-10 items-center justify-center rounded-full bg-card/90 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
			{pausedOnly ? pausedLabel : "Closed"}
		</span>
	) : portioned ? (
		<button
			type="button"
			onClick={onChoosePortion}
			aria-haspopup="dialog"
			aria-label={inCart ? `Change ${displayName}, ${quantity} in cart` : `Choose ${displayName}: ${portions!.map((p) => p.label).join(" or ")}`}
			className={cn(
				"flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white shadow-lg shadow-primary/40 outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80",
			)}
		>
			{inCart ? (
				<span key={quantity} className="animate-bounce-count tabular-nums text-sm font-bold">{quantity}</span>
			) : (
				<Plus className="size-5 text-white" weight="bold" />
			)}
		</button>
	) : (
		<div
			className={cn(
				"flex size-11 shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/40",
			)}
		>
			{!inCart ? (
				<button
					ref={addRef}
					type="button"
					onClick={() => {
						moveFocus.current = addRef.current === document.activeElement;
						onAdd();
					}}
					aria-label={`Add ${dish.name}`}
					className="flex size-11 items-center justify-center rounded-full outline-none hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/80"
				>
					<Plus className="size-5 text-white" weight="bold" />
				</button>
			) : (
				<>
					<button
						type="button"
						onClick={(e) => {
							moveFocus.current = quantity === 1 && e.currentTarget === document.activeElement;
							onChangeQuantity(quantity - 1);
						}}
						aria-label={`Remove one ${dish.name}`}
						className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/25 text-white outline-none hover:bg-primary-foreground/35 focus-visible:ring-2 focus-visible:ring-white"
					>
						<Minus className="size-3.5" weight="bold" />
					</button>
					<span
						key={quantity}
						className="animate-bounce-count mx-0.5 min-w-3 text-center text-xs font-bold tabular-nums text-white"
						aria-live="polite"
					>
						{quantity}
					</span>
					<button
						ref={moreRef}
						type="button"
						onClick={() => onChangeQuantity(quantity + 1)}
						disabled={quantity >= MAX_QUANTITY}
						aria-label={`Add one more ${dish.name}`}
						className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground/25 text-white outline-none hover:bg-primary-foreground/35 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
					>
						<Plus className="size-3.5" weight="bold" />
					</button>
				</>
			)}
		</div>
	);

	return (
		<article
			id={`dish-${dish.id}`}
			className={cn(
				"group flex flex-col overflow-hidden rounded-2xl bg-card outline-none transition-shadow hover:shadow-raised focus-visible:ring-3 focus-visible:ring-ring/80",
				highlighted && "animate-highlight",
			)}
		>
			{portioned &&
				portions!.slice(1).map((p) => <span key={p.dish.id} id={`dish-${p.dish.id}`} className="hidden" aria-hidden="true" />)}

			{/* Photo area */}
			<div className={cn("relative aspect-[4/3] overflow-hidden bg-secondary", soldOut && "opacity-60 grayscale")}>
				{photo ? (
					<BlurImage
						src={photo}
						alt=""
						sizes="(max-width: 768px) 50vw, 33vw"
						className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
				) : (
					<div className="flex size-full items-center justify-center font-heading text-3xl font-bold text-foreground/30" aria-hidden="true">
						{dish.name.trim().charAt(0)}
					</div>
				)}

				{/* Heart button — top right */}
				<div className="absolute top-2 right-2">
					<HeartButton dishId={dish.id} dishName={displayName} initialLiked={liked} />
				</div>

				{/* Add button — bottom right, inside the photo */}
				{addControl && (
					<div className="absolute bottom-2.5 right-2.5">
						{addControl}
					</div>
				)}
			</div>

			{/* Details below photo */}
			<div className="flex flex-col gap-1 pt-5 pb-3 px-3">
				<h3
					className={cn(
						"flex items-center gap-1.5 text-sm font-bold leading-snug text-foreground",
						soldOut && "text-muted-foreground line-through",
					)}
				>
					<VegMark isVeg={dish.is_veg} className="size-3 shrink-0" />
					<span className="truncate">{displayName}</span>
				</h3>

				{(isUsual || isHighlyReordered) && (
					<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
						{isUsual ? (
							<>
								<Star className="size-2.5 icon-solid text-primary" aria-hidden="true" />
								Your usual
							</>
						) : (
							<>
								<Repeat className="size-2.5 text-success" aria-hidden="true" />
								Highly re-ordered
							</>
						)}
					</span>
				)}

				{dish.note && !portioned && (
					<p className="text-[10px] text-muted-foreground leading-tight">{dish.note}</p>
				)}

				<p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
					{portioned ? (
						portions!.map((p) => (
							<span key={p.dish.id} className="text-xs whitespace-nowrap">
								<span className="font-medium text-muted-foreground">{p.label} </span>
								<span className="font-heading text-sm font-extrabold text-primary">{formatRupees(p.dish.price)}</span>
							</span>
						))
					) : (
						<span className="font-heading text-base font-extrabold text-primary">{formatRupees(dish.price)}</span>
					)}
				</p>
			</div>
		</article>
	);
}
