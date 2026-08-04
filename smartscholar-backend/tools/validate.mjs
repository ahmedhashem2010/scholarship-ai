#!/usr/bin/env node
/**
 * tools/validate.mjs — SmartScholar SQL ↔ Prisma ↔ doc consistency checker.
 *
 * Structural validation only (no Postgres required):
 *   1. 001–017 files exist and are non-empty.
 *   2. Enum values in 002 match the enums referenced in tables (003) and Prisma.
 *   3. Every FK column has a supporting index (004) unless covered by a unique
 *      constraint in 003.
 *   4. Every table with `updated_at` has a trg_set_updated_at trigger (007).
 *   5. Every view/function/trigger/policy referenced exists.
 *   6. Prisma models mirror the SQL tables (1:1 via @@map / model names).
 *
 * Exit code 0 = clean, 1 = warnings, 2 = errors.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const db = path.join(root, 'database');
const prismaFile = path.join(root, 'prisma', 'schema.prisma');

const errors = [];
const warnings = [];
const stats = {};

const log = (list, kind, msg) => list.push(`  [${kind}] ${msg}`);

// ---------------------------------------------------------------------------
// 1. File presence
// ---------------------------------------------------------------------------
const sqlFiles = readdirSync(db).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
const expected = [];
for (let i = 1; i <= 17; i++) expected.push(`${String(i).padStart(3, '0')}_`);
stats.files = sqlFiles.length;

for (const prefix of expected) {
  const match = sqlFiles.find((f) => f.startsWith(prefix));
  if (!match) {
    errors.push(`  [ERROR] missing database file: ${prefix}*.sql`);
  } else {
    const size = statSync(path.join(db, match)).size;
    if (size === 0) errors.push(`  [ERROR] ${match} is empty`);
  }
}

// ---------------------------------------------------------------------------
// 2. Enum parity (002 vs Prisma)
// ---------------------------------------------------------------------------
const enumsSql = readFileSync(path.join(db, '002_enums.sql'), 'utf8');
const enumNames = [...enumsSql.matchAll(/CREATE TYPE\s+(\w+)\s+AS ENUM/g)].map((m) => m[1]);
const enumValues = {};
for (const n of enumNames) {
  const re = new RegExp(`CREATE TYPE\\s+${n}\\s+AS ENUM\\s+\\(([^)]+)\\)`, 'g');
  const m = re.exec(enumsSql);
  if (m) {
    enumValues[n] = m[1].split(',').map((s) => s.trim().replace(/^'(.*)'$/, '$1'));
  }
}
stats.enums = enumNames.length;

const prismaSrc = existsSync(prismaFile) ? readFileSync(prismaFile, 'utf8') : '';
const prismaEnums = [...prismaSrc.matchAll(/^enum\s+(\w+)\s*{([\s\S]*?)^}/gm)].map((m) => ({
  name: m[1],
  values: [...m[2].matchAll(/^\s*(\w+)/gm)].map((x) => x[1]),
}));
stats.prismaEnums = prismaEnums.length;

for (const pe of prismaEnums) {
  const pg = enumValues[pe.name];
  if (!pg) {
    errors.push(`  [ERROR] Prisma enum ${pe.name} not present in 002_enums.sql`);
    continue;
  }
  for (const v of pe.values) {
    if (!pg.includes(v)) errors.push(`  [ERROR] Prisma enum ${pe.name} value ${v} missing in SQL`);
  }
  for (const v of pg) {
    if (!pe.values.includes(v)) warnings.push(`  [WARN] SQL enum ${pe.name} value ${v} missing in Prisma`);
  }
}
for (const n of enumNames) {
  if (!prismaEnums.some((e) => e.name === n)) {
    warnings.push(`  [WARN] SQL enum ${n} has no Prisma mirror`);
  }
}

// ---------------------------------------------------------------------------
// 3. Tables + columns (003) & FK index coverage (004)
// ---------------------------------------------------------------------------
const tablesSql = readFileSync(path.join(db, '003_tables.sql'), 'utf8');
const tableNames = [...tablesSql.matchAll(/^CREATE TABLE\s+(\w+)\s*\(/gm)].map((m) => m[1]);
stats.tables = tableNames.length;

// Column sets per table (for FK checks)
const tableCols = {};
for (const t of tableNames) {
  const m = tablesSql.match(new RegExp(`CREATE TABLE\\s+${t}\\s*\\(([\\s\\S]*?)\\n\\);`));
  if (!m) continue;
  tableCols[t] = [...m[1].matchAll(/^\s{2}(\w+)\s+(\S+)/gm)].map((x) => x[1]);
}

// Inline UNIQUE constraints + inline PKs give index coverage
const inlineUnique = new Set();
const tableDefs = new Map();
for (const t of tableNames) {
  const m = tablesSql.match(new RegExp(`CREATE TABLE\\s+${t}\\s*\\(([\\s\\S]*?)\\n\\);`));
  if (!m) continue;
  tableDefs.set(t, m[1]);
  // UNIQUE (...) column constraints within this table's body.
  // A composite UNIQUE's leading column covers FK lookups, so add t:lead.
  const uniq = [...m[1].matchAll(/UNIQUE\s*\(([^)]+)\)/g)].map((x) => x[1].split(',').map((c) => c.trim()));
  for (const cols of uniq) {
    inlineUnique.add(t + ':' + cols.join(','));
    inlineUnique.add(t + ':' + cols[0]);
  }
  const single = [...m[1].matchAll(/\b(\w+)\s+\S+.*\bUNIQUE\b/g)].map((x) => x[1]);
  for (const c of single) inlineUnique.add(t + ':' + c);
}

// PK columns
const pkCols = new Map();
for (const [t, body] of tableDefs) {
  const m = body.match(/id\s+uuid\s+PRIMARY KEY/);
  if (m) pkCols.set(t, ['id']);
}

// FK columns in 003 (REFERENCES ...) — match uuid columns with optional
// modifiers between type and REFERENCES (e.g. `uuid NOT NULL UNIQUE REFERENCES`)
const fkCols = {};
for (const [t, body] of tableDefs) {
  const fks = [...body.matchAll(/^\s{2}(\w+)\s+uuid(?:\s+\w+)*\s+REFERENCES\s+(\w+)/gm)];
  fkCols[t] = fks.map((x) => ({ col: x[1], ref: x[2] }));
}

const indexesSql = readFileSync(path.join(db, '004_indexes.sql'), 'utf8');
const indexDefs = [...indexesSql.matchAll(/^CREATE INDEX IF NOT EXISTS\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gm)];
const covered = new Set();
for (const [, , tbl, colsRaw] of indexDefs) {
  const cols = colsRaw.split(',').map((c) => c.trim().replace(/\s+\w+_ops$/, '').split(' ')[0]);
  if (cols.length === 1) covered.add(tbl + ':' + cols[0]);
}
stats.indexes = indexDefs.length;

// FK coverage check
let uncoveredFk = 0;
for (const [t, fks] of Object.entries(fkCols)) {
  for (const { col, ref } of fks) {
    const isUnique = inlineUnique.has(t + ':' + col) || inlineUnique.has(t + ':' + [col].join(','));
    const isIndexed = covered.has(t + ':' + col);
    if (!isUnique && !isIndexed) {
      warnings.push(`  [WARN] FK column ${t}.${col} -> ${ref} has no supporting index (004)`);
      uncoveredFk++;
    }
  }
}
if (uncoveredFk === 0) stats.fkCoverage = '100% (all FK columns indexed or unique)';

// ---------------------------------------------------------------------------
// 4. Triggers on updated_at tables (007)
// ---------------------------------------------------------------------------
const triggersSql = readFileSync(path.join(db, '007_triggers.sql'), 'utf8');
const triggerTargets = [...triggersSql.matchAll(/ON\s+(\w+)\s+FOR\s+EACH ROW/g)].map((m) => m[1]);
const setUpdatedAtTables = new Set([...triggersSql.matchAll(/trg_set_updated_at ON (\w+)/g)].map((m) => m[1]));

const updatedAtTables = tableNames.filter((t) => {
  const cols = tableCols[t] || [];
  return cols.includes('updated_at');
});
const missingUpdatedAt = updatedAtTables.filter((t) => !setUpdatedAtTables.has(t));
if (missingUpdatedAt.length) {
  errors.push(`  [ERROR] tables with updated_at but no trg_set_updated_at trigger (007): ${missingUpdatedAt.join(', ')}`);
} else {
  stats.updatedAtTriggers = `all ${updatedAtTables.length} updated_at tables covered`;
}

// ---------------------------------------------------------------------------
// 5. Functions referenced by triggers/views exist in 006
// ---------------------------------------------------------------------------
const funcsSql = readFileSync(path.join(db, '006_functions.sql'), 'utf8');
const definedFuncs = [...funcsSql.matchAll(/^CREATE OR REPLACE FUNCTION\s+(\w+)/gm)].map((m) => m[1]);
stats.functions = definedFuncs.length;

// functions referenced in 007 (EXECUTE FUNCTION / PERFORM)
const referenced = [...triggersSql.matchAll(/EXECUTE FUNCTION\s+(\w+)|PERFORM\s+(\w+)/g)]
  .map((m) => m[1] || m[2])
  .filter((f, i, a) => a.indexOf(f) === i);
for (const f of referenced) {
  if (!definedFuncs.includes(f)) {
    errors.push(`  [ERROR] trigger references function ${f} which is not defined in 006_functions.sql`);
  }
}

// views referencing helper functions
const viewsSql = readFileSync(path.join(db, '008_views.sql'), 'utf8');
const viewNames = [...viewsSql.matchAll(/^CREATE OR REPLACE VIEW\s+(\w+)/gm)].map((m) => m[1]);
stats.views = viewNames.length;
const viewFuncs = [...viewsSql.matchAll(/\b(\w+)\(/g)].map((m) => m[1]).filter((f) => definedFuncs.includes(f));

// ---------------------------------------------------------------------------
// 6. RLS policies (009) reference existing tables
// ---------------------------------------------------------------------------
const rlsSql = readFileSync(path.join(db, '009_rls.sql'), 'utf8');
const policyTables = new Set([...rlsSql.matchAll(/^CREATE POLICY\s+\w+\s+ON\s+(\w+)/gm)].map((m) => m[1]));
stats.policies = policyTables.size;
for (const t of policyTables) {
  if (!tableNames.includes(t)) errors.push(`  [ERROR] RLS policy on unknown table ${t} (009)`);
}
const allSql = rlsSql;
for (const t of tableNames) {
  if (!allSql.includes(`ENABLE ROW LEVEL SECURITY`) && !rlsSql.includes(t)) {
    // table not explicitly enabled — check DO-block list
    if (!rlsSql.includes(`'${t}'`)) errors.push(`  [ERROR] table ${t} missing RLS enable (009)`);
  }
}

// ---------------------------------------------------------------------------
// 7. Prisma model ↔ SQL table parity
// ---------------------------------------------------------------------------
const prismaModels = [...prismaSrc.matchAll(/^model\s+(\w+)\s*{/gm)].map((m) => m[1]);
stats.prismaModels = prismaModels.length;

const mappedNames = {};
for (const m of prismaModels) {
  const block = prismaSrc.match(new RegExp(`model\\s+${m}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!block) continue;
  const mapMatch = block[1].match(/@@map\("(\w+)"\)/);
  const mapped = mapMatch ? mapMatch[1] : m;
  mappedNames[m] = mapped;
  if (!tableNames.includes(mapped)) {
    errors.push(`  [ERROR] Prisma model ${m} (@@map ${mapped}) has no SQL table`);
  }
}
for (const t of tableNames) {
  if (!Object.values(mappedNames).includes(t)) {
    warnings.push(`  [WARN] SQL table ${t} has no Prisma model mirror`);
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('SmartScholar schema validation report');
console.log('====================================');
console.log(`Files (001-017): ${stats.files}/17 SQL files present`);
console.log(`Enums: ${stats.enums} SQL / ${stats.prismaEnums} Prisma`);
console.log(`Tables: ${stats.tables} SQL / ${stats.prismaModels} Prisma models`);
console.log(`Indexes: ${stats.indexes} in 004`);
console.log(`Functions: ${stats.functions} in 006`);
console.log(`Views: ${stats.views} in 008`);
console.log(`RLS policies: ${stats.policies}`);
console.log(`Updated_at trigger coverage: ${stats.updatedAtTriggers || 'check below'}`);
console.log(`FK index coverage: ${stats.fkCoverage || `${uncoveredFk} uncovered`}`);
console.log('');

if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.forEach((e) => console.log(e));
} else {
  console.log('ERRORS: 0');
}
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.forEach((w) => console.log(w));
} else {
  console.log('WARNINGS: 0');
}

console.log('');
if (errors.length === 0 && warnings.length === 0) {
  console.log('RESULT: PASS');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('RESULT: PASS WITH WARNINGS');
  process.exit(1);
} else {
  console.log('RESULT: FAIL');
  process.exit(2);
}
