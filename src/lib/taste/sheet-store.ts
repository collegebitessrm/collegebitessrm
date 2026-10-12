"use client";

import { useSyncExternalStore } from "react";

// Whether the "Your taste" sheet is open. One sheet per page
// (<TasteSheetHost/>); the Home avatar, the "Finish your profile" card and
// the Profile row all open it through here instead of each owning a copy.

let open = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
 listeners.add(listener);
 return () => listeners.delete(listener);
}

export function setTasteSheetOpen(next: boolean) {
 open = next;
 listeners.forEach((l) => l());
}

export function openTasteSheet() {
 setTasteSheetOpen(true);
}

export function useTasteSheetOpen(): boolean {
 return useSyncExternalStore(subscribe, () => open, () => false);
}

// The "Finish your profile" card's memory, per device: "never" after ×,
// or a time it's snoozed until ("Later", or after saving part of it).

const NUDGE_KEY = "collegebites.taste-nudge";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

export function tasteNudgeHidden(): boolean {
 try {
 const v = localStorage.getItem(NUDGE_KEY);
 if (v === "never") return true;
 return v !== null && Date.now() < Number(v);
 } catch {
 return false;
 }
}

export function snoozeTasteNudge() {
 try {
 if (localStorage.getItem(NUDGE_KEY) !== "never") localStorage.setItem(NUDGE_KEY, String(Date.now() + SNOOZE_MS));
 } catch {
 // Storage unavailable — it may show again next visit; harmless.
 }
}

export function dismissTasteNudge() {
 try {
 localStorage.setItem(NUDGE_KEY, "never");
 } catch {
 // As above.
 }
}
