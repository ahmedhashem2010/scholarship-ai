/**
 * Deep Scholarship Extraction Engine — CLI.
 *
 * For every active scholarship: crawl the official site, download PDFs/DOCX,
 * run AI extraction, merge with the never-overwrite policy, and write the DB.
 * Emits a JSON quality report (and a markdown summary).
 *
 * Usage:
 *   npx tsx src/deep-extract/cli.ts                 # full run (74 scholarships)
 *   npx tsx src/deep-extract/cli.ts --dry-run       # nothing is written
 *   npx tsx src/deep-extract/cli.ts --slug <slug>   # single scholarship
 *   npx tsx src/deep-extract/cli.ts --providers mext,erasmus
 *   npx tsx src/deep-extract/cli.ts --limit 3 --dry-run --no-pdf
 *   npx tsx src/deep-extract/cli.ts --resume          # skip already-processed
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@prisma/client';
import { getPrisma, closePrisma, loadEnv, parseArgs, flagString, flagNumber, flagBoolean } from '../../scripts/lib';
import { crawlSite } from './crawl';
import { analyzeDocs } from './docs';
import { extractScholarship } from './extract';
import { mergeScholarship } from './merge';
import { applyMerge, loadExisting } from './update';
import { completenessScore, completenessFromExisting, buildReport } from './quality';
import { DEEP_EXTRACT_VERSION, DetectedDoc, ScholarshipOutcome } from './types';

const BACKEND_ROOT = join(__dirname, '..', '..');

interface Flags {
  slug: string;
  providers: string[];
  limit: number;
  dryRun: boolean;
  noPdf: boolean;
  resume: boolean;
  maxPages: number;
  concurrency: number;
  report: string;
}

function parseFlags(): Flags {
  const { flags, positional } = parseArgs();
  return {
    slug: flagString(flags, 'slug') || (positional[0] ?? ''),
    providers: flagString(flags, 'providers')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
    limit: flagNumber(flags, 'limit', 0),
    dryRun: flagBoolean(flags, 'dry-run'),
    noPdf: flagBoolean(flags, 'no-pdf'),
    resume: flagBoolean(flags, 'resume'),
    maxPages: flagNumber(flags, 'max-pages', 10),
    concurrency: Math.max(1, Math.min(8, flagNumber(flags, 'concurrency', 1))),
    report: flagString(flags, 'report', 'reports/deep-extract-report.json'),
  };
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function markdownSummary(report: Awaited<ReturnType<typeof buildReport>>): string {
  const lines: string[] = [];
  lines.push(`# Deep Extraction Report — ${DEEP_EXTRACT_VERSION}`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Mode: ${report.dryRun ? 'dry-run (no writes)' : 'live'}`);
  lines.push('');
  lines.push('## Totals');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Total eligible | ${report.total} |`);
  lines.push(`| Processed (changes written) | ${report.processed} |`);
  lines.push(`| No-change | ${report.total - report.processed - report.skipped - report.failed} |`);
  lines.push(`| Skipped | ${report.skipped} |`);
  lines.push(`| Failed | ${report.failed} |`);
  lines.push(`| Pages crawled | ${report.pagesCrawled} |`);
  lines.push(`| PDFs analyzed | ${report.pdfsAnalyzed} |`);
  lines.push(`| Avg completeness | ${fmtPct(report.avgCompleteness)} |`);
  lines.push(`| Overall quality score | ${report.overallQualityScore}/100 |`);
  lines.push(`| Missing closing deadline | ${report.missingClosingDeadline} |`);
  lines.push(`| Missing eligibility | ${report.missingEligibility} |`);
  lines.push(`| Missing funding | ${report.missingFunding} |`);
  lines.push(`| Missing documents | ${report.missingDocuments} |`);
  lines.push(`| Missing contact | ${report.missingContact} |`);
  lines.push('');
  lines.push('## Bottom-20 (lowest completeness)');
  lines.push('');
  lines.push('| Slug | Provider | Completeness |');
  lines.push('|---|---|---|');
  for (const b of report.bottom20) {
    lines.push(`| ${b.slug} | ${b.provider} | ${fmtPct(b.completeness)} |`);
  }
  return lines.join('\n');
}

async function processOne(flags: Flags, slug: string, providerName: string, runAt: string): Promise<ScholarshipOutcome> {
  const started = Date.now();
  const errors: string[] = [];
  const prisma = getPrisma();

  const fail = (partial: Partial<ScholarshipOutcome>): ScholarshipOutcome => ({
    scholarshipSlug: slug,
    provider: providerName,
    status: 'failed',
    changedFields: [],
    pagesCrawled: 0,
    pdfsAnalyzed: 0,
    errors,
    confidence: 0,
    durationMs: Date.now() - started,
    completeness: 0,
    missing: [],
    ...partial,
  });

  try {
    const loaded = await loadExisting(prisma, slug);
    if (!loaded) {
      errors.push('scholarship not found');
      return fail({});
    }

    const prevDeep = loaded.metadata.deepExtract as Record<string, unknown> | null | undefined;
    if (flags.resume && prevDeep?.version === DEEP_EXTRACT_VERSION) {
      const { score, missing } = completenessFromExisting(loaded.existing);
      return {
        scholarshipSlug: slug, provider: providerName, status: 'skipped', changedFields: [],
        pagesCrawled: 0, pdfsAnalyzed: 0, errors: ['already processed (--resume)'],
        confidence: (prevDeep['confidence'] as number | undefined) ?? 0,
        durationMs: Date.now() - started,
        completeness: Math.round(score * 100) / 100,
        missing,
      };
    }

    const seeds = [...new Set([loaded.officialWebsite, loaded.sourceUrl].filter((u): u is string => !!u && /^https?:\/\//.test(u)))];
    if (seeds.length === 0) {
      return {
        scholarshipSlug: slug, provider: providerName, status: 'skipped', changedFields: [],
        pagesCrawled: 0, pdfsAnalyzed: 0, errors: ['no crawlable URL'],
        confidence: 0, durationMs: Date.now() - started, completeness: 0, missing: [],
      };
    }

    const crawl = await crawlSite(seeds, { maxPages: flags.maxPages, useSitemap: true });

    let analyzedDocs: DetectedDoc[] = [];
    if (!flags.noPdf) {
      const candidates = crawl.docs.slice(0, 4);
      analyzedDocs = await analyzeDocs(candidates, 2);
    }

    const pagesCrawled = crawl.pages.length;
    const pdfsAnalyzed = analyzedDocs.length;
    if (pagesCrawled === 0 && pdfsAnalyzed === 0) {
      return fail({ pagesCrawled, pdfsAnalyzed, errors: [...crawl.errors, 'no source content'] });
    }

    try {
      const extracted = await extractScholarship({
        scholarship: {
          slug,
          title: loaded.title,
          sourceUrl: loaded.sourceUrl,
          officialWebsite: loaded.officialWebsite,
          providerName: loaded.provider?.name ?? providerName,
          existingFundingType: loaded.existing.row.fundingType,
          existingCountryCode: loaded.countryCode,
        },
        crawl,
        docs: analyzedDocs,
      });

      const pdfUrl = analyzedDocs[0]?.url ?? null;
      const merge = mergeScholarship(loaded.existing, extracted, { pdfUrl });
      const { score, missing } = completenessScore(loaded.existing, merge);

      const applyResult = await applyMerge(prisma, loaded, merge, extracted, {
        dryRun: flags.dryRun,
        runAt,
        pagesCrawled: crawl.pages.map((p) => p.url),
        pdfsAnalyzed: analyzedDocs.map((d) => d.url),
        crawlErrors: crawl.errors,
      });

      const changedFields = [...merge.changedFields, ...applyResult.appliedFields.filter((f) => !merge.changedFields.includes(f))];
      const status = changedFields.length > 0 || Object.keys(applyResult.addedRelated).length > 0 ? 'processed' : 'no-change';

      return {
        scholarshipSlug: slug,
        provider: providerName,
        status,
        changedFields,
        pagesCrawled,
        pdfsAnalyzed,
        errors: crawl.errors,
        confidence: extracted.confidence,
        durationMs: Date.now() - started,
        completeness: Math.round(score * 100) / 100,
        missing,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(message);
      return fail({ pagesCrawled, pdfsAnalyzed, errors: [...crawl.errors, message] });
    }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return fail({});
  }
}

async function main(): Promise<void> {
  loadEnv();
  const flags = parseFlags();
  const prisma = getPrisma();
  const runAt = new Date().toISOString();

  const where: Prisma.ScholarshipWhereInput = flags.slug
    ? { slug: flags.slug, status: 'ACTIVE', isActive: true }
    : { status: 'ACTIVE', isActive: true };
  const scholarships = await prisma.scholarship.findMany({
    where,
    include: { provider: { select: { name: true } } },
    orderBy: { slug: 'asc' },
  });

  let selected = scholarships.filter((s) => {
    if (flags.providers.length === 0) return true;
    const name = s.provider?.name ?? '';
    return flags.providers.some((p) => name.toLowerCase().includes(p));
  });
  if (flags.limit > 0) selected = selected.slice(0, flags.limit);

  console.log(`[deep-extract] v${DEEP_EXTRACT_VERSION} ${flags.dryRun ? 'DRY-RUN' : 'LIVE'} — ${selected.length} scholarship(s) (of ${scholarships.length} eligible), concurrency ${flags.concurrency}`);

  const outcomes: ScholarshipOutcome[] = [];
  const started = Date.now();
  const queue = [...selected];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(flags.concurrency, Math.max(1, queue.length)) }, async () => {
    for (;;) {
      const idx = nextIndex++;
      const item = queue[idx];
      if (!item) return;
      const name = item.provider?.name ?? 'unknown';
      const outcome = await processOne(flags, item.slug, name, runAt);
      outcomes.push(outcome);
      const pct = fmtPct(outcome.completeness);
      console.log(
        `  [${String(outcomes.length).padStart(3)}/${selected.length}] ${item.slug.padEnd(40)} ${outcome.status.padEnd(9)} ` +
          `pages=${outcome.pagesCrawled} pdfs=${outcome.pdfsAnalyzed} comp=${pct} changed=${outcome.changedFields.length} ${outcome.errors[0] ? `ERR: ${outcome.errors[0].slice(0, 80)}` : ''}`,
      );
    }
  });
  await Promise.all(workers);

  const report = buildReport({ dryRun: flags.dryRun, outcomes, totalEligible: selected.length });
  const reportPath = join(BACKEND_ROOT, flags.report);
  mkdirSync(join(BACKEND_ROOT, 'reports'), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  const summaryPath = reportPath.replace(/\.json$/, '-summary.md');
  writeFileSync(summaryPath, markdownSummary(report), 'utf8');

  console.log(`\n[deep-extract] done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`  processed    ${report.processed}`);
  console.log(`  no-change    ${report.total - report.processed - report.skipped - report.failed}`);
  console.log(`  skipped      ${report.skipped}`);
  console.log(`  failed       ${report.failed}`);
  console.log(`  pages        ${report.pagesCrawled}`);
  console.log(`  pdfs         ${report.pdfsAnalyzed}`);
  console.log(`  avg completeness ${fmtPct(report.avgCompleteness)}`);
  console.log(`  quality score    ${report.overallQualityScore}/100`);
  console.log(`  report       ${reportPath}`);
  console.log(`  summary      ${summaryPath}`);
}

main()
  .catch((err) => {
    console.error('[deep-extract] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
