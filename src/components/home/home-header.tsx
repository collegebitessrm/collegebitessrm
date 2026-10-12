import { Bell, ChevronDown, Heart, MapPin, MoonStars, Sun, Sunrise, Sunset, type AppIcon } from "@/components/icons";
import { AboutDialog } from "@/components/home/about-dialog";
import { BrandLogo } from "@/components/brand-logo";
import { Avatar } from "@/components/taste/avatar";
import { OpenTasteSheetButton } from "@/components/taste/taste-sheet";
import type { TimeOfDay } from "@/lib/date";

// Each time of day gets its own greeting and question.
const MOOD: Record<TimeOfDay, { greeting: string; Icon: AppIcon; question: string }> = {
	morning: { greeting: "Good morning", Icon: Sunrise, question: "Fuel up for the day?" },
	afternoon: { greeting: "Good afternoon", Icon: Sun, question: "What are you craving today?" },
	evening: { greeting: "Good evening", Icon: Sunset, question: "Dinner o'clock. What's it going to be?" },
	night: { greeting: "Still up", Icon: MoonStars, question: "Late-night craving?" },
};

/**
 * Home's header — Zomato-style: location pin on the left, heart + bell
 * icons on the right, then the greeting and question below.
 */
export function HomeHeader({
	fullName,
	timeOfDay,
	avatar,
}: {
	fullName: string;
	timeOfDay: TimeOfDay;
	avatar: string;
}) {
	const { greeting, Icon, question } = MOOD[timeOfDay];
	const firstName = fullName.trim().split(/\s+/)[0];

	return (
		<header className="relative px-1 pt-4 pb-2">
			{/* Top row: location + actions */}
			<div className="flex items-center justify-between">
				<AboutDialog>
					<div
						className="pressable flex items-center gap-1.5 rounded-full px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/80"
					>
						<MapPin className="size-4 shrink-0 text-primary" />
						<span className="text-sm font-semibold text-foreground">SRM University AP</span>
						<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
					</div>
				</AboutDialog>
				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Wishlist"
						className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
					>
						<Heart className="size-5" />
					</button>
					<button
						type="button"
						aria-label="Notifications"
						className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/80"
					>
						<Bell className="size-5" />
					</button>
				</div>
			</div>

			{/* Greeting */}
			<div className="mt-6 flex items-center justify-between">
				<div className="min-w-0 flex-1">
					<p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
						<Icon className="size-4 shrink-0 text-primary" />
						{greeting}
					</p>
					<h1 className="mt-0.5 font-heading text-display font-bold text-foreground">
						Hey, {firstName}
					</h1>
					<p className="mt-1 text-base text-muted-foreground">{question}</p>
				</div>
				<OpenTasteSheetButton
					aria-label="Your avatar and taste"
					className="pressable shrink-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/80"
				>
					<Avatar id={avatar} className="size-14 ring-2 ring-border" />
				</OpenTasteSheetButton>
			</div>
		</header>
	);
}