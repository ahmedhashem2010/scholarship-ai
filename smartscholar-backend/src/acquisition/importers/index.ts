import { Prisma, $Enums } from '@prisma/client';
import { sha256, canonicalJson, jsonSafe } from '../../../scripts/lib';
import { NormalizedScholarship, ImportSummary } from '../types';
import { DbResolver, DEGREE_TYPE_TO_LEVEL_SLUG } from './db';
import { validateNormalized } from '../validators';
import { PrismaClient } from '@prisma/client';

export interface ImportOptions {
  sourceName: string;
  sourceType?: $Enums.import_source_type;
  sourceUrl?: string;
  providerId: string;
  providerName: string;
  providerWebsite?: string;
  concurrency?: number;
  /** When true, always update existing records (dedupe by sourceUrl). */
  updateExisting?: boolean;
}

interface WriteResult {
  scholarshipId: string;
  action: 'CREATED' | 'UPDATED' | 'DUPLICATE';
}

function parseIso(date: string | null): Date | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function importScholarships(
  prisma: PrismaClient,
  items: NormalizedScholarship[],
  opts: ImportOptions,
): Promise<ImportSummary> {
  const started = Date.now();
  const resolver = new DbResolver(prisma);
  const summary: ImportSummary = {
    provider: opts.providerName,
    discovered: items.length,
    extracted: 0,
    saved: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    durationMs: 0,
    errors: [],
  };

  const sourceName = opts.sourceName;
  let source = await prisma.source.findFirst({ where: { name: sourceName } });
  if (!source) {
    source = await prisma.source.create({
      data: {
        name: sourceName,
        baseUrl: opts.sourceUrl ?? null,
        sourceType: opts.sourceType ?? 'SCRAPER',
        providerId: opts.providerId,
        lastScrapedAt: new Date(),
        isActive: true,
      },
    });
  } else {
    source = await prisma.source.update({
      where: { id: source.id },
      data: { lastScrapedAt: new Date(), baseUrl: opts.sourceUrl ?? undefined },
    });
  }

  const batch = await prisma.importBatch.create({
    data: {
      sourceId: source.id,
      sourceName,
      sourceType: opts.sourceType ?? 'SCRAPER',
      sourceUrl: opts.sourceUrl ?? null,
      status: 'PROCESSING',
      totalItems: items.length,
      startedAt: new Date(),
    },
  });
  const existingBySourceUrl = new Map<string, string>();
  const sourceUrlSet = items.map((i) => i.sourceUrl).filter(Boolean);
  if (sourceUrlSet.length > 0) {
    const rows = await prisma.scholarship.findMany({
      where: { sourceUrl: { in: sourceUrlSet }, deletedAt: null },
      select: { id: true, sourceUrl: true },
    });
    for (const r of rows) if (r.sourceUrl) existingBySourceUrl.set(r.sourceUrl, r.id);
  }

  const usedSlugs = new Set<string>();
  const existingSlugs = new Set<string>(
    (await prisma.scholarship.findMany({
      where: { deletedAt: null },
      select: { slug: true },
    })).map((r) => r.slug),
  );
  for (const s of existingSlugs) usedSlugs.add(s);

  for (const item of items) {
    try {
      const validation = validateNormalized(item);
      if (!validation.ok) {
        summary.failed += 1;
        summary.errors.push({ url: item.sourceUrl, message: `validation: ${validation.errors.join('; ')}` });
        await markQueueItem(prisma, batch.id, item.sourceUrl, 'FAILED', `validation: ${validation.errors.join('; ')}`);
        continue;
      }

      const providerId = await resolver.provider(opts.providerName, opts.providerWebsite);
      const countryId = item.countryCode ? await resolver.country(item.countryCode) : null;
      const universityId = item.university
        ? await resolver.university(item.university, item.countryCode)
        : null;

      let slug = item.slug;
      if (usedSlugs.has(slug)) {
        let n = 2;
        while (usedSlugs.has(`${slug}-${n}`)) n += 1;
        slug = `${slug}-${n}`;
      }
      usedSlugs.add(slug);

      const existingId = existingBySourceUrl.get(item.sourceUrl);
      const result: WriteResult = await writeScholarship(prisma, resolver, item, {
        providerId,
        countryId,
        universityId,
        slug,
        sourceId: source.id,
        existingId: opts.updateExisting ? (existingId ?? null) : null,
      });

      if (result.action === 'DUPLICATE') {
        summary.skipped += 1;
        await markQueueItem(prisma, batch.id, item.sourceUrl, 'DUPLICATE', `duplicate of ${result.scholarshipId}`);
        continue;
      }

      summary.saved += result.action === 'CREATED' ? 1 : 0;
      summary.updated += result.action === 'UPDATED' ? 1 : 0;
      summary.extracted += 1;
      existingBySourceUrl.set(item.sourceUrl, result.scholarshipId);
      await markQueueItem(prisma, batch.id, item.sourceUrl, 'COMPLETED', result.scholarshipId);
    } catch (err) {
      summary.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      summary.errors.push({ url: item.sourceUrl, message });
      try {
        await markQueueItem(prisma, batch.id, item.sourceUrl, 'FAILED', message);
      } catch {
        /* best effort */
      }
    }
  }

  const finalStatus = summary.failed === 0 ? 'COMPLETED' : summary.saved + summary.updated === 0 ? 'FAILED' : 'PARTIAL';
  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status: finalStatus,
      succeeded: summary.saved + summary.updated,
      failed: summary.failed,
      skipped: summary.skipped,
      errorSummary: summary.errors.length > 0 ? `${summary.errors.length} item(s) failed` : null,
      finishedAt: new Date(),
    },
  });

  summary.durationMs = Date.now() - started;
  return summary;
}

async function markQueueItem(
  prisma: PrismaClient,
  batchId: string,
  sourceUrl: string,
  status: $Enums.queue_item_status,
  detail: string,
): Promise<void> {
  const contentHash = sha256(canonicalJson({ sourceUrl, status }));
  const existing = await prisma.importQueueItem.findFirst({
    where: { batchId, sourceUrl },
    select: { id: true },
  });
  const data = {
    contentHash,
    status,
    error: status === 'COMPLETED' ? null : detail,
    processedAt: new Date(),
  };
  if (existing) {
    await prisma.importQueueItem.update({ where: { id: existing.id }, data });
  } else {
    await prisma.importQueueItem.create({
      data: {
        batchId,
        sourceUrl: sourceUrl || null,
        rawPayload: { sourceUrl } as Prisma.InputJsonValue,
        ...data,
      },
    });
  }
}

async function writeScholarship(
  prisma: PrismaClient,
  resolver: DbResolver,
  item: NormalizedScholarship,
  ctx: {
    providerId: string;
    countryId: string | null;
    universityId: string | null;
    slug: string;
    sourceId: string;
    existingId: string | null;
  },
): Promise<WriteResult> {
  if (ctx.existingId) {
    return { scholarshipId: ctx.existingId, action: 'UPDATED' };
  }

  const degreeLevelIds = new Set<string>();
  for (const degreeType of item.degreeLevels ?? []) {
    const slug = DEGREE_TYPE_TO_LEVEL_SLUG[degreeType] ?? null;
    if (slug) {
      const id = await resolver.degreeLevel(slug);
      if (id) degreeLevelIds.add(id);
    }
  }
  const fieldIds = new Set<string>();
  for (const f of item.studyFields ?? []) {
    const id = await resolver.studyField(f);
    if (id) fieldIds.add(id);
  }
  const eligibleCountryIds = new Set<string>();
  for (const code of item.eligibleCountryCodes ?? []) {
    const id = await resolver.country(code);
    if (id) eligibleCountryIds.add(id);
  }
  const languageIds = new Set<string>();
  for (const code of item.languageCodes ?? []) {
    const id = await resolver.language(code);
    if (id) languageIds.add(id);
  }

  const feeCurId = item.applicationFeeCurrency ? await resolver.currency(item.applicationFeeCurrency) : null;

  const now = new Date();
  const closing = parseIso(item.closingDate);
  const opening = parseIso(item.openingDate);

  const scholarship = await prisma.scholarship.create({
    data: {
      slug: ctx.slug,
      title: item.title,
      titleAr: item.titleAr ?? undefined,
      description: item.description ?? undefined,
      providerId: ctx.providerId,
      countryId: ctx.countryId ?? undefined,
      universityId: ctx.universityId ?? undefined,
      durationMonths: item.durationMonths ?? undefined,
      durationText: item.durationText ?? undefined,
      fundingType: item.fundingType as never,
      applicationFee: item.applicationFeeAmount !== null ? item.applicationFeeAmount : undefined,
      applicationFeeCurrencyId: feeCurId ?? undefined,
      applicationUrl: item.applicationUrl ?? undefined,
      officialWebsite: item.originalUrl ?? undefined,
      openingDate: opening ?? undefined,
      closingDate: closing ?? undefined,
      minimumAge: item.minimumAge ?? undefined,
      maximumAge: item.maximumAge ?? undefined,
      minimumGpa: item.minimumGpa !== null ? item.minimumGpa : undefined,
      gpaScale: item.gpaScale ?? 4,
      isFullyFunded: item.fullyFunded,
      isActive: true,
      status: $Enums.scholarship_status.ACTIVE,
      verificationStatus: $Enums.verification_status.VERIFIED,
      verifiedAt: now,
      sourceUrl: item.sourceUrl,
      sourceId: ctx.sourceId,
      needsEmbedding: true,
      publishedAt: now,
      metadata: { parserVersion: item.parserVersion, confidence: item.extractionConfidence, scrapedAt: item.scrapedAt, provider: item.provider },
    },
  });

  const related: Prisma.PrismaPromise<unknown>[] = [];

  for (const id of degreeLevelIds) {
    related.push(
      prisma.scholarshipDegrees.upsert({
        where: { scholarshipId_degreeLevelId: { scholarshipId: scholarship.id, degreeLevelId: id } },
        create: { scholarshipId: scholarship.id, degreeLevelId: id },
        update: {},
      }),
    );
  }
  for (const id of fieldIds) {
    related.push(
      prisma.scholarshipFields.upsert({
        where: { scholarshipId_studyFieldId: { scholarshipId: scholarship.id, studyFieldId: id } },
        create: { scholarshipId: scholarship.id, studyFieldId: id },
        update: {},
      }),
    );
  }
  for (const id of eligibleCountryIds) {
    related.push(
      prisma.scholarshipEligibleCountries.create({
        data: { scholarshipId: scholarship.id, countryId: id },
      }),
    );
  }
  for (const id of languageIds) {
    related.push(
      prisma.scholarshipLanguages.upsert({
        where: { scholarshipId_languageId: { scholarshipId: scholarship.id, languageId: id } },
        create: { scholarshipId: scholarship.id, languageId: id, isRequired: false },
        update: {},
      }),
    );
  }

  for (const b of item.benefits ?? []) {
    const curId = b.currency ? await resolver.currency(b.currency) : null;
    related.push(
      prisma.scholarshipBenefits.create({
        data: {
          scholarshipId: scholarship.id,
          benefitType: b.type as never,
          amount: b.amount ?? undefined,
          currencyId: curId ?? undefined,
          description: b.description ?? undefined,
          isEstimated: false,
        },
      }),
    );
  }

  for (const r of item.requirements ?? []) {
    related.push(
      prisma.scholarshipRequirements.create({
        data: {
          scholarshipId: scholarship.id,
          requirementType: r.type as never,
          description: r.description ?? undefined,
          isHardRequirement: r.isMandatory,
        },
      }),
    );
  }

  for (const t of item.testRequirements ?? []) {
    const band = /band|(\d\.\d)/.test(t.minimumScore ?? '') ? t.minimumScore : undefined;
    related.push(
      prisma.scholarshipTestRequirements.create({
        data: {
          scholarshipId: scholarship.id,
          testType: t.type as never,
          minimumScore: band ? undefined : t.minimumScore ? Number(t.minimumScore) : undefined,
          minimumBand: band ?? undefined,
          isMandatory: t.isMandatory,
        },
      }),
    );
  }

  for (const d of item.documentTypes ?? []) {
    related.push(
      prisma.scholarshipDocuments.create({
        data: {
          scholarshipId: scholarship.id,
          documentType: d.type as never,
          isRequired: d.isRequired,
        },
      }),
    );
  }

  if (opening || closing) {
    const cycleLabel = `${(closing ?? opening)!.getUTCFullYear()}`;
    const cycleStatus = closing
      ? closing >= now
        ? 'OPEN'
        : 'CLOSED'
      : 'UPCOMING';
    related.push(
      prisma.scholarshipCycle.create({
        data: {
          scholarshipId: scholarship.id,
          cycleLabel,
          openingDate: opening ?? undefined,
          closingDate: closing ?? undefined,
          status: cycleStatus as never,
          isCurrent: true,
          sourceUrl: item.sourceUrl,
        },
      }),
    );
  }

  related.push(
    prisma.scholarshipVersion.create({
      data: {
        scholarshipId: scholarship.id,
        version: 1,
        snapshot: jsonSafe(scholarship) as Prisma.InputJsonValue,
        changeType: 'CREATE',
      },
    }),
  );

  related.push(
    prisma.verificationQueue.create({
      data: { scholarshipId: scholarship.id, status: 'VERIFIED', reason: `Imported via ${item.provider}` },
    }),
  );

  try {
    await prisma.$transaction(related);
  } catch (err) {
    // The scholarship row is created before its related data; if any related
    // insert fails, remove it so we never leave orphaned records behind.
    await prisma.scholarship.delete({ where: { id: scholarship.id } }).catch(() => {});
    throw err;
  }

  return { scholarshipId: scholarship.id, action: 'CREATED' };
}
