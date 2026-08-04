import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, getPrisma, closePrisma, parseArgs, flagString, flagNumber, flagBoolean } from '../../scripts/lib';
import { getProviders } from '../providers';
import { ProviderId, ImportSummary } from './types';
import { runProviderPipeline } from './pipeline';
import { logger } from './logging';

async function main(): Promise<void> {
  loadEnv();
  const { flags, positional } = parseArgs();
  const prisma = getPrisma();

  const providersArg = positional[0] ?? flagString(flags, 'providers', '');
  const ids: ProviderId[] = (providersArg || 'all')
    .split(',')
    .map((s) => s.trim().toLowerCase() as ProviderId)
    .filter(Boolean);

  const all = getProviders();
  const chosen = ids.includes('all' as ProviderId)
    ? all
    : all.filter((p) => ids.includes(p.id));

  if (chosen.length === 0) {
    console.error(`no providers matched: ${providersArg}`);
    console.error(`available: ${all.map((p) => p.id).join(', ')}`);
    process.exit(2);
  }

  const maxItems = flagNumber(flags, 'max', 0);
  const dryRun = flagBoolean(flags, 'dry-run', false);
  const updateExisting = flagBoolean(flags, 'update', false);
  const concurrency = flagNumber(flags, 'concurrency', 3);
  const noDb = flagBoolean(flags, 'no-db', false);

  console.log(`[acquire] providers: ${chosen.map((p) => p.id).join(', ')}${maxItems ? ` (max ${maxItems})` : ''}${dryRun ? ' [dry-run]' : ''}${noDb ? ' [no-db]' : ''}`);

  const summaries: ImportSummary[] = [];
  for (const provider of chosen) {
    try {
      const summary = await runProviderPipeline(prisma, provider, {
        maxItems: maxItems || undefined,
        dryRun: dryRun || noDb,
        updateExisting,
        fetchConcurrency: concurrency,
      });
      summaries.push(summary);
    } catch (err) {
      logger.error('cli', `provider ${provider.id} failed: ${err instanceof Error ? err.message : err}`);
      summaries.push({
        provider: provider.name,
        discovered: 0,
        extracted: 0,
        saved: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        durationMs: 0,
        errors: [{ message: err instanceof Error ? err.message : String(err) }],
      });
    }
  }

  console.log('\n[acquire] summary');
  console.log('%-24s %8s %8s %8s %8s %8s %8s %10s', 'provider', 'found', 'extract', 'saved', 'updated', 'skip', 'fail', 'time');
  for (const s of summaries) {
    console.log(
      '%-24s %8d %8d %8d %8d %8d %8d %8dms',
      s.provider,
      s.discovered,
      s.extracted,
      s.saved,
      s.updated,
      s.skipped,
      s.failed,
      s.durationMs,
    );
  }
  const totals = summaries.reduce(
    (acc, s) => {
      acc.discovered += s.discovered;
      acc.extracted += s.extracted;
      acc.saved += s.saved;
      acc.updated += s.updated;
      acc.skipped += s.skipped;
      acc.failed += s.failed;
      return acc;
    },
    { discovered: 0, extracted: 0, saved: 0, updated: 0, skipped: 0, failed: 0 },
  );
  console.log(
    '%-24s %8d %8d %8d %8d %8d %8d',
    'TOTAL',
    totals.discovered,
    totals.extracted,
    totals.saved,
    totals.updated,
    totals.skipped,
    totals.failed,
  );

  // write report for the final report
  const dir = join(__dirname, '..', '..', 'data');
  mkdirSync(dir, { recursive: true });
  const reportPath = join(dir, 'import-report.json');
  writeFileSync(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), summaries }, null, 2),
  );
  console.log(`\n[acquire] report written to ${reportPath}`);
}

main()
  .catch((err) => {
    console.error('[acquire] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
