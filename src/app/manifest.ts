import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MuteBites",
    short_name: "MuteBites",
    description: "Good food. Campus mood. Food delivery for VIT-AP students.",
    start_url: "/",
    display: "standalone",
    // Android's own launch screen (this colour + the icon) hands straight
    // over to the in-app splash, which uses the same ivory.
    background_color: "#f5eae1",
    theme_color: "#faf3ec",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
