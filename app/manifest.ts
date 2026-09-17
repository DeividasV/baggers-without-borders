import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/src/config/site";

/**
 * The web app manifest is generated rather than served from `public/`, because a
 * static file cannot read the environment and the site name must not be
 * hard-coded. Next.js serves this at `/manifest.webmanifest`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: "Hiking and climbing community platform",
    start_url: "/",
    display: "standalone",
    background_color: "#1e2014",
    theme_color: "#9ca56e",
    orientation: "portrait-primary",
    categories: ["lifestyle", "sports", "travel"],
    lang: "en",
    icons: [
      { src: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { src: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { src: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { src: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-256x256.png", sizes: "256x256", type: "image/png" },
      { src: "/icon-384x384.png", sizes: "384x384", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Quick access to your dashboard",
        url: "/dashboard",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
