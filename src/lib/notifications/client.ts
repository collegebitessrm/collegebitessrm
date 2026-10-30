"use client";

import { removeSubscription, saveSubscription } from "./actions";

/**
 * Browser side of notifications: register the service worker, ask for
 * permission, and hand the resulting subscription to the server.
 *
 * Everything here fails soft — a browser without push, a refused prompt or
 * an iPhone that hasn't installed the app all return a plain message the
 * UI can show, never an exception.
 */

export type PushState =
  | "granted" // on, for this browser
  | "default" // never asked
  | "denied" // blocked in browser settings, only the user can undo it
  | "ios-needs-install" // Safari only pushes from a Home Screen install
  | "unsupported";

function getCleanVapidKey(): string | null {
  const rawKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!rawKey) return null;
  const key = rawKey.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\s]/g, "");
  return key || null;
}

export function pushState(): PushState {
  if (typeof window === "undefined") return "unsupported";
  const iosLike = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installed = window.matchMedia("(display-mode: standalone)").matches || "standalone" in navigator;
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window) ||
    !getCleanVapidKey()
  ) {
    return iosLike && !installed ? "ios-needs-install" : "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return iosLike && !installed ? "ios-needs-install" : "default";
}

const MESSAGES: Record<Exclude<PushState, "granted" | "default">, string> = {
  denied: "Notifications are blocked for this site. Turn them back on in your browser settings.",
  "ios-needs-install": "On iPhone, add College Bites to your Home Screen first, then turn notifications on from there.",
  unsupported: "This browser can't show notifications.",
};

export async function enablePush(): Promise<{ ok: true } | { ok: false; error: string }> {
  const state = pushState();
  if (state !== "granted" && state !== "default") return { ok: false, error: MESSAGES[state] };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, error: "Notifications stay off until you allow them." };
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const key = getCleanVapidKey();
    if (!key) return { ok: false, error: "Notifications aren't set up on the server yet." };

    const targetKeyBytes = urlBase64ToUint8Array(key);
    let subscription = await registration.pushManager.getSubscription();

    // If an existing subscription exists, verify it matches our current VAPID key
    if (subscription) {
      let matches = false;
      if (subscription.options?.applicationServerKey) {
        const existingBytes = new Uint8Array(subscription.options.applicationServerKey);
        matches =
          existingBytes.length === targetKeyBytes.length &&
          existingBytes.every((val, i) => val === targetKeyBytes[i]);
      }
      if (!matches) {
        // Old VAPID key: unsubscribe to replace with the fresh key
        await subscription.unsubscribe().catch(() => {});
        subscription = null;
      }
    }

    // Subscribe freshly with the new key if not already subscribed to this key
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: targetKeyBytes,
      });
    }

    return await saveSubscription(subscription.toJSON(), navigator.userAgent);
  } catch (error) {
    console.error("enablePush failed", error);
    return { ok: false, error: "Couldn't turn notifications on. Please try again." };
  }
}

export async function disablePush(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return { ok: true };

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    return await removeSubscription(endpoint);
  } catch (error) {
    console.error("disablePush failed", error);
    return { ok: false, error: "Couldn't turn notifications off. Please try again." };
  }
}

/** True when this browser currently holds a valid subscription matching the current VAPID key. */
export async function hasPushSubscription(): Promise<boolean> {
  if (pushState() !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    if (!subscription) return false;

    const key = getCleanVapidKey();
    if (!key) return false;

    // Check if subscription was created with current key
    if (subscription.options?.applicationServerKey) {
      const targetKeyBytes = urlBase64ToUint8Array(key);
      const existingBytes = new Uint8Array(subscription.options.applicationServerKey);
      if (
        existingBytes.length !== targetKeyBytes.length ||
        !existingBytes.every((val, i) => val === targetKeyBytes[i])
      ) {
        return false; // Stale subscription from old key
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** The VAPID public key travels as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const clean = base64.trim().replace(/^["']|["']$/g, "").replace(/[\r\n\s]/g, "");
  const padded = (clean + "=".repeat((4 - (clean.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
