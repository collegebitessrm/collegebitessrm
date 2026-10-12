"use client";

import { isSoundEnabled } from "./store";

/**
 * A short two-note chime synthesized with the Web Audio API — no audio
 * file to ship or download, just two oscillators with a quick gain
 * envelope so it stays subtle rather than a jarring beep.
 */
export function playOrderPlacedSound() {
 if (!isSoundEnabled()) return;

 try {
 const AudioContextCtor =
 window.AudioContext ??
 (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
 if (!AudioContextCtor) return;

 const ctx = new AudioContextCtor();
 const now = ctx.currentTime;

 [880, 1318.51].forEach((freq, i) => {
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 const start = now + i * 0.09;

 osc.type = "sine";
 osc.frequency.value = freq;
 gain.gain.setValueAtTime(0, start);
 gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
 gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);

 osc.connect(gain).connect(ctx.destination);
 osc.start(start);
 osc.stop(start + 0.3);
 });

 setTimeout(() => ctx.close(), 500);
 } catch {
 // Web Audio unavailable/blocked — the sound is a nice-to-have, fail silently.
 }
}

// The admin alert is deliberately not the student chime: a new order can
// arrive while the dashboard sits on a counter across the room, so it's
// loud, low-then-high, and repeats. It has its own on/off switch
// (localStorage) rather than following the student sound preference.
const ADMIN_SOUND_KEY = "collegebites.admin-alert-sound";

export function isAdminAlertSoundEnabled(): boolean {
 try {
 return localStorage.getItem(ADMIN_SOUND_KEY) !== "0";
 } catch {
 return true;
 }
}

export function setAdminAlertSoundEnabled(enabled: boolean) {
 try {
 localStorage.setItem(ADMIN_SOUND_KEY, enabled ? "1" : "0");
 } catch {
 // Storage unavailable — the choice just won't persist.
 }
}

let adminContext: AudioContext | null = null;

function adminAudioContext(): AudioContext | null {
 const Ctor =
 typeof window === "undefined"
 ? undefined
 : (window.AudioContext ??
 (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
 if (!Ctor) return null;
 adminContext ??= new Ctor();
 return adminContext;
}

/**
 * Unlocks audio from a real tap — browsers refuse to play anything until
 * then, and a new order can arrive long after the dashboard was opened.
 * Call this from the alert button's click handler.
 */
export function armAdminAlertSound(): void {
 adminAudioContext()?.resume().catch(() => {});
}

/** Three loud two-tone bursts — about 1.6 seconds. */
export function playAdminAlertSound() {
 if (!isAdminAlertSoundEnabled()) return;

 try {
 const ctx = adminAudioContext();
 if (!ctx) return;
 void ctx.resume().catch(() => {});
 const now = ctx.currentTime;

 for (let burst = 0; burst < 3; burst++) {
 [660, 990].forEach((freq, i) => {
 const osc = ctx.createOscillator();
 const gain = ctx.createGain();
 const start = now + burst * 0.52 + i * 0.16;

 // Square wave carries across a noisy kitchen far better than a sine.
 osc.type = "square";
 osc.frequency.value = freq;
 gain.gain.setValueAtTime(0, start);
 gain.gain.linearRampToValueAtTime(0.5, start + 0.01);
 gain.gain.setValueAtTime(0.5, start + 0.12);
 gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

 osc.connect(gain).connect(ctx.destination);
 osc.start(start);
 osc.stop(start + 0.2);
 });
 }
 } catch {
 // Web Audio unavailable/blocked — the notification and badge still show.
 }
}
