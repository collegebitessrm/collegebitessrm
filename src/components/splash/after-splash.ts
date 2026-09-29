/**
 * Runs `callback` once the startup splash is out of the way — straight
 * away if it isn't playing this load. For one-off moments that would
 * otherwise fire hidden underneath it (e.g. a milestone celebration on a
 * session that starts on Profile). Returns a cleanup function.
 */
export function afterSplash(callback: () => void): () => void {
  const html = document.documentElement;
  const playing = () => ["play", "run", "out"].includes(html.dataset.splash ?? "");
  if (!playing()) {
    callback();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (playing()) return;
    observer.disconnect();
    callback();
  });
  observer.observe(html, { attributes: true, attributeFilter: ["data-splash"] });
  return () => observer.disconnect();
}
