import { PrismaClient } from '@prisma/client';
import { ProviderAdapter, ImportSummary, DiscoveredPage } from './types';
import { fetchText } from '../shared/http';
import { normalizeScholarship } from './normalizers';
import { importScholarships } from './importers';
import { logger } from './logging';
import { isExcludedUrl } from './validators';

export interface PipelineOptions {
  maxItems?: number;
  dryRun?: boolean;
  updateExisting?: boolean;
  fetchConcurrency?: number;
  /** Current time passed through to adapters (deadline computation). */
  now?: Date;
}

/** Fetch a single discovered page and extract a scholarship via the adapter. */
export async function extractFromUrl(
  adapter: ProviderAdapter,
  d: DiscoveredPage,
  opts: { now?: Date } = {},
): Promise<ReturnType<ProviderAdapter['extract']> | null> {
  const url = d.sourceUrl || d.url;
  try {
    if (adapter.curated) {
      return await adapter.extract(d.url, '', { now: opts.now, metadata: d.metadata });
    }
    const res = await fetchText(url, { timeoutMs: 30_000 });
    if (res.status !== 200) {
      logger.warn('pipeline', `non-200 (${res.status}) for ${url}`);
      return null;
    }
    return await adapter.extract(d.url, res.text, { now: opts.now, metadata: d.metadata });
  } catch (err) {
    logger.warn('pipeline', `extract failed for ${url}: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

/** Run the full pipeline for one provider. */
export async function runProviderPipeline(
  prisma: PrismaClient,
  adapter: ProviderAdapter,
  opts: PipelineOptions = {},
): Promise<ImportSummary> {
  const started = Date.now();
  logger.info('pipeline', `starting provider ${adapter.id}`);

  const discovered = await adapter.discover();
  logger.info('pipeline', `discovered ${discovered.length} candidate pages for ${adapter.id}`);
  const candidates = discovered
    .filter((d) => !isExcludedUrl(d.url, d.title))
    .slice(0, opts.maxItems ?? adapter.defaultMax ?? discovered.length);

  const providerId = await prisma.provider.findFirst({
    where: { slug: adapter.id },
    select: { id: true },
  });
  const resolvedProviderId =
    providerId?.id ??
    (
      await prisma.provider.upsert({
        where: { slug: adapter.id },
        create: {
          name: adapter.name,
          slug: adapter.id,
          providerType: 'GOVERNMENT',
          website: adapter.website,
          isVerified: true,
          verificationStatus: 'VERIFIED',
          status: 'PUBLISHED',
        },
        update: {},
      })
    ).id;

  const concurrency = opts.fetchConcurrency ?? 3;
  const extracted: Awaited<ReturnType<ProviderAdapter['extract']>>[] = [];
  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (d) => {
        try {
          return await extractFromUrl(adapter, d, { now: opts.now });
        } catch (err) {
          logger.warn('pipeline', `failed ${d.url}: ${err instanceof Error ? err.message : err}`);
          return null;
        }
      }),
    );
    for (const r of results) if (r) extracted.push(r);
  }
  logger.info('pipeline', `extracted ${extracted.length}/${candidates.length} for ${adapter.id}`);

  const normalized = extracted.map((e) => normalizeScholarship(e, new Date()));

  if (opts.dryRun) {
    logger.info('pipeline', `dry-run: would import ${normalized.length} scholarships for ${adapter.id}`);
    return {
      provider: adapter.name,
      discovered: discovered.length,
      extracted: extracted.length,
      saved: normalized.length,
      updated: 0,
      skipped: 0,
      failed: 0,
      durationMs: Date.now() - started,
      errors: [],
    };
  }

  const summary = await importScholarships(prisma, normalized, {
    sourceName: `${adapter.name} Official`,
    sourceType: 'SCRAPER',
    sourceUrl: adapter.website,
    providerId: resolvedProviderId,
    providerName: adapter.name,
    providerWebsite: adapter.website,
    updateExisting: opts.updateExisting,
  });
  logger.info('pipeline', `provider ${adapter.id} done in ${Date.now() - started}ms`);
  return summary;
}
