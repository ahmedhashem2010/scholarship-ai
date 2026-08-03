import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { Prisma } from '@prisma/client';
import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  slugify,
  sha256,
  canonicalJson,
  tokenSet,
  jaccard,
  parseArgs,
  flagString,
  parseDate,
  parseBool,
  parseNum,
  fmt,
} from './lib';

type RowResult = {
  title: string;
  slug: string;
  status: string;
  reason: string;
};

const FIELD_MAP: Record<string, string> = {
  slug: 'slug',
  title: 'title',
  title_ar: 'titleAr',
  description: 'description',
  description_ar: 'descriptionAr',
  seo_description: 'seoDescription',
  duration_months: 'durationMonths',
  duration_text: 'durationText',
  funding_type: 'fundingType',
  application_fee: 'applicationFee',
  application_url: 'applicationUrl',
  official_website: 'officialWebsite',
  official_pdf_url: 'officialPdfUrl',
  opening_date: 'openingDate',
  closing_date: 'closingDate',
  interview_date: 'interviewDate',
  results_date: 'resultsDate',
  enrollment_date: 'enrollmentDate',
  minimum_age: 'minimumAge',
  maximum_age: 'maximumAge',
  minimum_gpa: 'minimumGpa',
  gpa_scale: 'gpaScale',
  minimum_percentage: 'minimumPercentage',
  maximum_gap_years: 'maximumGapYears',
  is_fully_funded: 'isFullyFunded',
  is_featured: 'isFeatured',
  is_active: 'isActive',
  status: 'status',
  verification_status: 'verificationStatus',
  difficulty_score: 'difficultyScore',
  competition_level: 'competitionLevel',
  acceptance_rate: 'acceptanceRate',
  ai_summary: 'aiSummary',
  ai_tips: 'aiTips',
  application_process: 'applicationProcess',
  selection_process: 'selectionProcess',
  source_url: 'sourceUrl',
  needs_embedding: 'needsEmbedding',
};

const DATE_FIELDS = new Set([
  'opening_date',
  'closing_date',
  'interview_date',
  'results_date',
  'enrollment_date',
]);

function coerce(value: unknown, field: string): unknown {
  if (DATE_FIELDS.has(field)) return parseDate(value);
  if (field.startsWith('is_') || field === 'needs_embedding') return parseBool(value);
  if (field === 'status' || field === 'verification_status' || field === 'funding_type' || field === 'competition_level') {
    return String(value).toUpperCase();
  }
  const num = parseNum(value);
  return num;
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

function readRecords(filePath: string): { items: Record<string, unknown>[]; sourceMeta: Record<string, unknown> } {
  const full = resolve(filePath);
  const raw = readFileSync(full, 'utf8');
  let sourceMeta: Record<string, unknown> = {};
  let items: Record<string, unknown>[] = [];
  if (/\.csv$/i.test(filePath)) {
    items = parseCsv(raw);
  } else {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      items = parsed as Record<string, unknown>[];
    } else {
      const obj = parsed as Record<string, unknown>;
      sourceMeta = {
        sourceName: obj.source_name,
        sourceUrl: obj.source_url,
        sourceType: obj.source_type,
      };
      const candidate = obj.items ?? obj.scholarships ?? obj.records;
      if (!Array.isArray(candidate)) throw new Error(`File must be an array or contain an "items"/"scholarships" array`);
      items = candidate as Record<string, unknown>[];
    }
  }
  return { items, sourceMeta };
}

async function findDuplicateId(prisma: Awaited<ReturnType<typeof getPrisma>>, title: string, titles: Map<string, string>): Promise<string | null> {
  let rpcResult: string | null = null;
  try {
    const rows = await prisma.$queryRaw<{ fn: unknown }[]>`SELECT to_regprocedure('import_find_duplicate(text)') AS fn`;
    if (rows[0]?.fn != null) {
      const res = await prisma.$queryRaw<{ id: string | null }[]>`SELECT import_find_duplicate(${title}) AS id`;
      rpcResult = res[0]?.id ?? null;
    }
  } catch {
    rpcResult = null;
  }
  if (rpcResult) return rpcResult;

  const target = tokenSet(title);
  let best: { id: string; sim: number } | null = null;
  for (const [existingTitle, id] of titles) {
    const sim = jaccard(target, tokenSet(existingTitle));
    if (sim >= 0.85 && (!best || sim > best.sim)) best = { id, sim };
  }
  return best ? best.id : null;
}

async function resolveProvider(prisma: Awaited<ReturnType<typeof getPrisma>>, name: string | undefined): Promise<string | null> {
  if (!name || String(name).trim() === '') return null;
  const slug = slugify(String(name));
  const row = await prisma.provider.upsert({
    where: { slug },
    create: {
      name: String(name),
      slug,
      providerType: 'OTHER',
      status: 'PUBLISHED',
      verificationStatus: 'VERIFIED',
      isVerified: true,
    },
    update: { name: String(name) },
  });
  return row.id;
}

async function resolveCountry(prisma: Awaited<ReturnType<typeof getPrisma>>, value: string | undefined): Promise<string | null> {
  if (!value || String(value).trim() === '') return null;
  const v = String(value).trim();
  const byCode = await prisma.country.findFirst({ where: { code: v.toUpperCase() } });
  if (byCode) return byCode.id;
  const byCode3 = await prisma.country.findFirst({ where: { code3: v.toUpperCase() } });
  if (byCode3) return byCode3.id;
  const bySlug = await prisma.country.findFirst({ where: { slug: slugify(v) } });
  if (bySlug) return bySlug.id;
  const byName = await prisma.country.findFirst({ where: { name: { equals: v, mode: 'insensitive' } } });
  return byName ? byName.id : null;
}

async function resolveUniversity(prisma: Awaited<ReturnType<typeof getPrisma>>, name: string | undefined, countryId: string | null): Promise<string | null> {
  if (!name || String(name).trim() === '') return null;
  const slug = slugify(String(name));
  const existing = await prisma.university.findUnique({ where: { slug } });
  if (existing) return existing.id;
  if (!countryId) return null;
  const row = await prisma.university.create({
    data: {
      name: String(name),
      slug,
      countryId,
      status: 'PUBLISHED',
      verificationStatus: 'UNVERIFIED',
    },
  });
  return row.id;
}

async function resolveDegreeLevel(prisma: Awaited<ReturnType<typeof getPrisma>>, name: string | undefined): Promise<string | null> {
  if (!name || String(name).trim() === '') return null;
  const slug = slugify(String(name));
  const bySlug = await prisma.degreeLevel.findUnique({ where: { slug } });
  if (bySlug) return bySlug.id;
  const byName = await prisma.degreeLevel.findFirst({ where: { name: { equals: String(name), mode: 'insensitive' } } });
  return byName ? byName.id : null;
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags, positional } = parseArgs();
  const filePath = positional[0] ?? flagString(flags, 'file');
  if (!filePath) {
    console.error('usage: npx tsx scripts/importScholarships.ts <file.json|file.csv> [--source-name NAME] [--source-type TYPE] [--batch-size N]');
    process.exit(2);
  }

  const { items, sourceMeta } = readRecords(filePath);
  if (items.length === 0) {
    console.error('[import] no records found in %s', filePath);
    process.exit(2);
  }

  const prisma = getPrisma();
  const started = Date.now();
  const sourceName = flagString(flags, 'source-name') || String(sourceMeta.sourceName || basename(filePath));
  const sourceType = flagString(flags, 'source-type') || String(sourceMeta.sourceType || 'JSON');

  console.log('[import] file=%s records=%d source=%s', filePath, items.length, sourceName);

  let source = await prisma.source.findFirst({ where: { name: sourceName } });
  if (!source) {
    source = await prisma.source.create({ data: { name: sourceName, sourceType: sourceType as never } });
  } else {
    source = await prisma.source.update({ where: { id: source.id }, data: { lastScrapedAt: new Date() } });
  }

  const batch = await prisma.importBatch.create({
    data: {
      sourceId: source.id,
      sourceName,
      sourceType: sourceType as never,
      sourceUrl: flagString(flags, 'source-url') || String(sourceMeta.sourceUrl || ''),
      status: 'PROCESSING',
      totalItems: items.length,
      startedAt: new Date(),
    },
  });

  const existingTitles = new Map<string, string>();
  const scholarshipRows = await prisma.scholarship.findMany({ select: { id: true, title: true }, where: { deletedAt: null } });
  for (const row of scholarshipRows) existingTitles.set(row.title, row.id);

  const usedSlugs = new Set<string>();
  const results: RowResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  let duplicates = 0;

  for (let i = 0; i < items.length; i++) {
    const record = items[i];
    const title = record.title ? String(record.title).trim() : '';
    if (!title) {
      failed += 1;
      results.push({ title: '(no title)', slug: '', status: 'FAILED', reason: 'record has no title' });
      continue;
    }
    try {
      let slug = record.slug ? String(record.slug).trim() : slugify(title);
      if (usedSlugs.has(slug)) {
        let n = 2;
        while (usedSlugs.has(`${slug}-${n}`)) n += 1;
        slug = `${slug}-${n}`;
      }
      usedSlugs.add(slug);

      const contentHash = sha256(
        canonicalJson({
          title,
          description: record.description,
          provider: record.provider,
          country: record.country,
          university: record.university,
          opening_date: record.opening_date,
          closing_date: record.closing_date,
          funding_type: record.funding_type,
          application_url: record.application_url,
        }),
      );

      const queueItem = await prisma.importQueueItem.create({
        data: {
          batchId: batch.id,
          sourceUrl: record.source_url ? String(record.source_url) : undefined,
          rawPayload: record as Prisma.InputJsonValue,
          extracted: record as Prisma.InputJsonValue,
          contentHash,
          status: 'PENDING',
        },
      });

      const duplicateId = await findDuplicateId(prisma, title, existingTitles);
      if (duplicateId && duplicateId !== queueItem.id) {
        await prisma.importQueueItem.update({
          where: { id: queueItem.id },
          data: { status: 'DUPLICATE', error: `duplicate of scholarship ${duplicateId}`, processedAt: new Date() },
        });
        duplicates += 1;
        results.push({ title, slug, status: 'DUPLICATE', reason: `duplicate of ${duplicateId}` });
        continue;
      }

      const providerId = await resolveProvider(prisma, record.provider as string | undefined);
      const countryId = await resolveCountry(prisma, record.country as string | undefined);
      const universityId = await resolveUniversity(prisma, record.university as string | undefined, countryId);
      const degreeLevelId = await resolveDegreeLevel(prisma, record.degree_level as string | undefined);

      const data: Record<string, unknown> = {};
      for (const [snake, camel] of Object.entries(FIELD_MAP)) {
        const raw = record[snake] ?? record[camel];
        if (raw === undefined || raw === null || raw === '') continue;
        data[camel] = coerce(raw, snake);
      }
      data.providerId = providerId;
      data.countryId = countryId;
      data.universityId = universityId;
      data.degreeLevelId = degreeLevelId;
      data.sourceId = source.id;

      const existing = await prisma.scholarship.findUnique({ where: { slug } });
      let scholarship;
      let changeType: 'CREATE' | 'UPDATE' = existing ? 'UPDATE' : 'CREATE';
      if (existing) {
        scholarship = await prisma.scholarship.update({ where: { slug }, data: data as never });
      } else {
        scholarship = await prisma.scholarship.create({
          data: { ...(data as Prisma.ScholarshipUncheckedCreateInput), slug, title },
        });
      }

      const versionAgg = await prisma.scholarshipVersion.aggregate({
        where: { scholarshipId: scholarship.id },
        _max: { version: true },
      });
      const nextVersion = (versionAgg._max.version ?? 0) + 1;
      await prisma.scholarshipVersion.create({
        data: {
          scholarshipId: scholarship.id,
          version: nextVersion,
          snapshot: scholarship as unknown as Prisma.InputJsonValue,
          changeType,
        },
      });

      if (scholarship.verificationStatus !== 'VERIFIED' && scholarship.verificationStatus !== 'REJECTED') {
        await prisma.verificationQueue.upsert({
          where: { scholarshipId: scholarship.id },
          create: { scholarshipId: scholarship.id, status: 'PENDING', reason: `Imported via ${sourceName}` },
          update: { status: 'PENDING', reason: `Imported via ${sourceName}` },
        });
      }

      const opening = parseDate(record.opening_date);
      const closing = parseDate(record.closing_date);
      if (opening || closing) {
        const cycleLabel = String(record.cycle_label || `${(closing ?? opening)!.getFullYear()} cycle`);
        const existingCycle = await prisma.scholarshipCycle.findFirst({
          where: { scholarshipId: scholarship.id, cycleLabel, deletedAt: null },
        });
        const cycleData = {
          cycleLabel,
          openingDate: opening,
          closingDate: closing,
          isCurrent: true,
          status: closing ? (closing >= new Date() ? 'OPEN' as const : 'CLOSED' as const) : 'UPCOMING' as const,
        };
        if (existingCycle) {
          await prisma.scholarshipCycle.update({ where: { id: existingCycle.id }, data: cycleData });
        } else {
          await prisma.scholarshipCycle.create({ data: { ...cycleData, scholarshipId: scholarship.id } });
        }
      }

      await prisma.importQueueItem.update({
        where: { id: queueItem.id },
        data: { status: 'COMPLETED', scholarshipId: scholarship.id, processedAt: new Date() },
      });
      if (changeType === 'CREATE') existingTitles.set(scholarship.title, scholarship.id);
      succeeded += 1;
      results.push({ title, slug, status: changeType === 'CREATE' ? 'CREATED' : 'UPDATED', reason: scholarship.id });
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      results.push({ title, slug: '', status: 'FAILED', reason: message });
    }
  }

  const finalStatus = failed === 0 ? 'COMPLETED' : succeeded === 0 ? 'FAILED' : 'PARTIAL';
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: finalStatus,
      succeeded,
      failed,
      skipped,
      duplicatesFound: duplicates,
      finishedAt: new Date(),
      errorSummary: failed > 0 ? `${failed} row(s) failed` : null,
    },
  });

  console.log('\n[import] per-row results');
  for (const r of results) {
    console.log('  %-10s %-70s %s', r.status, (r.title || '').slice(0, 70), r.reason);
  }

  console.log('\n[import] summary in %dms', Date.now() - started);
  console.log('  batch id      %s', batch.id);
  console.log('  batch status  %s', finalStatus);
  console.log('  total         %d', items.length);
  console.log('  succeeded     %d', succeeded);
  console.log('  failed        %d', failed);
  console.log('  skipped       %d', skipped);
  console.log('  duplicates    %d', fmt(duplicates));

  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('[import] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
