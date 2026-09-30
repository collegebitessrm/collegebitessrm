import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "College Bites",
    short_name: "College Bites",
    description: "Crave. Click. Campus. Food delivery for SRM University AP students.",
    start_url: "/",
    display: "standalone",
    // Android's own launch screen (this colour + the icon) hands straight
    // over to the in-app splash, which uses the same golden-hour sand.
    background_color: "#fff5ee",
    theme_color: "#fff5ee",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
