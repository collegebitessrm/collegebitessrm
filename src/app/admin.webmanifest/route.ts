import type { MetadataRoute } from "next";

// The admin app's own manifest, linked only from app/admin/layout.tsx. Its
// own id and scope make it a separate install from the student app (both can
// sit on one phone), and it opens straight on the dashboard. Served from
// outside /admin and excluded from the proxy matcher: browsers fetch
// manifests without cookies, so anything behind the sign-in redirect would
// come back as the login page's HTML.
export const dynamic = "force-static";

export function GET() {
 const manifest: MetadataRoute.Manifest = {
 id: "/admin",
 name: "College Bites Admin",
 short_name: "CB Admin",
 description: "College Bites operations — orders, menus and ordering switch.",
 start_url: "/admin",
 scope: "/admin",
 display: "standalone",
 background_color: "#fff8f0",
 theme_color: "#fff8f0",
 icons: [
 { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
 { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
 { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
 ],
 };
 return new Response(JSON.stringify(manifest), {
 headers: { "Content-Type": "application/manifest+json" },
 });
}
