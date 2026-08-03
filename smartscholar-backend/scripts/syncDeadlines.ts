import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  today,
  parseArgs,
  flagNumber,
  isUuid,
  fmt,
} from './lib';

function startOfDay(d: Date): number {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out.getTime();
}

function expectedStatus(opening: Date | null, closing: Date | null, now: Date): 'UPCOMING' | 'OPEN' | 'CLOSED' {
  const todayMs = startOfDay(now);
  if (opening && startOfDay(opening) > todayMs) return 'UPCOMING';
  if (closing && startOfDay(closing) < todayMs) return 'CLOSED';
  return 'OPEN';
}

const AUTO_STATUSES = new Set(['UPCOMING', 'OPEN', 'CLOSED']);

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const dryRun = flags.get('dry-run') !== undefined;
  const limit = flagNumber(flags, 'limit', 0);

  const prisma = getPrisma();
  const started = Date.now();
  const now = today();

  const cycles = await prisma.scholarshipCycle.findMany({
    where: { deletedAt: null },
    select: { id: true, scholarshipId: true, openingDate: true, closingDate: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  let eligible = cycles.filter((c) => AUTO_STATUSES.has(c.status));
  if (limit > 0) eligible = eligible.slice(0, limit);

  const transitions = new Map<string, number>();
  let unchanged = 0;
  let updatedCycles = 0;

  for (const cycle of eligible) {
    const next = expectedStatus(cycle.openingDate, cycle.closingDate, now);
    if (next === cycle.status) {
      unchanged += 1;
      continue;
    }
    const key = `${cycle.status} -> ${next}`;
    transitions.set(key, (transitions.get(key) ?? 0) + 1);
    updatedCycles += 1;
    if (!dryRun) {
      await prisma.scholarshipCycle.update({ where: { id: cycle.id }, data: { status: next } });
    }
  }

  const scholarshipIds = new Set<string>();
  for (const cycle of eligible) scholarshipIds.add(cycle.scholarshipId);

  let synced = 0;
  if (!dryRun) {
    for (const id of scholarshipIds) {
      if (!isUuid(id)) continue;
      await prisma.$executeRawUnsafe(`SELECT sync_scholarship_dates($1::uuid)`, id);
      synced += 1;
    }
  }

  console.log('[sync] done in %dms (%s)', Date.now() - started, dryRun ? 'dry run' : 'live');
  console.log('  cycles scanned   %d', eligible.length);
  console.log('  cycles unchanged %d', unchanged);
  console.log('  cycles updated   %d', updatedCycles);
  console.log('  scholarships resynced %d', synced);
  console.log('  transitions:');
  for (const [key, count] of [...transitions.entries()].sort()) {
    console.log('    %-24s %s', key, fmt(count));
  }
  if (transitions.size === 0) console.log('    (none)');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[sync] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
