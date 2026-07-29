import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BRAND, SEO } from "@/lib/brand";

/**
 * Per-scholarship metadata.
 *
 * The page itself is a client component (it runs the roadmap generator against
 * the signed-in user's profile), and client components can't export metadata.
 * This layout is the server-side wrapper that can.
 *
 * WHY THIS IS THE HIGHEST-VALUE SEO ON THE SITE
 * Nobody searches "scholarship platform". They search "fully funded masters
 * Germany 2026" or "منحة بدون ايلتس". Each scholarship detail page is a shot at
 * one of those queries — but only if it has its own title and description.
 * Without this, all 234 pages inherit the site-wide title and Google treats
 * them as duplicates of each other.
 */

interface Props {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const s = await prisma.scholarship.findUnique({
      where: { id: params.id },
      select: {
        nameEn: true, nameAr: true, country: true, university: true,
        degree: true, description: true, deadline: true, isActive: true,
      },
    });

    if (!s) return { title: "Scholarship not found" };

    // Arabic first — that's the audience and the default page language.
    const title = s.nameAr || s.nameEn;
    const bits = [s.country, s.university, s.degree].filter(Boolean).join(" · ");
    const description =
      (s.description?.slice(0, 150).trim() ||
        `${title} — ${bits}. ${BRAND.descriptionAr}`).replace(/\s+/g, " ");

    const url = `${SEO.siteUrl}/scholarships/${params.id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "article",
        siteName: BRAND.name,
        images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
      },
      twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
      // An expired or hidden scholarship stays reachable by direct link but
      // shouldn't be indexed — a search result that leads to a dead deadline is
      // exactly the experience the product exists to prevent.
      robots: s.isActive === false ? { index: false, follow: true } : undefined,
    };
  } catch (err) {
    console.error("generateMetadata failed for", params.id, err);
    return { title: BRAND.name };
  }
}

export default function ScholarshipLayout({ children }: Props) {
  return <>{children}</>;
}
