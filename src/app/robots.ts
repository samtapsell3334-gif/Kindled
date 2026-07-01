import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Gated/operational surfaces stay out of search.
      disallow: ["/api/", "/admin/", "/investor"],
    },
    sitemap: "https://www.kindledgift.co.uk/sitemap.xml",
  };
}
