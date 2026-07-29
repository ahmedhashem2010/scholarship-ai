import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SEO } from "@/lib/brand";
import { visibleScholarshipWhere } from "@/lib/scholarship-filters";

/**
 * XML sitemap.
 *
 * Every visible scholarship gets its own URL. That's the whole SEO strategy:
 * nobody searches "scholarship platform", they search "fully funded masters
 * Germany 2026" — and a detail page per scholarship is what can rank for that.
 *
 * Only VISIBLE scholarships are listed. Submitting expired or hidden records
 * teaches Google that the site serves dead pages, which costs crawl budget on
 * the ones that matter.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SEO.siteUrl;

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/scholarships`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/glossary`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/success-stories`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const scholarships = await prisma.scholarship.findMany({
      where: visibleScholarshipWhere(),
      // NOTE: the Scholarship model has no createdAt/updatedAt. `verifiedAt` is
      // the only modification timestamp available, and it's null for the ~195
      // scraped records nobody has checked yet. Adding `updatedAt @updatedAt`
      // to the model would give Google a real lastModified signal — worth doing
      // on the next schema change, but not worth a migration on its own.
      select: { id: true, verifiedAt: true, isVerified: true },
      // Cap it. Google ignores sitemaps over 50,000 URLs, and an oversized one
      // is slower to fetch than it is useful.
      take: 5000,
      // Verified records first: they're the ones worth spending crawl budget on.
      orderBy: [{ isVerified: "desc" }, { deadline: "asc" }],
    });

    return [
      ...staticPages,
      ...scholarships.map((s) => ({
        url: `${base}/scholarships/${s.id}`,
        // Omitted rather than faked when unknown. A wrong lastModified is worse
        // than none — it teaches the crawler to distrust the whole sitemap.
        ...(s.verifiedAt ? { lastModified: s.verifiedAt } : {}),
        changeFrequency: "weekly" as const,
        // Human-verified entries are genuinely better pages, so they get the
        // higher priority.
        priority: s.isVerified ? 0.8 : 0.6,
      })),
    ];
  } catch (err) {
    // A database blip must not 500 the sitemap — Google treats repeated errors
    // as a reason to crawl less. Static pages alone is a fine degraded state.
    console.error("sitemap: scholarship query failed, serving static only:", err);
    return staticPages;
  }
}
