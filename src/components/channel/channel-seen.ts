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
