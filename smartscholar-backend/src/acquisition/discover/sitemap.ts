import { fetchText } from '../../shared/http';
import { withRetry } from '../retry';
import { logger } from '../logging';

const SITEMAP_RE = /<loc>([^<]+)<\/loc>/g;

/**
 * Fetch and parse a sitemap (or sitemap index, recursively) returning all URLs.
 * If the URL ends in .xml or .gz it is treated as a sitemap; otherwise attempts
 * /sitemap.xml on the host.
 */
export async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 3) return [];
  const url = sitemapUrl.trim();
  const isIndexLike = /\.xml($|\?)|\.gz($|\?)/.test(url);
  const target = isIndexLike ? url : sitemapUrl;
  let text: string;
  try {
    const res = await withRetry(
      () => fetchText(target, { timeoutMs: 20_000 }),
      { retries: 2, label: `sitemap ${target}` },
    );
    if (res.status !== 200) {
      logger.warn('discover/sitemap', `non-200 (${res.status}) for ${target}`);
      return [];
    }
    text = res.text;
  } catch (err) {
    logger.warn('discover/sitemap', `failed ${target}: ${err instanceof Error ? err.message : err}`);
    return [];
  }

  const locs: string[] = [];
  for (const m of text.matchAll(SITEMAP_RE)) {
    const loc = m[1].replace(/&amp;/g, '&');
    if (/\.xml($|\?)|\.gz($|\?)/.test(loc) && depth < 3) {
      const nested = await fetchSitemapUrls(loc, depth + 1);
      locs.push(...nested);
    } else {
      locs.push(loc);
    }
  }
  return locs;
}
