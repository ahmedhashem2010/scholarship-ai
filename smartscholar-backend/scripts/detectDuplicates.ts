import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  parseArgs,
  flagNumber,
  fmt,
} from './lib';

interface PairRow {
  aId: string;
  bId: string;
  sim: number;
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const threshold = flagNumber(flags, 'threshold', 0.85);
  const limit = flagNumber(flags, 'limit', 500);
  const dryRun = flags.get('dry-run') !== undefined;

  const prisma = getPrisma();
  const started = Date.now();

  const pairs = await prisma.$queryRaw<PairRow[]>`
    SELECT
      a.id::text AS "aId",
      b.id::text AS "bId",
      similarity(a.title, b.title) AS sim
    FROM scholarships a
    JOIN scholarships b ON a.id < b.id
    WHERE a.deleted_at IS NULL
      AND b.deleted_at IS NULL
      AND a.id <> b.id
      AND similarity(a.title, b.title) >= ${threshold}
      AND NOT EXISTS (
        SELECT 1 FROM duplicates d
        WHERE (d.scholarship_id = a.id AND d.duplicate_of_id = b.id)
           OR (d.scholarship_id = b.id AND d.duplicate_of_id = a.id)
      )
    ORDER BY sim DESC
    LIMIT ${limit}
  `;

  console.log('[dupes] %d candidate pairs above threshold %.2f (%s)', pairs.length, threshold, dryRun ? 'dry run' : 'live');

  if (dryRun) {
    for (const p of pairs) {
      console.log('  %s ~ %s sim=%.3f', p.aId, p.bId, p.sim);
    }
    console.log('[dupes] dry run - nothing inserted');
    return;
  }

  const data = pairs.map((p) => ({
    scholarshipId: p.aId,
    duplicateOfId: p.bId,
    similarity: Math.round(p.sim * 100) / 100,
    method: 'pg_trgm',
    status: 'OPEN' as const,
  }));

  let inserted = 0;
  for (const chunk of chunkArray(data, 100)) {
    const res = await prisma.duplicate.createMany({ data: chunk, skipDuplicates: true });
    inserted += res.count;
  }

  const already = pairs.length - inserted;
  console.log('[dupes] done in %dms', Date.now() - started);
  console.log('  candidates    %d', fmt(pairs.length));
  console.log('  inserted      %d', fmt(inserted));
  console.log('  already known %d', fmt(already));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[dupes] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
