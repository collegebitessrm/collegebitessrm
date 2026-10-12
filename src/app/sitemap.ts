import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * Only pages a signed-out visitor (and so a search engine) can actually
 * load: everything else redirects to /login (src/proxy.ts). Served at
 * /sitemap.xml, excluded from the proxy matcher like robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
 return [
 { url: `${SITE_URL}/login`, changeFrequency: "weekly", priority: 1 },
 { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
 { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
 ];
}
