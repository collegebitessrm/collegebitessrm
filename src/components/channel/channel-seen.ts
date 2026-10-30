"use client";

// Whether this device has opened the WhatsApp channel card yet — until it
// has, the Home header button carries a pulsing "new" dot and wiggles once.
const KEY = "collegebites.wa-channel-seen";
const listeners = new Set<() => void>();

export function subscribeChannelSeen(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function getChannelSeen(): boolean {
	try {
		return localStorage.getItem(KEY) === "1";
	} catch {
		return true;
	}
}

/** On the server (and before hydration) it counts as seen, so no dot flashes in and out. */
export const getServerChannelSeen = () => true;

export function markChannelSeen() {
	try {
		localStorage.setItem(KEY, "1");
	} catch {
		// Storage blocked: the dot just comes back next visit.
	}
	listeners.forEach((l) => l());
}

const JOINED_KEY = "collegebites.wa-channel-joined";
const DISMISSED_NEW_USER_KEY = "collegebites.wa-channel-dismissed-new";
const DISMISSED_ORDER_KEY = "collegebites.wa-channel-dismissed-order";

/**
 * Checks whether this device has already tapped "Follow on WhatsApp" to join the channel.
 */
export function getChannelJoined(): boolean {
	try {
		return localStorage.getItem(JOINED_KEY) === "1";
	} catch {
		return false;
	}
}

/**
 * Records that the user has tapped to follow the WhatsApp channel.
 * Once marked joined, the prompt will never automatically trigger again on this device.
 */
export function markChannelJoined() {
	try {
		localStorage.setItem(JOINED_KEY, "1");
		localStorage.setItem(KEY, "1");
	} catch {
		// ignore
	}
	listeners.forEach((l) => l());
}

/**
 * Returns true if the user dismissed the prompt recently:
 * - for new users: once dismissed, don't nag again on the home page.
 * - for orders: don't prompt more than once every 24 hours.
 */
export function isChannelDismissedRecently(type: "new_user" | "order_placed"): boolean {
	try {
		if (getChannelJoined()) return true;
		const key = type === "new_user" ? DISMISSED_NEW_USER_KEY : DISMISSED_ORDER_KEY;
		const raw = localStorage.getItem(key);
		if (!raw) return false;
		if (type === "new_user") return true;
		const ts = Number(raw);
		return Date.now() - ts < 24 * 60 * 60 * 1000;
	} catch {
		return false;
	}
}

/**
 * Records that the user dismissed the WhatsApp channel prompt ("Maybe later" or close).
 */
export function markChannelDismissed(type: "new_user" | "order_placed") {
	try {
		const key = type === "new_user" ? DISMISSED_NEW_USER_KEY : DISMISSED_ORDER_KEY;
		localStorage.setItem(key, String(Date.now()));
	} catch {
		// ignore
	}
}
