"use client";

// Whether this browser can install the app right now, and how:
// - "prompt": Chrome / Edge / Samsung Internet fired `beforeinstallprompt`,
// so one tap opens the browser's own install dialog.
// - "ios": iPhone / iPad, where there's no prompt API — the steps are
// Share → Add to Home Screen, so we show those instead.
// - "none": already installed (running standalone), or a browser that
// can't install (Firefox desktop) or hasn't offered it yet.
export type InstallMode = "prompt" | "ios" | "none";

type InstallPromptEvent = Event & {
 prompt: () => Promise<void>;
 userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function isStandalone() {
 return (
 window.matchMedia("(display-mode: standalone)").matches ||
 (navigator as Navigator & { standalone?: boolean }).standalone === true
 );
}

function isIos() {
 return (
 /iPad|iPhone|iPod/.test(navigator.userAgent) ||
 // iPadOS reports itself as a Mac.
 (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
 );
}

// Registered when this module first loads (with the admin header), not in an
// effect: the event fires once, soon after load, and isn't repeated.
if (typeof window !== "undefined") {
 window.addEventListener("beforeinstallprompt", (e) => {
 // Our button replaces Chrome's own mini-infobar.
 e.preventDefault();
 deferred = e as InstallPromptEvent;
 notify();
 });
 window.addEventListener("appinstalled", () => {
 installed = true;
 deferred = null;
 notify();
 });
}

export function subscribeInstall(listener: () => void) {
 listeners.add(listener);
 return () => listeners.delete(listener);
}

export function getInstallMode(): InstallMode {
 if (installed || isStandalone()) return "none";
 if (deferred) return "prompt";
 return isIos() ? "ios" : "none";
}

export const getServerInstallMode = (): InstallMode => "none";

/** Opens the browser's install dialog (mode "prompt" only). */
export async function promptInstall() {
 const event = deferred;
 if (!event) return;
 // A prompt event works once; Chrome fires a fresh one if it's dismissed.
 deferred = null;
 notify();
 await event.prompt();
 await event.userChoice;
}
