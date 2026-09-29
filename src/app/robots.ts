import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Signed-out crawlers only ever reach /login, /privacy and /terms anyway
// (src/proxy.ts sends the rest to /login); the private areas are listed
// so nothing personal is ever crawled even if that changes. This file
// exists so /robots.txt itself is a real robots file instead of that
// redirect — it's excluded from the proxy matcher for the same reason.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/orders", "/profile", "/welcome"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
