import * as cheerio from 'cheerio';
import { fetchText } from '../../shared/http';
import { withRetry } from '../retry';
import { logger } from '../logging';
import { URL } from 'node:url';

export interface ListCrawlOptions {
  /** URL pattern a candidate link href must match (substring) to be included. */
  urlPatterns: string[];
  /** Href substrings that disqualify a link (login, print, pdf, etc.). */
  excludePatterns?: string[];
  /** Max candidate links returned. */
  maxLinks?: number;
  /** Whether to follow "next" pagination. */
  paginate?: boolean;
  /** Number of pages to crawl when paginating. */
  maxPages?: number;
  /** Concurrency for fetching pages. */
  concurrency?: number;
}

const DEFAULT_EXCLUDES = [
  '/login', '/register', '/signup', '/sign-in', '/sign-up', '/account',
  '/cart', '/checkout', '/print', '/pdf', '.pdf', 'javascript:', '#',
  '/privacy', '/terms', '/imprint', '/newsletter', '/cookie',
];

/**
 * Crawl a list page, collect links matching the urlPatterns, optionally
 * following pagination via a "next" link. Returns deduped absolute URLs.
 */
export async function crawlList(startUrl: string, opts: ListCrawlOptions): Promise<string[]> {
  const {
    urlPatterns,
    excludePatterns = DEFAULT_EXCLUDES,
    maxLinks = 500,
    paginate = true,
    maxPages = 10,
  } = opts;

  const seen = new Set<string>();
  const pagesToVisit = [startUrl];
  let visited = 0;
  const concurrency = opts.concurrency ?? 3;

  const matches = (href: string): boolean =>
    urlPatterns.some((p) => href.includes(p)) &&
    !excludePatterns.some((ex) => href.includes(ex));

  while (pagesToVisit.length > 0 && visited < maxPages && seen.size < maxLinks) {
    const batch = pagesToVisit.splice(0, concurrency);
    const results = await Promise.all(
      batch.map(async (pageUrl) => {
        let text = '';
        try {
          const res = await withRetry(() => fetchText(pageUrl, { timeoutMs: 20_000 }), {
            retries: 1,
            label: `list ${pageUrl}`,
          });
          if (res.status !== 200) return { links: [] as string[], next: null as string | null };
          text = res.text;
        } catch (err) {
          logger.warn('discover/list', `failed ${pageUrl}: ${err instanceof Error ? err.message : err}`);
          return { links: [] as string[], next: null as string | null };
        }
        const $ = cheerio.load(text);
        const base = $('base[href]').attr('href') ?? pageUrl;
        const links: string[] = [];
        $('a[href]').each((_i, el) => {
          const href = $(el).attr('href') ?? '';
          if (!href || href.trim().length === 0) return;
          try {
            const absolute = new URL(href, base).toString();
            if (!matches(absolute)) return;
            if (seen.has(absolute)) return;
            seen.add(absolute);
            links.push(absolute);
          } catch {
            /* ignore malformed */
          }
        });
        let next: string | null = null;
        if (paginate) {
          const nextSel = $('a[rel="next"]').first().attr('href')
            ?? $('a:contains("Next")').filter((_i, el) => {
                const t = $(el).text().trim();
                return /^(next|التالي|more|التالي )/i.test(t);
              }).first().attr('href')
            ?? $('.pagination a[aria-label="Next"], .pager-next a, a[rel="next page"]').first().attr('href');
          if (nextSel) {
            try {
              const abs = new URL(nextSel, pageUrl).toString();
              if (!seen.has(abs) && !pagesToVisit.includes(abs)) next = abs;
            } catch {
              /* ignore */
            }
          }
        }
        return { links, next };
      }),
    );
    visited += batch.length;
    for (const r of results) {
      if (r.next) pagesToVisit.push(r.next);
    }
  }

  logger.info('discover/list', `crawled ${visited} page(s), found ${seen.size} links from ${startUrl}`);
  return [...seen].slice(0, maxLinks);
}
