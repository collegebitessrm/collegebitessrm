// All timestamps in the app are IST wall-clock times for SRM AP students,
// regardless of what timezone the server happens to run in.
const IST = "Asia/Kolkata";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
 timeZone: IST,
 year: "numeric",
 month: "2-digit",
 day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
 timeZone: IST,
 hour: "numeric",
 minute: "2-digit",
 hour12: true,
});
const dateFmt = new Intl.DateTimeFormat("en-IN", {
 timeZone: IST,
 day: "numeric",
 month: "short",
});

// Intl inserts a narrow no-break space before am/pm in en-IN and lowercases
// it; normalize both so times render as "7:42 PM" everywhere.
function time(d: Date) {
 return timeFmt.format(d).replace(/ /g, " ").replace(/am|pm/i, (m) => m.toUpperCase());
}

/** "7:42 PM" */
export function formatTime(iso: string): string {
 return time(new Date(iso));
}

/** "Today, 7:42 PM" or "11 Sep, 9:10 PM", both in IST. */
export function formatOrderTimestamp(iso: string): string {
 const d = new Date(iso);
 const isToday = dayKeyFmt.format(d) === dayKeyFmt.format(new Date());
 return isToday ? `Today, ${time(d)}` : `${dateFmt.format(d)}, ${time(d)}`;
}

const hourMinuteFmt = new Intl.DateTimeFormat("en-GB", {
 timeZone: IST,
 hour: "2-digit",
 minute: "2-digit",
 hour12: false,
});

/**
 * Minutes from placing an order to its promised delivery, when the
 * restaurant row doesn't say (restaurants.delivery_minutes defaults to the
 * same 40 in the database).
 */
export const DEFAULT_DELIVERY_MINUTES = 40;

/**
 * Normalizes a restaurant name to one of the 3 supported partner categories:
 * 'biryani' | 'triangle' | 'home' | 'other'
 */
function normalizeRestaurantKey(name?: string | null): "biryani" | "triangle" | "home" | "other" {
	if (!name) return "other";
	const lower = name.toLowerCase();
	if (lower.includes("biryani") || lower.includes("biriyani")) return "biryani";
	if (lower.includes("triangle")) return "triangle";
	if (lower.includes("home")) return "home";
	return "other";
}

/**
 * Creates a Date for a fixed target IST hour and minute on the same calendar day as baseDate.
 * Note: IST is UTC+5:30 (offset = 330 minutes).
 */
function createIstTimeDate(baseDate: Date, targetHour: number, targetMinute: number): Date {
	const parts = dayKeyFmt.format(baseDate).split("-").map(Number); // [YYYY, MM, DD] in IST
	const year = parts[0];
	const month = parts[1] - 1;
	const day = parts[2];
	const utcMs = Date.UTC(year, month, day, targetHour, targetMinute) - 330 * 60_000;
	return new Date(utcMs);
}

/**
 * Minutes elapsed from midnight in IST (0 to 1439).
 */
function getIstMinutesFromMidnight(d: Date): number {
	const [hour, minute] = hourMinuteFmt.format(d).split(":").map(Number);
	return hour * 60 + minute;
}

/**
 * When an order is promised by, respecting restaurant-specific schedule rules:
 * - Biryani Nation:
 *   - Orders before 12:30 PM -> 1:00 PM
 *   - Orders at/after 12:30 PM (or after 1:00 PM) -> +1 hour (60 min)
 * - Triangle Food Court:
 *   - Morning before 12:20 PM -> 12:50 PM
 *   - Morning/afternoon after 12:20 PM (up to 5:00 PM) -> +1 hour (60 min)
 *   - Evening before 7:00 PM (5:00 PM to 7:00 PM) -> 7:30 PM
 *   - Evening at/after 7:00 PM (or after 7:30 PM) -> +50 min
 * - Local Home Kitchen:
 *   - Always +50 min
 */
export function deliveryDue(
	iso: string,
	minutes: number = DEFAULT_DELIVERY_MINUTES,
	restaurantName?: string | null,
): Date {
	const orderDate = new Date(iso);
	const restKey = normalizeRestaurantKey(restaurantName);
	const istMins = getIstMinutesFromMidnight(orderDate);

	if (restKey === "biryani") {
		// Before 12:30 PM (750 mins): fixed estimate at 1:00 PM (13:00 IST)
		if (istMins < 750) {
			return createIstTimeDate(orderDate, 13, 0);
		}
		// At or after 12:30 PM / after 1:00 PM: 1 hour after order time
		return new Date(orderDate.getTime() + 60 * 60_000);
	}

	if (restKey === "triangle") {
		// Morning / lunch shift (before 5:00 PM / 17:00 IST = 1020 mins)
		if (istMins < 740) {
			// Before 12:20 PM (740 mins): fixed estimate at 12:50 PM (12:50 IST)
			return createIstTimeDate(orderDate, 12, 50);
		}
		if (istMins < 1020) {
			// After 12:20 PM up to 5:00 PM: 1 hour after order time
			return new Date(orderDate.getTime() + 60 * 60_000);
		}
		// Evening / dinner shift (from 5:00 PM onwards)
		if (istMins < 1140) {
			// Before 7:00 PM (1140 mins): fixed estimate at 7:30 PM (19:30 IST)
			return createIstTimeDate(orderDate, 19, 30);
		}
		// At or after 7:00 PM (or after 7:30 PM): add 50 mins
		return new Date(orderDate.getTime() + 50 * 60_000);
	}

	if (restKey === "home") {
		// Local Home Kitchen: always 50 minutes after order time
		return new Date(orderDate.getTime() + 50 * 60_000);
	}

	// Fallback when no restaurant matches or unspecified
	const deliveryMins = minutes > 0 ? minutes : DEFAULT_DELIVERY_MINUTES;
	return new Date(orderDate.getTime() + deliveryMins * 60_000);
}

/**
 * "Delivery by 8:40 PM" for an order — split into a lead-in and the time so
 * the UI can keep the time on one line; spaces inside `time` are no-break.
 */
export function deliveryWindow(
	iso: string,
	minutes: number = DEFAULT_DELIVERY_MINUTES,
	restaurantName?: string | null,
): { lead: string; time: string } {
	return { lead: "Delivery by", time: time(deliveryDue(iso, minutes, restaurantName)).replace(/ /g, " ") };
}

/** True once an order's promised delivery time has passed. */
export function isPastDeliveryTime(
	iso: string,
	minutes: number = DEFAULT_DELIVERY_MINUTES,
	now: Date = new Date(),
	restaurantName?: string | null,
): boolean {
	return now.getTime() >= deliveryDue(iso, minutes, restaurantName).getTime();
}

const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: IST, weekday: "long" });

/** True on Thursdays, IST wall-clock — powers the Thursday-special nudge on Home. */
export function isThursdayIST(now: Date = new Date()): boolean {
 return weekdayFmt.format(now) === "Thursday";
}

const adminDayFmt = new Intl.DateTimeFormat("en-IN", {
 timeZone: IST,
 weekday: "long",
 day: "numeric",
 month: "short",
 year: "numeric",
});

/** Stable per-IST-day grouping key, e.g. "2026-09-17" — for the admin order-history grouping. */
export function istDayKey(iso: string): string {
 return dayKeyFmt.format(new Date(iso));
}

/** "Wednesday, 17 Sep 2026" — IST calendar day, for the admin order-history section headings. */
export function formatAdminDay(iso: string): string {
 return adminDayFmt.format(new Date(iso));
}

// Built from en-US parts: en-IN and en-GB both abbreviate September as
// "Sept" in current ICU, which reads like a typo next to "Aug"/"Oct".
const dayHeadingFmt = new Intl.DateTimeFormat("en-US", {
 timeZone: IST,
 weekday: "short",
 day: "numeric",
 month: "short",
});

/**
 * "Today", "Yesterday", or "Wed 17 Sep" (plus the year once it isn't this
 * year) — IST calendar day, for the student orders list's date groups.
 */
export function formatDayHeading(iso: string, now: Date = new Date()): string {
 const key = istDayKey(iso);
 if (key === dayKeyFmt.format(now)) return "Today";
 if (key === dayKeyFmt.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))) return "Yesterday";
 const label = formatShortDay(iso);
 return key.slice(0, 4) === dayKeyFmt.format(now).slice(0, 4) ? label : `${label} ${key.slice(0, 4)}`;
}

/** "Sat 19 Sep" — IST calendar day, no relative wording (admin's Today card). */
export function formatShortDay(iso: string): string {
 const part = (type: Intl.DateTimeFormatPartTypes) =>
 dayHeadingFmt.formatToParts(new Date(iso)).find((p) => p.type === type)?.value;
 return `${part("weekday")} ${part("day")} ${part("month")}`;
}

/** The UTC instant of the start of "today" in IST wall-clock time — for scoping the admin dashboard to today's orders only. */
export function startOfTodayIST(now: Date = new Date()): Date {
 const [year, month, day] = dayKeyFmt.format(now).split("-").map(Number);
 // IST is a fixed UTC+5:30 offset (no DST) — subtract it from the
 // wall-clock time to get the actual UTC instant it corresponds to.
 return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5 * 60 + 30) * 60_000);
}

/**
 * The UTC instant of the start of the current IST week (Sunday 00:00 IST).
 * Weekly analytics count Sunday–Saturday, matching the campus's natural
 * week boundary.
 */
export function startOfWeekIST(now: Date = new Date()): Date {
 const [year, month, day] = dayKeyFmt.format(now).split("-").map(Number);
 const d = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5 * 60 + 30) * 60_000);
 // getUTCDay() returns 0 for Sunday — subtract that many days to reach Sunday.
 d.setUTCDate(d.getUTCDate() - d.getUTCDay());
 return d;
}

const monthYearFmt = new Intl.DateTimeFormat("en-IN", {
 timeZone: IST,
 month: "long",
 year: "numeric",
});

/** "January 2026" — for the profile's "Member since" line. */
export function formatMonthYear(iso: string): string {
 return monthYearFmt.format(new Date(iso));
}

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

/**
 * IST wall-clock time-of-day bucket for the Home greeting.
 */
export function getTimeOfDayIST(now: Date = new Date()): TimeOfDay {
 const [h] = hourMinuteFmt.format(now).split(":").map(Number);
 if (h >= 5 && h < 12) return "morning";
 if (h >= 12 && h < 17) return "afternoon";
 if (h >= 17 && h < 21) return "evening";
 return "night";
}
