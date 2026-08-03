import { createHash } from 'node:crypto';
import {
  getPrisma,
  closePrisma,
  loadEnv,
  requireEnv,
  sha256,
  parseArgs,
  flagString,
  flagNumber,
  fmt,
} from './lib';

const DEFAULT_DIMS = 1536;

function normalizeDims(vec: number[], dims: number): number[] {
  if (vec.length === dims) return vec;
  const out = new Array<number>(dims).fill(0);
  for (let i = 0; i < Math.min(vec.length, dims); i++) out[i] = vec[i];
  return out;
}

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return vec;
  return vec.map((x) => x / norm);
}

async function callEmbeddingApi(content: string): Promise<{ vector: number[]; model: string; provider: string } | null> {
  const url = process.env.EMBEDDING_API_URL;
  const key = process.env.EMBEDDING_API_KEY;
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  if (!url || !key) {
    console.log('  [embed] EMBEDDING_API_URL/KEY not set - using FALLBACK hashing embedding');
    return null;
  }
  const endpoint = `${url.replace(/\/+$/, '')}/embeddings`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, input: content }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = data?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) throw new Error('empty embedding in response');
    return { vector: embedding, model, provider: model.toLowerCase().includes('openai') ? 'OPENAI' : 'OTHER' };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  [embed] API call failed (${message}) - using FALLBACK hashing embedding`);
    return null;
  }
}

function fallbackEmbedding(content: string, dims: number): number[] {
  const vec = new Array<number>(dims);
  for (let i = 0; i < dims; i++) {
    const digest = createHash('sha256').update(`${content}\u0000${i}`).digest();
    const int = (digest[0]! | (digest[1]! << 8) | (digest[2]! << 16) | (digest[3]! << 24)) >>> 0;
    vec[i] = (int / 0xffffffff) * 2 - 1;
  }
  return l2Normalize(vec);
}

function buildContent(row: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of ['title', 'titleAr', 'description', 'provider', 'university', 'country', 'degree', 'fields', 'benefits']) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      const joined = value.filter(Boolean).join(', ');
      if (joined) parts.push(joined);
    } else if (String(value).trim() !== '') {
      parts.push(String(value));
    }
  }
  return parts.join('\n').trim();
}

interface PendingRow {
  id: string;
  entityType: 'scholarship' | 'university' | 'provider';
  content: string;
}

async function fetchPending(prisma: Awaited<ReturnType<typeof getPrisma>>, entity: string, limit: number): Promise<PendingRow[]> {
  const rows: PendingRow[] = [];
  if (entity === 'scholarship' || entity === 'all') {
    const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT
        s.id::text AS id,
        s.title, s.title_ar AS "titleAr", s.description, s.description_ar AS "descriptionAr",
        pr.name AS provider, un.name AS university, co.name AS country,
        dl.name AS degree,
        ARRAY(SELECT sf.name FROM study_fields sf JOIN scholarship_fields sj ON sj.study_field_id = sf.id WHERE sj.scholarship_id = s.id) AS fields,
        ARRAY(SELECT sb.benefit_type::text FROM scholarship_benefits sb WHERE sb.scholarship_id = s.id) AS benefits
      FROM scholarships s
      LEFT JOIN providers pr ON pr.id = s.provider_id
      LEFT JOIN universities un ON un.id = s.university_id
      LEFT JOIN countries co ON co.id = s.country_id
      LEFT JOIN degree_levels dl ON dl.id = s.degree_level_id
      WHERE s.needs_embedding = true AND s.deleted_at IS NULL
      ORDER BY s.created_at ASC
      LIMIT ${limit}
    `;
    for (const row of result) {
      const content = buildContent(row);
      if (!content) continue;
      rows.push({ id: String(row.id), entityType: 'scholarship', content });
    }
  }
  if (entity === 'university' || entity === 'all') {
    const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT u.id::text AS id, u.name, u.description, u.description_ar AS "descriptionAr", co.name AS country
      FROM universities u
      LEFT JOIN countries co ON co.id = u.country_id
      WHERE u.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM ai_embeddings e WHERE e.entity_type = 'university' AND e.entity_id = u.id)
      ORDER BY u.created_at ASC
      LIMIT ${limit}
    `;
    for (const row of result) {
      const content = buildContent(row);
      if (!content) continue;
      rows.push({ id: String(row.id), entityType: 'university', content });
    }
  }
  if (entity === 'provider' || entity === 'all') {
    const result = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT p.id::text AS id, p.name, p.description, p.name_ar AS "nameAr", co.name AS country
      FROM providers p
      LEFT JOIN countries co ON co.id = p.country_id
      WHERE p.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM ai_embeddings e WHERE e.entity_type = 'provider' AND e.entity_id = p.id)
      ORDER BY p.created_at ASC
      LIMIT ${limit}
    `;
    for (const row of result) {
      const content = buildContent(row);
      if (!content) continue;
      rows.push({ id: String(row.id), entityType: 'provider', content });
    }
  }
  return rows;
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const entity = flagString(flags, 'entity', 'all');
  if (!['all', 'scholarship', 'university', 'provider'].includes(entity)) {
    console.error('usage: npx tsx scripts/generateEmbeddings.ts [--entity all|scholarship|university|provider] [--limit N]');
    process.exit(2);
  }
  const limit = flagNumber(flags, 'limit', 100);
  const dims = flagNumber(flags, 'dims', DEFAULT_DIMS);
  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

  const prisma = getPrisma();
  const started = Date.now();
  const pending = await fetchPending(prisma, entity, limit);
  console.log('[embed] %d rows pending for entity=%s (limit=%d)', pending.length, entity, limit);

  let embedded = 0;
  let failed = 0;
  let fallback = 0;

  for (let i = 0; i < pending.length; i++) {
    const row = pending[i]!;
    const label = `${row.entityType}:${row.id}`;
    const apiResult = await callEmbeddingApi(row.content);
    let vector: number[];
    let provider: string;
    if (apiResult) {
      vector = l2Normalize(normalizeDims(apiResult.vector, dims));
      provider = apiResult.provider;
    } else {
      vector = fallbackEmbedding(row.content, dims);
      provider = 'OTHER';
      fallback += 1;
    }
    const contentHash = sha256(row.content);
    const vectorStr = `[${vector.join(',')}]`;
    try {
      await prisma.$executeRaw`
        INSERT INTO ai_embeddings (entity_type, entity_id, content, content_hash, embedding, provider, model, dimensions, updated_at)
        VALUES (${row.entityType}, ${row.id}::uuid, ${row.content}, ${contentHash}, CAST(${vectorStr} AS vector), ${provider}, ${model}, ${dims}, now())
        ON CONFLICT (entity_type, entity_id)
        DO UPDATE SET
          content = EXCLUDED.content,
          content_hash = EXCLUDED.content_hash,
          embedding = EXCLUDED.embedding,
          provider = EXCLUDED.provider,
          model = EXCLUDED.model,
          dimensions = EXCLUDED.dimensions,
          updated_at = now()
      `;
      if (row.entityType === 'scholarship') {
        await prisma.scholarship.update({ where: { id: row.id }, data: { needsEmbedding: false } });
      }
      embedded += 1;
      console.log('  %d/%d ok    %s (provider=%s dims=%d)', i + 1, pending.length, label, provider, vector.length);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error('  %d/%d FAIL  %s (%s)', i + 1, pending.length, label, message);
    }
  }

  console.log('[embed] done in %dms', Date.now() - started);
  console.log('  embedded   %d', fmt(embedded));
  console.log('  failed     %d', fmt(failed));
  console.log('  fallback   %d', fmt(fallback));
  console.log('  model      %s', model);

  process.exitCode = failed > 0 ? 1 : 0;
}

main()
  .catch((err) => {
    console.error('[embed] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
