"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewTransition } from "react";
import {
	ArrowLeft,
	Check,
	ChefHat,
	CookingPot,
	MapPin,
	Moped,
	Phone,
	Receipt,
	Share2,
	Storefront,
	Timer,
	type AppIcon,
} from "@/components/icons";
import { BlurImage } from "@/components/blur-image";
import { BrandLogo } from "@/components/brand-logo";
import { CelebrationOverlay } from "@/components/celebration-overlay";
import { NotifyMeCard } from "@/components/notifications/notify-me-card";
import { RateOrder } from "@/components/orders/rate-order";
import { SupportButtons } from "@/components/support-buttons";
import type { OrderDetail } from "@/lib/data/orders";
import type { OrderStatus } from "@/lib/data/types";
import { deliveryWindow, formatTime, isPastDeliveryTime } from "@/lib/date";
import { getDishPhoto } from "@/lib/data/dish-photos";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { NAV_TRANSITION } from "@/lib/nav-transition";
import { formatOrderNumber, orderTimeline, type TimelineStepState } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";
import { SUPPORT_PHONE } from "@/lib/support";

/** Native share sheet when available (mostly mobile); clipboard copy otherwise. */
async function shareOrderToken(token: string) {
	const text = `My College Bites order token: ${token}`;
	if (navigator.share) {
		try {
			await navigator.share({ text });
			return;
		} catch {
			// Cancelled, or unsupported despite the feature check — fall through to copying.
		}
	}
	try {
		await navigator.clipboard.writeText(token);
		toast.success("Token copied!");
	} catch {
		toast.error("Couldn't copy. Try selecting it manually.");
	}
}

// Confetti plays once ever, on whichever order happens to be the first
// this device sees placed — remembered locally, not tied to the account,
// so it survives across restaurants/orders but not across devices.
const CONFETTI_SHOWN_KEY = "collegebites.confetti-shown";

/**
 * Renders the tracking page and keeps `status`/`updatedAt` live via
 * Supabase Realtime (subscribed to just this order's row — RLS still
 * governs whether this client is even allowed to receive it). Everything
 * else about the order (items, restaurant, total) never changes after
 * placement, so only these two fields need to be reactive.
 *
 * Falls back cleanly if Realtime never connects or the tab was in the
 * background: `initialOrder` came from the server component's own fetch,
 * so a plain page refresh always shows the true current status regardless
 * of whether the socket ever came up — the "Live" indicator is a bonus,
 * not something anything else here depends on.
 */
export function OrderTracking({
	initialOrder,
	justPlaced = false,
	openRating = false,
}: {
	initialOrder: OrderDetail;
	/** True once, right after this order was placed — shows a brief success moment. */
	justPlaced?: boolean;
	/** ?rate=1 — open the rating sheet on arrival (if the order is rateable). */
	openRating?: boolean;
}) {
	const router = useRouter();
	const [showSuccess] = useState(justPlaced);
	const [status, setStatus] = useState(initialOrder.status);
	const [updatedAt, setUpdatedAt] = useState(initialOrder.updatedAt);
	const [deliveredAt, setDeliveredAt] = useState(initialOrder.deliveredAt);
	const [live, setLive] = useState(false);

	useEffect(() => {
		if (showSuccess) router.replace(`/orders/${initialOrder.id}`);
	}, [initialOrder.id, showSuccess, router]);

	useEffect(() => {
		const supabase = createClient();
		const channel = supabase
			.channel(`order-${initialOrder.id}`)
			.on<{ status: OrderStatus; updated_at: string; delivered_at: string | null }>(
				"postgres_changes",
				{ event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${initialOrder.id}` },
				(payload) => {
					setStatus(payload.new.status);
					setUpdatedAt(payload.new.updated_at);
					setDeliveredAt(payload.new.delivered_at);
				},
			)
			.subscribe((subscribeStatus) => setLive(subscribeStatus === "SUBSCRIBED"));

		return () => {
			setLive(false);
			supabase.removeChannel(channel);
		};
	}, [initialOrder.id]);

	const cancelled = status === "cancelled";
	const steps = cancelled ? [] : orderTimeline(status);
	const eta = deliveryWindow(initialOrder.createdAt, initialOrder.deliveryMinutes);

	// Up to three distinct photos of what was ordered.
	const photos = initialOrder.items
		.map((item) => ({ dishName: item.dishName, src: getDishPhoto(initialOrder.restaurantName, item.dishName) }))
		.filter((p): p is { dishName: string; src: string } => !!p.src)
		.filter((p, i, all) => all.findIndex((q) => q.src === p.src) === i)
		.slice(0, 3);

	// Show restaurant phone when delayed or out for delivery / at gate (for delay contact).
	const isDelayed = !cancelled && status !== "delivered" && isPastDeliveryTime(initialOrder.createdAt, initialOrder.deliveryMinutes);
	const showRestaurantPhone = isDelayed || status === "out_for_delivery" || status === "at_gate";

	return (
		<>
			{showSuccess && (
				<CelebrationOverlay confettiOnceKey={CONFETTI_SHOWN_KEY}>
					<BrandLogo className="animate-pop-in size-20 rounded-3xl" />
					<p className="animate-pop-in mt-5 font-heading text-2xl font-bold">Order placed!</p>
					<p className="mt-1 text-primary-foreground/85">Show this token at the gate</p>
					<p className="animate-pop-in mt-4 font-heading text-7xl font-bold tracking-tight text-primary-foreground">
						{formatOrderNumber(initialOrder.dailyNumber)}
					</p>
				</CelebrationOverlay>
			)}
			<main className="mx-auto w-full max-w-md px-5 pb-28">
				<ViewTransition {...NAV_TRANSITION}>
					{/* Header */}
					<div className="flex items-center gap-3 pt-4 pb-2">
						<Link
							href="/orders"
							aria-label="Back to your orders"
							transitionTypes={["nav-back"]}
							className="flex size-11 items-center justify-center rounded-full border bg-card shadow-card outline-none transition-all hover:scale-105 hover:border-ring/50 focus-visible:ring-3 focus-visible:ring-ring/80"
						>
							<ArrowLeft className="size-5" />
						</Link>
						<div className="flex-1 text-center">
							<h1 className="font-heading text-2xl font-bold text-foreground">
								Track Order
							</h1>
							{!cancelled && status !== "delivered" && (
								<p className="mt-0.5 text-sm text-muted-foreground">Good food is on the way 🧡</p>
							)}
						</div>
						<div className="size-11" aria-hidden="true" />
					</div>

					{!cancelled && status !== "delivered" && (
						<>
							{/* Hero Card */}
							<div className="relative mt-4 overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 shadow-lg shadow-orange-500/30" style={{ height: 220 }}>
								<img
									src="/photos/promo/hero-trackingpage.png"
									alt=""
									className="absolute inset-0 h-full w-full object-cover object-right"
									draggable={false}
								/>
								<div className="absolute inset-0 bg-gradient-to-r from-orange-700/50 via-orange-600/30 to-transparent" />

								{/* LIVE + Share — top-right, above the scooter */}
								<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
									<span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
										<span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" aria-hidden="true" />
										LIVE
									</span>
									<button
										onClick={() => shareOrderToken(formatOrderNumber(initialOrder.dailyNumber))}
										className="flex size-8 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm transition-all hover:bg-orange-50 active:scale-95"
										aria-label="Share token"
									>
										<Share2 className="size-4" />
									</button>
								</div>

								{/* Left content */}
								<div className="relative z-10 flex h-full flex-col justify-end px-6 pb-5">
									<p className="text-[10px] font-medium text-white/70">Order Token</p>
									<p className="mt-0.5 font-heading text-4xl font-bold tracking-tight text-white">
										{formatOrderNumber(initialOrder.dailyNumber)}
									</p>

									{/* Restaurant info */}
									<div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
										<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/25">
											<Storefront className="size-4 text-white" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-semibold text-white">{initialOrder.restaurantName}</p>
											<p className="flex items-center gap-1 text-xs text-white/80">
												<MapPin className="size-3" /> Gate 3, SRM AP
											</p>
										</div>
									</div>

								</div>
							</div>

							{/* ETA Card */}
							<div className="mt-4 flex items-center rounded-[1.5rem] border bg-card p-4 shadow-card">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/15">
									<Timer className="size-6 text-orange-500" />
								</div>
								<div className="ml-4 flex-1">
									<p className="text-sm font-medium text-muted-foreground">Estimated arrival</p>
									<p className="mt-0.5 font-heading text-2xl font-bold tabular-nums text-foreground">{eta.time}</p>
								</div>
								<div className="shrink-0">
									<Moped className="size-10 text-orange-400 opacity-60" />
								</div>
							</div>

							{/* Progress Timeline */}
							<div className="mt-4 rounded-[1.5rem] border bg-card p-5 shadow-card">
								<div className="flex items-start justify-between">
									<div>
										<p className="font-heading text-lg font-bold text-foreground">Order Progress</p>
										<p className="mt-0.5 text-sm text-muted-foreground">Good things take a little time 😊</p>
									</div>
									<p className="font-heading text-base font-bold text-orange-500">Yummy Soon!</p>
								</div>

								<ol className="mt-4 space-y-0">
									{steps.map((step, i) => (
										<li key={step.label} className="flex gap-4">
											<div className="flex flex-col items-center">
												<StepDot state={step.state} Icon={stepIconFor(i)} />
												{i < steps.length - 1 && (
													<span
														className={cn(
															"w-0.5 flex-1 min-h-12 rounded-full transition-colors",
															step.state === "done" ? "bg-success" : "bg-[repeating-linear-gradient(to_bottom,var(--border)_0_4px,transparent_4px_8px)]",
														)}
														aria-hidden="true"
													/>
												)}
											</div>
											<div className={cn("flex-1 pb-6", step.state === "upcoming" && "opacity-40")}>
												<p className={cn(
													"font-semibold transition-colors",
													step.state === "current" && "text-orange-500",
													step.state === "done" && "text-foreground",
												)}>
													{step.label}
												</p>
												{step.state === "current" && step.label === "Pending confirmation" && (
													<p className="mt-0.5 text-sm text-muted-foreground">Waiting for the restaurant to confirm…</p>
												)}
												{i === 0 && <p className="mt-0.5 text-sm text-muted-foreground">{formatTime(initialOrder.createdAt)}</p>}
												{step.state === "current" && step.label === "Preparing your order" && (
													<p className="mt-0.5 text-sm text-muted-foreground">Fresh ingredients, made with love.</p>
												)}
												{step.state === "current" && step.label === "On the way to Gate 3" && (
													<p className="mt-0.5 text-sm text-muted-foreground">Hot food incoming, stay ready.</p>
												)}
												{step.state === "current" && step.label === "Reached Gate 3" && (
													<p className="mt-0.5 text-sm text-muted-foreground">Come collect your order at Gate 3!</p>
												)}
												{i === steps.length - 1 && step.state === "done" && (
													<p className="mt-0.5 text-sm text-muted-foreground">{formatTime(updatedAt)}</p>
												)}
												{step.state === "current" && (
													<span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-400">
														<Timer className="size-3.5" /> In progress
													</span>
												)}
												{/* Call restaurant button — appears after preparing is done, hides when delivered */}
												{i === 2 && step.state === "done" && showRestaurantPhone && (
													<a
														href={`tel:${initialOrder.restaurantPhone}`}
														className="mt-2 inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95"
													>
														<Phone className="size-3.5" />
														{isDelayed ? "Running late? Call restaurant" : "Contact delivery"}: {initialOrder.restaurantPhone}
													</a>
												)}
											</div>
										</li>
									))}
								</ol>
							</div>

						</>
					)}

					{/* Order Details */}
					<div className="mt-4 rounded-[1.5rem] border bg-card p-5 shadow-card">
						{photos.length > 0 && (
							<div className="flex items-center gap-3">
								<div className="flex -space-x-2">
									{photos.map((photo) => (
										<div key={photo.src} className="relative size-12 overflow-hidden rounded-full border-2 border-card shadow-sm">
											<BlurImage src={photo.src} alt="" sizes="48px" className="h-full w-full object-cover" />
										</div>
									))}
								</div>
								<div>
									<p className="font-heading text-lg font-bold text-foreground">{initialOrder.restaurantName}</p>
									<p className="text-xs text-muted-foreground">{initialOrder.items.length} item{initialOrder.items.length !== 1 ? "s" : ""}</p>
								</div>
							</div>
						)}

						<ul className={cn("mt-4 space-y-3", photos.length === 0 && "mt-0")}>
							{initialOrder.items.map((item) => {
								const photo = getDishPhoto(initialOrder.restaurantName, item.dishName);
								return (
									<li key={item.id} className="flex items-center gap-3">
										<span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary shadow-sm">
											{photo ? (
												<BlurImage src={photo} alt="" sizes="56px" className="h-full w-full object-cover" />
											) : (
												<span className="font-heading font-bold text-foreground/40">{item.dishName.trim().charAt(0)}</span>
											)}
										</span>
										<span className="min-w-0 flex-1">
											<span className="block text-sm font-semibold">{item.dishName}</span>
											<span className="block text-xs text-muted-foreground">Qty: {item.quantity}</span>
										</span>
										{item.isFree ? (
											<span className="rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">Free</span>
										) : (
											<span className="text-sm font-bold tabular-nums text-foreground">{formatRupees(item.subtotal)}</span>
										)}
									</li>
								);
							})}
						</ul>

						{initialOrder.discountOffer && (
							<div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-success-soft px-4 py-3 text-sm">
								<span className="font-semibold text-success">{OFFERS[initialOrder.discountOffer].short}</span>
								<span className="font-bold tabular-nums text-success">−{formatRupees(initialOrder.discountAmount)}</span>
							</div>
						)}

						{initialOrder.notes && (
							<div className="mt-4 rounded-xl bg-secondary px-4 py-3">
								<p className="text-xs font-medium text-muted-foreground">Note</p>
								<p className="mt-0.5 text-sm text-foreground">"{initialOrder.notes}"</p>
							</div>
						)}

						<div className="mt-4 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3 dark:bg-orange-500/10">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-500/20">
									<Receipt className="size-5 text-orange-500" />
								</div>
								<div>
									<p className="text-xs font-medium text-muted-foreground">Total to pay</p>
									<p className="text-sm font-bold text-foreground">at pickup</p>
								</div>
							</div>
							<p className="font-heading text-3xl font-bold tabular-nums text-orange-500">{formatRupees(initialOrder.totalAmount)}</p>
						</div>
					</div>

					{cancelled ? (
						<div className="mt-4 rounded-[1.5rem] border-2 border-destructive/30 bg-destructive/5 px-5 py-5">
							<div className="flex items-start gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
									<Check className="size-5 text-destructive" />
								</div>
								<div>
									<p className="font-heading text-lg font-bold text-destructive">Order Cancelled</p>
									<p className="mt-1 text-sm text-muted-foreground">
										This order won&apos;t be delivered. If you were charged or have questions, reach out to College Bites support.
									</p>
								</div>
							</div>
						</div>
					) : (
						<>
							{/* Support */}
							<div className="mt-4 flex items-center rounded-[1.5rem] border bg-card p-4 shadow-card">
								<div className="flex-1">
									<p className="text-sm font-semibold text-foreground">Need help?</p>
									<p className="text-xs text-muted-foreground">Contact Order Bites support</p>
								</div>
								<SupportButtons
									whatsappMessage={`Hi College Bites, something's wrong with my order ${formatOrderNumber(initialOrder.dailyNumber)}.`}
								/>
							</div>

							{/* Bon Appétit footer */}
							<div className="mt-6 text-center">
								<p className="font-heading text-lg italic text-orange-400">
									 Bon Appétit 🧡
								</p>
							</div>
						</>
					)}

					{/* Rating */}
					{status === "delivered" && (
						<RateOrder
							orderId={initialOrder.id}
							restaurantName={initialOrder.restaurantName}
							items={initialOrder.items}
							deliveredAt={deliveredAt}
							initialReview={initialOrder.review}
							autoOpen={openRating}
						/>
					)}
				</ViewTransition>
			</main>
		</>
	);
}

function stepIconFor(i: number): AppIcon {
	const icons: AppIcon[] = [Receipt, ChefHat, CookingPot, Moped, MapPin, Check];
	return icons[i] ?? Check;
}

function StepDot({ state, Icon }: { state: TimelineStepState; Icon: AppIcon }) {
	if (state === "done") {
		return (
			<span className="animate-pop-in flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground shadow-sm">
				<Check className="size-4" />
			</span>
		);
	}
	if (state === "current") {
		return (
			<span className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
				<span className="animate-ping-slow absolute inset-0 rounded-full bg-orange-500/40" />
				<span className="relative flex size-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30">
					<Icon className="size-4" />
				</span>
			</span>
		);
	}
	return (
		<span className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card text-muted-foreground">
			<Icon className="size-4" />
		</span>
	);
}