"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { cn } from "@/lib/utils";

const SLIDES = [
	{
		src: "/photos/promo/prom 1.png",
		alt: "College Bites promo 1",
	},
	{
		src: "/photos/promo/promo2.png",
		alt: "College Bites promo 2",
	},
	{
		src: "/photos/promo/promo3.png",
		alt: "College Bites promo 3",
	},
];

/**
 * Hero banner carousel — clean images with only an "Order Now" CTA button.
 * Auto-advances every 4s with dot indicators.
 */
export function PromoCard() {
	const [active, setActive] = useState(0);
	const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

	useEffect(() => {
		timerRef.current = setInterval(() => {
			setActive((prev) => (prev + 1) % SLIDES.length);
		}, 4000);
		return () => clearInterval(timerRef.current);
	}, []);

	function goTo(index: number) {
		setActive(index);
		clearInterval(timerRef.current);
		timerRef.current = setInterval(() => {
			setActive((prev) => (prev + 1) % SLIDES.length);
		}, 4000);
	}

	return (
		<div className="relative mt-4 overflow-hidden rounded-2xl">
			{/* Slides */}
			<div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
				{SLIDES.map((s, i) => (
					<div
						key={i}
						className={cn(
							"absolute inset-0 transition-opacity duration-500",
							i === active ? "opacity-100" : "opacity-0",
						)}
					>
						<BlurImage
							src={s.src}
							alt={s.alt}
							sizes="(max-width: 768px) 100vw, 800px"
							className="size-full object-cover"
							priority={i === 0}
						/>
					</div>
				))}

				{/* Order Now button — bottom center */}
				<div className="absolute inset-x-0 bottom-4 flex justify-center">
					<a
						href="#restaurants"
						className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105"
					>
						Order Now
						<ArrowRight className="size-4" />
					</a>
				</div>
			</div>

			{/* Dot indicators */}
			<div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1.5">
				{SLIDES.map((_, i) => (
					<button
						key={i}
						type="button"
						onClick={() => goTo(i)}
						aria-label={`Go to slide ${i + 1}`}
						className={cn(
							"h-1.5 rounded-full transition-all",
							i === active ? "w-6 bg-primary" : "w-1.5 bg-white/60 hover:bg-white/80",
						)}
					/>
				))}
			</div>
		</div>
	);
}