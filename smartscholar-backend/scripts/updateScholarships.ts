import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Prisma } from '@prisma/client';
import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  parseArgs,
  flagString,
  parseDate,
  parseBool,
  parseNum,
  isUuid,
  fmt,
  jsonSafe,
} from './lib';

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

const CAMEL_FIELDS = new Set(Object.values(FIELD_MAP));
const DATE_FIELDS = new Set([
  'openingDate',
  'closingDate',
  'interviewDate',
  'resultsDate',
  'enrollmentDate',
]);
const ENUM_FIELDS = new Set(['fundingType', 'competitionLevel', 'status', 'verificationStatus']);

function toCamel(key: string): string {
  const fromSnake = FIELD_MAP[key];
  if (fromSnake) return fromSnake;
  if (CAMEL_FIELDS.has(key)) return key;
  throw new Error(`unknown field: ${key}`);
}

function coerce(value: unknown, camel: string): unknown {
  if (DATE_FIELDS.has(camel)) return parseDate(value);
  if (camel.startsWith('is') || camel === 'needsEmbedding') return parseBool(value);
  if (ENUM_FIELDS.has(camel)) return String(value).toUpperCase();
  if (camel === 'applicationFee' || camel === 'minimumGpa' || camel === 'gpaScale' || camel === 'minimumPercentage' || camel === 'acceptanceRate') {
    const n = parseNum(value);
    return n === null ? null : String(n);
  }
  const n = parseNum(value);
  if (n !== null) return n;
  return String(value);
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) return Prisma.JsonNull;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'number' && !Number.isFinite(value)) return String(value);
  if (typeof value === 'object' && typeof (value as { toString?: unknown }).toString === 'function' && typeof value !== 'string') {
    const asAny = value as { toString?: () => string };
    if (typeof asAny.toString === 'function') {
      const s = asAny.toString();
      if (s !== '[object Object]') return s;
    }
  }
  return value as Prisma.InputJsonValue;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return jsonValue(a) === jsonValue(b);
}

function loadPatches(filePath: string): Array<{ id?: string; slug?: string; patch: Record<string, unknown> }> {
  const parsed = JSON.parse(readFileSync(resolve(filePath), 'utf8')) as unknown;
  if (Array.isArray(parsed)) {
    return parsed.map((row) => {
      const obj = row as Record<string, unknown>;
      if (!obj || typeof obj !== 'object') throw new Error('each array item must be an object');
      const patch = (obj.patch as Record<string, unknown>) ?? obj;
      return { id: obj.id as string | undefined, slug: obj.slug as string | undefined, patch };
    });
  }
  const obj = parsed as Record<string, unknown>;
  return Object.entries(obj).map(([key, patch]) => {
    if (isUuid(key)) return { id: key, patch: patch as Record<string, unknown> };
    return { slug: key, patch: patch as Record<string, unknown> };
  });
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags, positional } = parseArgs();
  const filePath = positional[0] ?? flagString(flags, 'file');
  if (!filePath) {
    console.error('usage: npx tsx scripts/updateScholarships.ts <patches.json> [--dry-run]');
    process.exit(2);
  }
  const dryRun = flags.get('dry-run') !== undefined;

  const patches = loadPatches(filePath);
  console.log('[update] %d patch rows from %s (%s)', patches.length, filePath, dryRun ? 'dry run' : 'live');

  const prisma = getPrisma();
  const started = Date.now();
  let applied = 0;
  let unchanged = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < patches.length; i++) {
    const row = patches[i]!;
    try {
      const where = row.id
        ? { id: row.id }
        : row.slug
          ? { slug: row.slug }
          : null;
      if (!where) {
        errors += 1;
        console.error('  %d/%d NOKEY (need id or slug)', i + 1, patches.length);
        continue;
      }
      const current = await prisma.scholarship.findUnique({ where });
      if (!current) {
        notFound += 1;
        console.warn('  %d/%d MISS %s', i + 1, patches.length, row.id ?? row.slug);
        continue;
      }

      const changes = new Map<string, { old: unknown; new: unknown }>();
      for (const [rawKey, rawValue] of Object.entries(row.patch)) {
        const camel = toCamel(rawKey);
        const coerced = coerce(rawValue, camel);
        const oldValue = (current as Record<string, unknown>)[camel];
        if (valuesEqual(oldValue, coerced)) continue;
        changes.set(camel, { old: oldValue, new: coerced });
      }

      if (changes.size === 0) {
        unchanged += 1;
        console.log('  %d/%d UNCHANGED %s', i + 1, patches.length, row.id ?? row.slug);
        continue;
      }

      const data: Record<string, unknown> = {};
      for (const [camel, change] of changes) data[camel] = change.new;

      console.log('  %d/%d APPLY %s (%s)', i + 1, patches.length, row.id ?? row.slug, [...changes.keys()].join(', '));
      if (dryRun) continue;

      const updated = await prisma.scholarship.update({ where, data: data as never });
      await prisma.scholarshipChangeLog.createMany({
        data: [...changes.entries()].map(([camel, change]) => ({
          scholarshipId: updated.id,
          fieldName: camel,
          oldValue: jsonValue(change.old),
          newValue: jsonValue(change.new),
          changeType: 'UPDATE',
        })),
      });

      const versionAgg = await prisma.scholarshipVersion.aggregate({
        where: { scholarshipId: updated.id },
        _max: { version: true },
      });
      await prisma.scholarshipVersion.create({
        data: {
          scholarshipId: updated.id,
          version: (versionAgg._max.version ?? 0) + 1,
          snapshot: jsonSafe(updated) as Prisma.InputJsonValue,
          changeType: 'UPDATE',
        },
      });
      applied += 1;
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error('  %d/%d ERROR %s (%s)', i + 1, patches.length, row.id ?? row.slug, message);
    }
  }

  console.log('\n[update] done in %dms', Date.now() - started);
  console.log('  applied   %d', fmt(applied));
  console.log('  unchanged %d', fmt(unchanged));
  console.log('  not found %d', fmt(notFound));
  console.log('  errors    %d', fmt(errors));

  process.exitCode = errors > 0 ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('[update] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
