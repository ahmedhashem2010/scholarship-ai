import type { MetadataRoute } from "next";
import { SEO } from "@/lib/brand";

/**
 * robots.txt
 *
 * Public pages are crawlable; anything behind auth is not. `/dashboard`
 * would return login redirects to a crawler, which wastes crawl budget and
 * can surface an empty login page in results under a title that looks like
 * real content.
 *
 * Disallowing them is not a security control — it's housekeeping. The actual
 * protection is the middleware and the server-side auth guards.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api", "/auth", "/onboarding", "/profile"],
      },
    ],
    sitemap: `${SEO.siteUrl}/sitemap.xml`,
    host: SEO.siteUrl,
  };
}
