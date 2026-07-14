import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/authenticated areas add no SEO value and shouldn't be crawled.
      disallow: ["/api/", "/admin/", "/dashboard/", "/settings/", "/onboarding/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
