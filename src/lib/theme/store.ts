"use client";

import { useSyncExternalStore } from "react";

// Theme preference lives in localStorage only — it's a per-device display
// setting, not account data, so it isn't stored in `public.users`.
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "mutebites.theme";
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
  applyToDocument(pref);
  watchSystemChanges(pref);
  listeners.forEach((l) => l());
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
