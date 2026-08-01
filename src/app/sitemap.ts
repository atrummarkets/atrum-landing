import type { MetadataRoute } from "next";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "atrum.fun";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `https://${SITE_ORIGIN}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
