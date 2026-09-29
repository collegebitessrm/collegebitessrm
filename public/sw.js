/*
 * College Bites service worker — notifications only.
 *
 * Deliberately has no fetch handler: it caches nothing and never stands
 * between the app and the network, so it can't serve a stale page or
 * interfere with Next.js's own routing. All it does is show pushes and
 * open the right page when one is tapped.
 *
 * Registered by src/lib/notifications/client.ts when someone turns
 * notifications on; payloads are built in src/lib/notifications/send.ts.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // A push with no (or unreadable) payload still deserves something visible.
  }

  const title = data.title || "College Bites";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icons/icon-192",
      badge: "/icons/icon-192",
      // One notification per order: a later update for the same order
      // replaces the earlier one instead of stacking up.
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      // Admin alerts stay on screen until they're dealt with.
      requireInteraction: Boolean(data.requireInteraction),
      vibrate: data.vibrate || [180, 90, 180],
      silent: false,
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      // Already looking at that page? Just bring it forward.
      const onTarget = windows.find((c) => new URL(c.url).pathname === target.pathname);
      if (onTarget) return onTarget.focus();
      const open = windows[0];
      if (open) {
        await open.focus();
        return open.navigate(target.href);
      }
      return self.clients.openWindow(target.href);
    })(),
  );
});
