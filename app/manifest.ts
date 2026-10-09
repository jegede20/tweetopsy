import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tweetopsy — Virality forensics",
    short_name: "Tweetopsy",
    description: "Inspect the writing mechanics behind a tweet.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EFE6",
    theme_color: "#F3EFE6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
