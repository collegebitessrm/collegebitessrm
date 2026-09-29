"use client";

import { useSyncExternalStore } from "react";

// Short "saved"/"error" pop-ups, replacing inline text that used to appear
// and disappear next to whatever button triggered it. Same module-level
// singleton pattern as the cart and theme stores.

export type ToastKind = "success" | "error";
export type ToastItem = { id: number; kind: ToastKind; message: string };

const DURATIONS: Record<ToastKind, number> = { success: 2200, error: 3800 };
const EMPTY: ToastItem[] = [];

let toasts: ToastItem[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => dismiss(id), DURATIONS[kind]);
}

export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}
