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

/** When an order is promised by: placed time + the restaurant's delivery minutes. */
export function deliveryDue(iso: string, minutes: number = DEFAULT_DELIVERY_MINUTES): Date {
 return new Date(new Date(iso).getTime() + minutes * 60_000);
}

/**
 * "Delivery by 8:40 PM" for an order — split into a lead-in and the time so
 * the UI can keep the time on one line; spaces inside `time` are no-break.
 */
export function deliveryWindow(
 iso: string,
 minutes: number = DEFAULT_DELIVERY_MINUTES,
): { lead: string; time: string } {
 return { lead: "Delivery by", time: time(deliveryDue(iso, minutes)).replace(/ /g, " ") };
}

/** True once an order's promised delivery time has passed. */
export function isPastDeliveryTime(
 iso: string,
 minutes: number = DEFAULT_DELIVERY_MINUTES,
 now: Date = new Date(),
): boolean {
 return now.getTime() >= deliveryDue(iso, minutes).getTime();
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
