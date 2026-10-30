"use client";

import { useSyncExternalStore } from "react";

// Theme preference lives in localStorage only — it's a per-device display
// setting, not account data, so it isn't stored in `public.users`.
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "collegebites.theme";
// Default theme is light. Users can explicitly switch to dark or system in settings.
const DEFAULT: ThemePreference = "light";

function isValid(v: unknown): v is ThemePreference {
 return v === "light" || v === "dark" || v === "system";
}

function readStored(): ThemePreference {
 try {
 const v = localStorage.getItem(STORAGE_KEY);
 return isValid(v) ? v : DEFAULT;
 } catch {
 return DEFAULT;
 }
}

function systemPrefersDark(): boolean {
 return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolvesToDark(pref: ThemePreference): boolean {
 return pref === "dark" || (pref === "system" && systemPrefersDark());
}

function applyToDocument(pref: ThemePreference) {
 const dark = resolvesToDark(pref);
 document.documentElement.classList.toggle("dark", dark);
 document.documentElement.style.colorScheme = dark ? "dark" : "light";
 syncBrowserBar();
}

// The browser/status bar colour follows the page ground.
function syncBrowserBar() {
 const root = document.documentElement;
 const isDark = root.classList.contains("dark");
 const color = isDark ? "#1c1c1c" : "#ffffff";
 document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
}

let current: ThemePreference = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function getSnapshot(): ThemePreference {
 if (!loaded) {
 current = readStored();
 loaded = true;
 }
 return current;
}

// Server (and the pre-hydration client render) always "sees" the default —
// matches what's rendered before the blocking theme script or this store
// has run. Prevents a hydration mismatch on the toggle's selected state.
function getServerSnapshot(): ThemePreference {
 return DEFAULT;
}

let stopWatchingSystem: (() => void) | null = null;

function watchSystemChanges(pref: ThemePreference) {
 stopWatchingSystem?.();
 stopWatchingSystem = null;
 if (pref !== "system" || typeof window === "undefined") return;

 const mq = window.matchMedia("(prefers-color-scheme: dark)");
 const onChange = () => applyToDocument(current);
 mq.addEventListener("change", onChange);
 stopWatchingSystem = () => mq.removeEventListener("change", onChange);
}

function subscribe(listener: () => void) {
 listeners.add(listener);
 // Re-apply on (re)subscribe too — covers hydration and fast refresh,
 // where the module may have been re-evaluated without a setTheme() call.
 applyToDocument(getSnapshot());
 watchSystemChanges(getSnapshot());
 return () => listeners.delete(listener);
}

export function setTheme(pref: ThemePreference) {
 current = pref;
 loaded = true;
 try {
 localStorage.setItem(STORAGE_KEY, pref);
 } catch {
 // Storage unavailable (private mode) — the choice just won't persist.
 }
 // A short cross-fade between themes when the student taps the toggle
 // (the browser's own root view transition; globals.css collapses it to
 // instant under reduced motion). Falls back to an instant switch.
 if (typeof document.startViewTransition === "function") {
 document.startViewTransition(() => applyToDocument(pref));
 } else {
 applyToDocument(pref);
 }
 watchSystemChanges(pref);
 listeners.forEach((l) => l());
}

export function useThemePreference(): ThemePreference {
 return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Palette system removed — single clean theme now.
// These stubs keep imports working during the transition.
export function setPalette() {}
export function usePalette() {
 return "default" as const;
}
