/**
 * Deterministic link resolution for a scholarship's external URLs.
 *
 * The bug this exists to prevent: most records were scraped from for9a.com and
 * their `sourceUrl` is a for9a *listing* page. The detail page used to render
 * that link as "Official page", which is a fabrication — the aggregator page is
 * not the scholarship's website and might even be wrong. So every external link
 * is classified here, once, into:
 *
 *   - an official action: the scholarship's own application link, else its
 *     official website — the two URLs we can honestly call official; and
 *   - a provenance link: the page where the record was actually found. When
 *     that page is an aggregator (for9a.com) it is labelled as a listing, and
 *     is NEVER presented as "official".
 *
 * Pure and deterministic: same input → same output, which keeps it unit
 * testable and guarantees the frontend can never re-derive a label that calls
 * an aggregator "official".
 */

/** Hosts that aggregate/republish listings and must never be shown as official. */
export const AGGREGATOR_HOSTS = new Set(["for9a.com", "for9a.org"]);

/** Human brand name used in labels, keyed by normalized (non-www) host. */
export const AGGREGATOR_LABELS: Record<string, string> = {
  "for9a.com": "For9a",
  "for9a.org": "For9a",
};

/** Normalized (lowercase, no leading "www.") hostname, or null for garbage. */
export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

/** True when the URL points at a known aggregator/listing host. */
export function isAggregatorUrl(url: string | null | undefined): boolean {
  const host = hostOf(url);
  if (!host) return false;
  // Array.from: the tsconfig target predates Set iteration without a flag.
  for (const agg of Array.from(AGGREGATOR_HOSTS)) {
    const normalized = agg.replace(/^www\./i, "");
    if (host === normalized || host.endsWith("." + normalized)) return true;
  }
  return false;
}

export type SourceLinkKind = "apply" | "official" | "aggregator-listing" | "source-page";

export interface SourceLink {
  href: string;
  /** Deterministic English label; the UI localizes it by `kind`. */
  label: string;
  kind: SourceLinkKind;
  isOfficial: boolean;
}

export interface SourceLinkResolution {
  /** Strongest official action available: apply link, else official website. */
  primary: SourceLink | null;
  /** Provenance link — the page the record was found on (may be an aggregator). */
  source: SourceLink | null;
  /** True when a genuine official URL (not an aggregator) is available. */
  hasOfficial: boolean;
}

export function resolveSourceLinks(opts: {
  sourceUrl: string | null | undefined;
  officialWebsite: string | null | undefined;
  applicationUrl: string | null | undefined;
}): SourceLinkResolution {
  const { sourceUrl, officialWebsite, applicationUrl } = opts;

  let primary: SourceLink | null = null;
  if (applicationUrl) {
    primary = { href: applicationUrl, label: "Apply on the official website", kind: "apply", isOfficial: true };
  } else if (officialWebsite) {
    primary = { href: officialWebsite, label: "Official website", kind: "official", isOfficial: true };
  }

  let source: SourceLink | null = null;
  if (sourceUrl) {
    if (isAggregatorUrl(sourceUrl)) {
      const host = hostOf(sourceUrl) ?? "";
      const brand = AGGREGATOR_LABELS[host] ?? host;
      source = {
        href: sourceUrl,
        label: `View listing on ${brand}`,
        kind: "aggregator-listing",
        isOfficial: false,
      };
    } else {
      source = {
        href: sourceUrl,
        label: "View source page",
        kind: "source-page",
        isOfficial: false,
      };
    }
  }

  return { primary, source, hasOfficial: primary !== null && primary.isOfficial };
}
