"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PALETTE, isPaletteId, PALETTE_GROUNDS, type PaletteId } from "./palettes";

// Theme preference lives in localStorage only — it's a per-device display
// setting, not account data, so it isn't stored in `public.users`.
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "collegebites.theme";
// First-time visitors follow their OS's light/dark setting. Only an
// explicit choice (the Appearance toggle) moves them off "system".
const DEFAULT: ThemePreference = "system";

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

// The browser/status bar colour follows the page ground of whatever palette
// and mode are actually showing (both theme-color metas, so the in-app
// Light/Dark override wins over the OS setting they're keyed on).
function syncBrowserBar() {
  const root = document.documentElement;
  const palette = root.getAttribute("data-palette");
  const grounds = PALETTE_GROUNDS[isPaletteId(palette) ? palette : DEFAULT_PALETTE];
  const color = root.classList.contains("dark") ? grounds.dark : grounds.light;
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

// ---------------------------------------------------------------------------
// Palette (Vice Dusk, Electric Sunrise, Innovation Hub, Kaapi) — independent
// of light/dark, also per device. The theme-init script sets data-palette
// before first paint; this keeps it in step afterwards.

const PALETTE_KEY = "collegebites.palette";

function readStoredPalette(): PaletteId {
  try {
    const v = localStorage.getItem(PALETTE_KEY);
    return isPaletteId(v) ? v : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

let currentPalette: PaletteId = DEFAULT_PALETTE;
let paletteLoaded = false;
const paletteListeners = new Set<() => void>();

function getPaletteSnapshot(): PaletteId {
  if (!paletteLoaded) {
    currentPalette = readStoredPalette();
    paletteLoaded = true;
  }
  return currentPalette;
}

function subscribePalette(listener: () => void) {
  paletteListeners.add(listener);
  return () => paletteListeners.delete(listener);
}

function applyPalette(palette: PaletteId) {
  document.documentElement.setAttribute("data-palette", palette);
  syncBrowserBar();
}

export function setPalette(palette: PaletteId) {
  currentPalette = palette;
  paletteLoaded = true;
  try {
    localStorage.setItem(PALETTE_KEY, palette);
  } catch {
    // Storage unavailable — the choice lasts for this page only.
  }
  // Same cross-fade as the Light/Dark toggle.
  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(() => applyPalette(palette));
  } else {
    applyPalette(palette);
  }
  paletteListeners.forEach((l) => l());
}

export function usePalette(): PaletteId {
  // The server (and the pre-hydration render) sees the default.
  return useSyncExternalStore(subscribePalette, getPaletteSnapshot, () => DEFAULT_PALETTE);
}
