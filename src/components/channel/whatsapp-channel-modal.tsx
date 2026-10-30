"use client";

import { useEffect, useState } from "react";
import {
	ArrowRight,
	BellRing,
	CookingPot,
	Discount,
	MessageCircle,
	ShieldCheck,
	Sparkle,
	X,
	type AppIcon,
} from "@/components/icons";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { WHATSAPP_CHANNEL_URL } from "@/lib/support";
import { cn } from "@/lib/utils";
import {
	getChannelJoined,
	isChannelDismissedRecently,
	markChannelDismissed,
	markChannelJoined,
} from "./channel-seen";

export type WhatsAppModalTrigger = "new_user" | "order_placed";

const PERKS: { Icon: AppIcon; text: string; subtext: string; tint: string }[] = [
	{
		Icon: CookingPot,
		text: "Daily Menus & Kitchen Times",
		subtext: "Know today's dishes & opening times first",
		tint: "text-amber-500",
	},
	{
		Icon: BellRing,
		text: "Live Campus Delivery Updates",
		subtext: "Quick notices during rush hours & batch arrivals",
		tint: "text-emerald-500",
	},
	{
		Icon: Discount,
		text: "Secret Offers & Biryani Drops",
		subtext: "Exclusive promo codes & free biryani giveaways",
		tint: "text-primary",
	},
];

interface WhatsAppChannelModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	trigger: WhatsAppModalTrigger;
	userName?: string | null;
}

export function WhatsAppChannelModal({
	open,
	onOpenChange,
	trigger,
	userName,
}: WhatsAppChannelModalProps) {
	const isNewUser = trigger === "new_user";

	const handleFollow = () => {
		markChannelJoined();
		onOpenChange(false);
		window.open(WHATSAPP_CHANNEL_URL, "_blank", "noopener,noreferrer");
	};

	const handleDismiss = () => {
		markChannelDismissed(trigger);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={(val) => {
			if (!val) {
				handleDismiss();
			} else {
				onOpenChange(true);
			}
		}}>
			<DialogContent
				showCloseButton={false}
				className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-[2rem] border-0 p-0 shadow-2xl"
			>
				{/* Header Banner with vibrant emerald WhatsApp theme */}
				<div className="relative overflow-hidden bg-gradient-to-br from-[#128C7E] via-[#25D366] to-[#075E54] px-6 pt-7 pb-6 text-white">
					{/* Background decorative glow rings */}
					<div className="pointer-events-none absolute -top-12 -right-12 size-36 rounded-full bg-white/10 blur-xl" />
					<div className="pointer-events-none absolute -bottom-10 -left-10 size-32 rounded-full bg-emerald-950/20 blur-lg" />

					{/* Close button */}
					<button
						type="button"
						onClick={handleDismiss}
						aria-label="Close"
						className="pressable absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-black/20 text-white/90 backdrop-blur-sm transition-transform hover:bg-black/30 hover:scale-105 active:scale-95"
					>
						<X className="size-4" />
					</button>

					{/* Badge + WhatsApp icon */}
					<div className="flex items-center gap-3">
						<div className="relative flex size-13 shrink-0 items-center justify-center rounded-2xl bg-white text-[#25D366] shadow-lg ring-4 ring-white/20">
							<MessageCircle className="size-8" />
							<span className="absolute -top-1 -right-1 flex size-3">
								<span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
								<span className="relative inline-flex size-3 rounded-full bg-amber-400 ring-2 ring-white" />
							</span>
						</div>
						<div>
							<div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-white backdrop-blur-sm">
								<Sparkle className="size-3 text-amber-300" />
								Official WhatsApp Channel
							</div>
							<p className="mt-1 font-heading text-lg font-bold leading-tight text-white">
								College Bites SRM
							</p>
						</div>
					</div>

					{/* Headline */}
					<DialogTitle className="mt-4 font-heading text-xl font-bold leading-snug text-white">
						{isNewUser
							? userName
								? `Welcome, ${userName.split(" ")[0]}! Get Daily Updates`
								: "Welcome! Get Daily Campus Updates"
							: "Order Confirmed! Stay Updated 🚀"}
					</DialogTitle>
					<p className="mt-1.5 text-xs text-emerald-50/90 leading-relaxed">
						{isNewUser
							? "Join 1,000+ SRM students on WhatsApp for today's menus, kitchen timings, and flash food discounts."
							: "Never miss when your food arrives! Follow our WhatsApp channel for live rush alerts, daily menus, and free drops."}
					</p>
				</div>

				{/* Body Content */}
				<div className="bg-card px-5 pt-4 pb-6">
					{/* Perks List */}
					<div className="space-y-3">
						{PERKS.map(({ Icon, text, subtext, tint }) => (
							<div
								key={text}
								className="flex items-start gap-3 rounded-xl border bg-secondary/40 p-2.5 transition-colors"
							>
								<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-card shadow-xs">
									<Icon className={cn("size-4.5", tint)} />
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-xs font-semibold text-foreground">{text}</p>
									<p className="text-[11px] text-muted-foreground">{subtext}</p>
								</div>
							</div>
						))}
					</div>

					{/* Action Buttons */}
					<div className="mt-5 flex flex-col gap-2.5">
						<button
							type="button"
							onClick={handleFollow}
							className="pressable group relative flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:bg-[#20ba59] active:scale-[0.98]"
						>
							<MessageCircle className="size-5 transition-transform group-hover:scale-110" />
							<span>Follow on WhatsApp</span>
							<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
						</button>

						<button
							type="button"
							onClick={handleDismiss}
							className="pressable h-9 w-full text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Maybe later
						</button>
					</div>

					{/* Privacy guarantee */}
					<div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
						<ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
						<span>100% Private · Your phone number is never shared</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Controller component for new users landing on Home.
 * Checks whether the user is new and hasn't joined/dismissed yet, then gently opens the modal.
 */
export function NewUserWhatsAppPrompt({
	isNewUser,
	userName,
}: {
	isNewUser: boolean;
	userName?: string | null;
}) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!isNewUser) return;
		if (getChannelJoined()) return;
		if (isChannelDismissedRecently("new_user")) return;

		// Gentle delay so the page animation finishes first
		const timer = setTimeout(() => {
			setOpen(true);
		}, 800);

		return () => clearTimeout(timer);
	}, [isNewUser]);

	return (
		<WhatsAppChannelModal
			open={open}
			onOpenChange={setOpen}
			trigger="new_user"
			userName={userName}
		/>
	);
}
