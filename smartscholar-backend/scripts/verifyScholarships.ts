import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  parseArgs,
  flagString,
  isUuid,
  fmt,
} from './lib';

async function resolveReviewer(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const byEmail = await prisma.user.findFirst({ where: { email: adminEmail } });
    if (byEmail) return byEmail.id;
  }
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    orderBy: { createdAt: 'asc' },
  });
  return admin ? admin.id : null;
}

async function listQueue(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<void> {
  const rows = await prisma.verificationQueue.findMany({
    where: { status: 'PENDING' },
    include: { scholarship: { select: { id: true, slug: true, title: true, status: true, verificationStatus: true, updatedAt: true } } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });

  console.log('[verify] verification queue (PENDING)');
  for (const row of rows) {
    const s = row.scholarship;
    console.log(
      '  %-36s priority=%-6s reason=%s | %s [%s/%s]',
      row.id,
      row.priority,
      row.reason ?? '-',
      s.title,
      s.slug,
      s.verificationStatus,
    );
  }
  const byPriority = new Map<string, number>();
  for (const row of rows) byPriority.set(row.priority, (byPriority.get(row.priority) ?? 0) + 1);

  console.log('\n[verify] summary: %d pending', rows.length);
  for (const [priority, count] of [...byPriority.entries()].sort()) {
    console.log('  %-6s %s', priority, fmt(count));
  }
}

async function resolveQueueRow(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  id: string,
): Promise<{ queueId: string; scholarshipId: string } | null> {
  if (!isUuid(id)) return null;
  const byId = await prisma.verificationQueue.findUnique({ where: { id } });
  if (byId) return { queueId: byId.id, scholarshipId: byId.scholarshipId };
  const byScholarship = await prisma.verificationQueue.findUnique({ where: { scholarshipId: id } });
  if (byScholarship) return { queueId: byScholarship.id, scholarshipId: byScholarship.scholarshipId };
  return null;
}

async function approve(prisma: Awaited<ReturnType<typeof getPrisma>>, id: string): Promise<void> {
  const row = await resolveQueueRow(prisma, id);
  if (!row) {
    console.error('[verify] no pending queue item found for %s', id);
    process.exit(2);
  }
  const reviewerId = await resolveReviewer(prisma);
  await prisma.$transaction([
    prisma.scholarship.update({
      where: { id: row.scholarshipId },
      data: { verificationStatus: 'VERIFIED', verifiedAt: new Date(), verifiedBy: reviewerId },
    }),
    prisma.verificationQueue.update({
      where: { id: row.queueId },
      data: { status: 'VERIFIED', reviewerId, reviewedAt: new Date() },
    }),
  ]);
  const s = await prisma.scholarship.findUnique({ where: { id: row.scholarshipId }, select: { title: true, slug: true } });
  console.log('[verify] APPROVED %s %s', s?.slug ?? row.scholarshipId, s?.title ?? '');
}

async function reject(prisma: Awaited<ReturnType<typeof getPrisma>>, id: string, reason: string): Promise<void> {
  const row = await resolveQueueRow(prisma, id);
  if (!row) {
    console.error('[verify] no pending queue item found for %s', id);
    process.exit(2);
  }
  const reviewerId = await resolveReviewer(prisma);
  await prisma.$transaction([
    prisma.scholarship.update({
      where: { id: row.scholarshipId },
      data: { verificationStatus: 'REJECTED', verifiedAt: new Date(), verifiedBy: reviewerId },
    }),
    prisma.verificationQueue.update({
      where: { id: row.queueId },
      data: { status: 'REJECTED', reviewerId, reviewedAt: new Date(), reviewNotes: reason || null },
    }),
  ]);
  const s = await prisma.scholarship.findUnique({ where: { id: row.scholarshipId }, select: { title: true, slug: true } });
  console.log('[verify] REJECTED %s %s', s?.slug ?? row.scholarshipId, s?.title ?? '');
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const prisma = getPrisma();
  const started = Date.now();

  const approveId = flagString(flags, 'approve');
  const rejectId = flagString(flags, 'reject');
  const reason = flagString(flags, 'reason');

  if (approveId && rejectId) {
    console.error('[verify] use only one of --approve / --reject');
    process.exit(2);
  }
  if (approveId) {
    await approve(prisma, approveId);
  } else if (rejectId) {
    await reject(prisma, rejectId, reason);
  } else {
    await listQueue(prisma);
  }

  console.log('[verify] done in %dms', Date.now() - started);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[verify] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
