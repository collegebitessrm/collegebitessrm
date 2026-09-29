"use client";

import { useSyncExternalStore } from "react";

// Order-placed sound preference lives in localStorage only — it's a
// per-device setting, not account data, so it isn't stored in `public.users`.
const STORAGE_KEY = "mutebites.sound-enabled";
const DEFAULT = true;

function readStored(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? DEFAULT : v === "1";
  } catch {
    return DEFAULT;
  }
}

let current = DEFAULT;
let loaded = false;
const listeners = new Set<() => void>();

function getSnapshot(): boolean {
  if (!loaded) {
    current = readStored();
    loaded = true;
  }
  return current;
}

// Server (and the pre-hydration client render) always "sees" the default —
// matches what's rendered before this store has run, avoiding a hydration
// mismatch on the toggle's initial state.
function getServerSnapshot(): boolean {
  return DEFAULT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSoundEnabled(enabled: boolean) {
  current = enabled;
  loaded = true;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // Storage unavailable (private mode) — the choice just won't persist.
  }
  listeners.forEach((l) => l());
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Non-reactive read for one-off checks outside a component (e.g. before playing a sound). */
export function isSoundEnabled(): boolean {
  return getSnapshot();
}
