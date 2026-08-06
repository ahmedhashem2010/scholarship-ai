/**
 * Relevance-aware site crawler for deep extraction.
 *
 * Starting from the scholarship's own page(s), fetches a bounded set of pages
 * from the same host, keeps only pages likely to carry scholarship facts
 * (apply / eligibility / funding / FAQ / guide / documents / contact / etc.)
 * and discards noise (news, blog, press, privacy, cookies, alumni, marketing).
 * PDF/DOC/DOCX links are detected separately so they can be downloaded.
 */

import * as cheerio from 'cheerio';
import { URL } from 'node:url';
import { fetchText } from '../shared/http';
import { stripHtml, cleanLines } from '../shared/text';
import { withRetry } from '../acquisition/retry';
import { logger } from '../acquisition/logging';
import { fetchSitemapUrls } from '../acquisition/discover/sitemap';
import { CrawlResult, CrawledPage, DocKind } from './types';

const RELEVANT_WORDS = [
  'scholarship', 'grant', 'fellowship', 'bourse', 'stipend', 'funding', 'financial',
  'apply', 'application', 'admission', 'eligibility', 'requirements', 'documents',
  'download', 'handbook', 'guideline', 'guide', 'faq', 'frequently-asked',
  'regulations', 'rules', 'call-for', 'programme', 'master', 'phd', 'doctoral',
  'research', 'contact', 'international', 'intake', 'deadline', 'calendar', 'benefits',
  'how-to-apply', 'applying', 'study', 'scholarships', 'funded',
];

const IRRELEVANT_WORDS = [
  'news', 'blog', 'press', 'media-center', 'privacy', 'cookies', 'cookie-policy',
  'alumni', 'marketing', 'careers', 'jobs', 'events', 'webinar', 'login', 'register',
  'signup', 'account', 'cart', 'checkout', 'terms-of-service', 'imprint',
  'about-us', 'our-team', 'partners', 'sponsors', 'gallery', 'testimonials',
];

const RELEVANT_TITLE_RE =
  /\b(scholarship|scholarships|fellowship|grant|funding|financial support|eligibility|eligible|admission|admissions|requirements|how to apply|application|faq|frequently asked|handbook|guide|call for|deadline|apply now|documents|stipend)\b/i;
const IRRELEVANT_TITLE_RE =
  /\b(news|blog|press release|press|events|webinar|privacy|cookie|cookies|alumni|careers|jobs|marketing|about us|our team|partners|sponsors)\b/i;

export interface CrawlOptions {
  /** Maximum pages fetched per crawl. */
  maxPages?: number;
  /** Maximum links scanned while crawling. */
  maxLinks?: number;
  /** Maximum crawl depth from a seed. */
  maxDepth?: number;
  /** Concurrency for page fetches. */
  concurrency?: number;
  /** Max characters kept per page. */
  maxPageChars?: number;
  /** Whether to use the host sitemap as a link source. */
  useSitemap?: boolean;
  /** Extra roots to crawl (e.g. provider site). */
  extraRoots?: string[];
}

const DEFAULT_OPTS: Required<CrawlOptions> = {
  maxPages: 10,
  maxLinks: 300,
  maxDepth: 2,
  concurrency: 3,
  maxPageChars: 12_000,
  useSitemap: true,
  extraRoots: [],
};

function isDocUrl(u: string): DocKind | null {
  const clean = u.split('?')[0]!.toLowerCase();
  if (clean.endsWith('.pdf')) return 'pdf';
  if (clean.endsWith('.docx')) return 'docx';
  if (clean.endsWith('.doc')) return 'doc';
  return null;
}

function hostOf(u: string): string | null {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function urlScore(u: string): number {
  const path = u.toLowerCase().split('?')[0]!;
  let score = 0;
  for (const w of RELEVANT_WORDS) {
    if (path.includes(w.replace(/ /g, '-'))) score += 1;
  }
  for (const w of IRRELEVANT_WORDS) {
    if (path.includes(w)) score -= 3;
  }
  return score;
}

function anchorScore(text: string): number {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  if (RELEVANT_TITLE_RE.test(t)) return 2;
  if (IRRELEVANT_TITLE_RE.test(t)) return -2;
  return 0;
}

function isIrrelevant(u: string, title: string | null): boolean {
  const path = u.toLowerCase().split('?')[0]!;
  if (IRRELEVANT_WORDS.some((w) => path.includes(w))) return true;
  if (title && IRRELEVANT_TITLE_RE.test(title)) return true;
  return false;
}

function pageText(html: string, maxChars: number): string {
  const $ = cheerio.load(html);
  $('script, style, noscript, nav, footer, header, aside, form, button, iframe').remove();
  const body = $('body').text() ?? '';
  return cleanLines(stripHtml(body)).slice(0, maxChars);
}

interface QueueItem {
  url: string;
  depth: number;
  score: number;
}

/** Extract absolute same-host links (and doc links) from a page. */
function extractLinks(html: string, pageUrl: string): { pageUrls: Map<string, number>; docUrls: Set<string> } {
  const $ = cheerio.load(html);
  const base = $('base[href]').attr('href') ?? pageUrl;
  const host = hostOf(pageUrl);
  const pageUrls = new Map<string, number>();
  const docUrls = new Set<string>();
  $('a[href]').each((_i, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href || /^(mailto:|tel:|javascript:|data:|#)/.test(href.trim())) return;
    try {
      const abs = new URL(href, base).toString();
      if (hostOf(abs) !== host) return;
      const anchor = $(el).text().trim();
      const kind = isDocUrl(abs);
      if (kind) {
        docUrls.add(abs);
        return;
      }
      if (isIrrelevant(abs, null)) return;
      const score = urlScore(abs) + anchorScore(anchor);
      if (score < 0) return;
      const existing = pageUrls.get(abs) ?? -999;
      if (score > existing) pageUrls.set(abs, score);
    } catch {
      /* malformed href */
    }
  });
  return { pageUrls, docUrls };
}

async function fetchPage(url: string): Promise<{ ok: boolean; html: string; finalUrl: string; status: number }> {
  try {
    const res = await withRetry(() => fetchText(url, { timeoutMs: 15_000 }), {
      retries: 1,
      label: `deep-crawl ${url}`,
    });
    return { ok: res.status === 200, html: res.text, finalUrl: res.finalUrl, status: res.status };
  } catch (err) {
    logger.warn('deep/crawl', `fetch failed for ${url}: ${err instanceof Error ? err.message : err}`);
    return { ok: false, html: '', finalUrl: url, status: 0 };
  }
}

/**
 * Crawl scholarship-relevant pages from seed URL(s), bounded and same-host only.
 * The seed page(s) always come first (relevance 1.0).
 */
export async function crawlSite(seeds: string[], opts: CrawlOptions = {}): Promise<CrawlResult> {
  const cfg = { ...DEFAULT_OPTS, ...opts };
  const roots = [...seeds, ...cfg.extraRoots].filter((u) => /^https?:\/\//.test(u));
  const errors: string[] = [];
  const pages: CrawledPage[] = [];
  const docs: CrawlResult['docs'] = [];
  const seenDocs = new Set<string>();

  const allowedHosts = new Set<string>();
  for (const r of roots) {
    const h = hostOf(r);
    if (h) allowedHosts.add(h);
  }

  // Seed pages first.
  for (const seed of roots) {
    const host = hostOf(seed);
    if (!host || !allowedHosts.has(host)) continue;
    const fetch = await fetchPage(seed);
    if (!fetch.ok) {
      errors.push(`${seed} (HTTP ${fetch.status || 'fetch error'})`);
      continue;
    }
    const $ = cheerio.load(fetch.html);
    const title = $('title').text().trim() || null;
    const text = pageText(fetch.html, cfg.maxPageChars);
    const hasContent = text.replace(/\s+/g, '').length > 200;
    if (hasContent) {
      pages.push({ url: fetch.finalUrl || seed, title, text, relevance: 1 });
    } else {
      errors.push(`${seed} (no extractable content)`);
    }
    const { docUrls } = extractLinks(fetch.html, fetch.finalUrl || seed);
    for (const u of docUrls) {
      if (!seenDocs.has(u)) {
        seenDocs.add(u);
        docs.push({ url: u, kind: isDocUrl(u)!, title: null, text: '', pageCount: 0, error: null });
      }
    }
    if (pages.length >= cfg.maxPages) break;
  }

  // Optional sitemap breadth for the primary host.
  if (cfg.useSitemap) {
    const primaryHost = roots.length > 0 ? hostOf(roots[0]!) : null;
    if (primaryHost) {
      try {
        const urls = await fetchSitemapUrls(`https://${primaryHost}/sitemap.xml`);
        for (const u of urls) {
          if (hostOf(u) !== primaryHost) continue;
          const kind = isDocUrl(u);
          if (kind) {
            if (!seenDocs.has(u)) {
              seenDocs.add(u);
              docs.push({ url: u, kind, title: null, text: '', pageCount: 0, error: null });
            }
            continue;
          }
        }
      } catch {
        /* sitemap optional */
      }
    }
  }

  // BFS pool built from seeds.
  const queue: QueueItem[] = [];
  const enqueued = new Set<string>();
  for (const r of roots) {
    const h = hostOf(r);
    if (h && allowedHosts.has(h) && !enqueued.has(r)) {
      enqueued.add(r);
      queue.push({ url: r, depth: 0, score: 100 });
    }
  }

  const fetched = new Set<string>();
  let fetchedCount = 0;

  while (queue.length > 0 && fetchedCount < cfg.maxPages && pages.length < cfg.maxPages) {
    const batch = queue
      .sort((a, b) => b.score - a.score)
      .splice(0, cfg.concurrency);
    const results = await Promise.all(
      batch.map(async (item) => {
        if (fetched.has(item.url)) return null;
        fetched.add(item.url);
        const fetch = await fetchPage(item.url);
        if (!fetch.ok) return null;
        const $ = cheerio.load(fetch.html);
        const title = $('title').text().trim() || null;
        if (isIrrelevant(fetch.finalUrl || item.url, title)) return null;
        const text = pageText(fetch.html, cfg.maxPageChars);
        if (text.replace(/\s+/g, '').length < 200) return null;
        return { fetch, item, title, text };
      }),
    );

    for (const r of results) {
      if (!r) continue;
      fetchedCount += 1;
      const finalUrl = r.fetch.finalUrl || r.item.url;
      pages.push({ url: finalUrl, title: r.title, text: r.text, relevance: Math.min(1, Math.max(0, r.item.score) / 12 + 0.2) });
      if (pages.length >= cfg.maxPages) break;

      if (r.item.depth < cfg.maxDepth) {
        const { pageUrls, docUrls } = extractLinks(r.fetch.html, finalUrl);
        for (const u of docUrls) {
          if (!seenDocs.has(u)) {
            seenDocs.add(u);
            docs.push({ url: u, kind: isDocUrl(u)!, title: null, text: '', pageCount: 0, error: null });
          }
        }
        for (const [u, score] of pageUrls) {
          if (enqueued.has(u) || fetched.has(u)) continue;
          if (enqueued.size >= cfg.maxLinks) break;
          enqueued.add(u);
          queue.push({ url: u, depth: r.item.depth + 1, score });
        }
      }
    }
  }

  // Seed pages first, then by relevance; dedupe by URL.
  const seen = new Set<string>();
  const keptPages = pages
    .filter((p) => (seen.has(p.url) ? false : (seen.add(p.url), true)))
    .slice(0, cfg.maxPages);

  return { pages: keptPages, docs: docs.slice(0, 8), errors };
}
