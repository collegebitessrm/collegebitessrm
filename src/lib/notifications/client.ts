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

export function pushState(): PushState {
  if (typeof window === "undefined") return "unsupported";
  const iosLike = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const installed = window.matchMedia("(display-mode: standalone)").matches || "standalone" in navigator;
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return iosLike && !installed ? "ios-needs-install" : "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return iosLike && !installed ? "ios-needs-install" : "default";
}

const MESSAGES: Record<Exclude<PushState, "granted" | "default">, string> = {
  denied: "Notifications are blocked for this site — turn them back on in your browser settings.",
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

    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key) return { ok: false, error: "Notifications aren't set up on the server yet." };

    // Reuse the existing subscription when there is one: the browser keeps
    // it across visits, and subscribing again with the same key returns it.
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }));

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

/** True when this browser currently holds a subscription (permission alone isn't enough). */
export async function hasPushSubscription(): Promise<boolean> {
  if (pushState() !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(await registration?.pushManager.getSubscription());
  } catch {
    return false;
  }
}

/** The VAPID public key travels as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}
