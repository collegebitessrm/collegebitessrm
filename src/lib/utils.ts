import { createCn } from "cn/config";

// The app's named type sizes (globals.css: text-display / -headline /
// -title / -label) must be known as font sizes. Unregistered, the merger
// takes `text-label` for a text colour, so `cn("text-label
// text-muted-foreground", …)` silently dropped the size.
export const cn = createCn({
 extend: { classGroups: { "font-size": [{ text: ["display", "headline", "title", "label"] }] } },
});
