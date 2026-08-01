import type { MetadataRoute } from "next";

const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "atrum.fun";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // API routes have no content to index; /oath/[code] is a redirect-only
      // invite link, one per person — indexing those would just be crawl
      // budget spent on pages that immediately bounce to "/".
      disallow: ["/api/", "/oath/"],
    },
    sitemap: `https://${SITE_ORIGIN}/sitemap.xml`,
  };
}
