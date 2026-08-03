#!/usr/bin/env node
/**
 * tools/generate-prisma.mjs — Generates Prisma enum/model blocks for SQL tables
 * not yet mirrored in prisma/schema.prisma. Emits ONLY missing pieces (scalar
 * fields, no relations) so the hand-tuned core models stay untouched.
 *
 * Usage: node tools/generate-prisma.mjs [--enums-only] [--write]
 *        --write  appends generated blocks to prisma/schema.prisma
 *        (default prints to stdout)
 */
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const db = path.join(root, 'database');
const prismaFile = path.join(root, 'prisma', 'schema.prisma');

const write = process.argv.includes('--write');

// --- read SQL ---
const enumsSql = readFileSync(path.join(db, '002_enums.sql'), 'utf8');
const tablesSql = readFileSync(path.join(db, '003_tables.sql'), 'utf8');

// --- parse enums ---
const enumNames = [...enumsSql.matchAll(/CREATE TYPE\s+(\w+)\s+AS ENUM\s+\(([^)]+)\)/g)]
  .map((m) => ({ name: m[1], values: m[2].split(',').map((s) => s.trim().replace(/^'(.*)'$/, '$1')) }));

// --- parse tables ---
const tableNames = [...tablesSql.matchAll(/^CREATE TABLE\s+(\w+)\s*\(/gm)].map((m) => m[1]);

function parseTable(name) {
  const m = tablesSql.match(new RegExp(`CREATE TABLE\\s+${name}\\s*\\(([\\s\\S]*?)\\n\\);`));
  if (!m) return null;
  const body = m[1];
  const rows = body.split('\n').map((l) => l.trim());
  const cols = [];
  const uniques = [];
  for (const row of rows) {
    const um = row.match(/^UNIQUE\s*\(([^)]+)\)/);
    if (um) {
      uniques.push(um[1].split(',').map((s) => s.trim()));
      continue;
    }
    const cm = row.match(/^(\w+)\s+(.+)$/);
    if (!cm) continue;
    const cname = cm[1];
    const rest = cm[2];
    // skip table-level constraints (no type keyword)
    if (/^(CONSTRAINT|PRIMARY KEY|FOREIGN KEY|CHECK|REFERENCES)\b/.test(rest)) continue;
    if (/^GENERATED ALWAYS AS/.test(rest)) {
      cols.push({ name: cname, type: 'tsvector', generated: true, rest });
      continue;
    }
    cols.push({ name: cname, type: rest });
  }
  return { cols, uniques };
}

// --- type mapping ---
const enumSet = new Set(enumNames.map((e) => e.name));

function mapType(raw, isPk) {
  const rest = raw.trim().replace(/,$/, '');
  // nullability / defaults / constraints
  let nullable = !/NOT NULL/.test(rest) && !isPk;
  let defaultRaw = rest.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT NULL|UNIQUE|PRIMARY KEY|REFERENCES)\b|$)/)?.[1];
  // type token: word + optional (...) + optional []
  const tm = rest.match(/^(\w+(?:\([^)]*\))?(?:\[\])?)(?:\s|$)/);
  if (!tm) throw new Error(`no type token in "${rest}"`);
  let typeRaw = tm[1];

  let prisma = '';
  let attr = '';
  const low = typeRaw.toLowerCase();

  if (enumSet.has(typeRaw)) {
    prisma = typeRaw;
    if (defaultRaw && /^'[\w ]+'$/.test(defaultRaw.trim())) {
      attr = ` @default(${defaultRaw.trim().replace(/^'|'$/g, '')})`;
      defaultRaw = null;
    }
  } else if (low === 'uuid') {
    prisma = 'String';
    attr = ' @db.Uuid';
  } else if (low.startsWith('uuid[]')) {
    prisma = 'String[]';
    attr = ' @db.Uuid';
  } else if (low.startsWith('varchar(')) {
    const n = low.match(/varchar\((\d+)\)/)[1];
    prisma = 'String';
    attr = ` @db.VarChar(${n})`;
  } else if (low === 'text') {
    prisma = 'String';
  } else if (low === 'text[]') {
    prisma = 'String[]';
  } else if (low === 'char(64)') {
    prisma = 'String';
    attr = ' @db.Char(64)';
  } else if (low === 'smallint') {
    prisma = 'Int';
    attr = ' @db.SmallInt';
  } else if (low === 'int' || low === 'integer') {
    prisma = 'Int';
  } else if (low === 'bigint') {
    prisma = 'BigInt';
  } else if (low.startsWith('numeric(')) {
    const [p, s] = low.match(/numeric\((\d+),(\d+)\)/).slice(1);
    prisma = 'Decimal';
    attr = ` @db.Decimal(${p}, ${s})`;
    if (defaultRaw) {
      const d = defaultRaw.trim();
      attr += ` @default("${d.replace(/\.0+$/, '')}")`;
      defaultRaw = null;
    }
  } else if (low === 'bool' || low === 'boolean') {
    prisma = 'Boolean';
  } else if (low === 'date') {
    prisma = 'DateTime';
    attr = ' @db.Date';
  } else if (low === 'timestamptz' || low === 'timestamp') {
    prisma = 'DateTime';
    attr = ' @db.Timestamptz';
  } else if (low === 'jsonb' || low === 'json') {
    prisma = 'Json';
  } else if (low === 'inet') {
    prisma = 'String';
    attr = ' @db.Inet';
  } else if (low === 'tsvector') {
    prisma = 'Unsupported("tsvector")';
  } else if (low.startsWith('vector(')) {
    const d = low.match(/vector\((\d+)\)/)[1];
    prisma = `Unsupported("vector(${d})")`;
  } else {
    throw new Error(`unmapped type ${typeRaw}`);
  }

  // defaults
  if (defaultRaw) {
    const d = defaultRaw.trim();
    if (/^gen_random_uuid\(\)$/.test(d)) attr += ' @default(dbgenerated("gen_random_uuid()"))';
    else if (/^now\(\)$/.test(d)) attr += ' @default(now())';
    else if (/^true$/.test(d)) attr += ' @default(true)';
    else if (/^false$/.test(d)) attr += ' @default(false)';
    else if (/^[-0-9.]+$/.test(d)) attr += ` @default(${d})`;
    else if (d === "ARRAY[]::text[]" || d === "'{}'::text[]" || d === "'{}'::uuid[]" || d === "'{}'") {
      attr += prisma === 'Json' ? ' @default("{}")' : ' @default([])';
    } else if (d === "'{}'::jsonb" || d === "'{}'::json") {
      attr += prisma === 'Json' ? ' @default("{}")' : ' @default([])';
    } else if (/^'[^']*'$/.test(d)) {
      const s = d.slice(1, -1);
      attr += ` @default("${s}")`;
    }
  }

  if (isPk) attr += ' @id';
  return { prisma, attr, nullable };
}

// --- existing prisma names ---
const prismaSrc = existsSync(prismaFile) ? readFileSync(prismaFile, 'utf8') : '';
const existingModels = [...prismaSrc.matchAll(/^model\s+(\w+)\s*{/gm)].map((m) => m[1]);
const existingEnums = [...prismaSrc.matchAll(/^enum\s+(\w+)\s*{/gm)].map((m) => m[1]);
const mappedNames = {};
for (const m of existingModels) {
  const block = prismaSrc.match(new RegExp(`model\\s+${m}\\s*\\{([\\s\\S]*?)\\n\\}`));
  if (!block) continue;
  const mm = block[1].match(/@@map\("(\w+)"\)/);
  mappedNames[m] = mm ? mm[1] : m;
}

const missingEnums = enumNames.filter((e) => !existingEnums.includes(e.name));
const missingTables = tableNames.filter((t) => !Object.values(mappedNames).includes(t));

let out = '\n// =============================================================================\n';
out += '// AUTO-GENERATED by tools/generate-prisma.mjs — mirrors of SQL tables 003_tables.sql\n';
out += '// Do not hand-edit. Re-run the generator when 003 changes.\n';
out += '// =============================================================================\n';

for (const e of missingEnums) {
  out += `\nenum ${e.name} {\n`;
  for (const v of e.values) out += `  ${v}\n`;
  out += '}\n';
}

function prismaModelName(t) {
  const camel = t.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

for (const t of missingTables) {
  const parsed = parseTable(t);
  if (!parsed) { console.error(`[skip] could not parse ${t}`); continue; }
  const { cols, uniques } = parsed;
  out += `\nmodel ${prismaModelName(t)} {\n`;
  for (const c of cols) {
    let mapped;
    if (c.generated) {
      out += `  ${c.name}       Unsupported("tsvector")? @map("${c.name}")\n`;
      continue;
    }
    let res;
    const isPk = c.name === 'id' && /PRIMARY KEY/.test(c.type);
    try { res = mapType(c.type, isPk); } catch (err) { console.error(`[skip] ${t}.${c.name}: ${err.message}`); continue; }
    const field = c.name.replace(/_([a-z])/g, (_, x) => x.toUpperCase());
    const mapAttr = c.name !== field ? ` @map("${c.name}")` : '';
    const opt = res.nullable && !res.prisma.endsWith('[]') ? '?' : '';
    out += `  ${field}      ${res.prisma}${opt}${res.attr}${mapAttr}\n`;
  }
  for (const u of uniques) {
    const colsP = u.map((c) => c.replace(/_([a-z])/g, (_, x) => x.toUpperCase()));
    out += `\n  @@unique([${colsP.join(', ')}])\n`;
  }
  out += `\n  @@map("${t}")\n`;
  out += '}\n';
}

if (write) {
  appendFileSync(prismaFile, out, 'utf8');
  console.log(`[written] ${missingEnums.length} enums, ${missingTables.length} models appended to ${prismaFile}`);
} else {
  console.log(`missing enums (${missingEnums.length}): ${missingEnums.map((e) => e.name).join(', ')}`);
  console.log(`missing tables (${missingTables.length}): ${missingTables.join(', ')}`);
  console.log('\n--- generated ---');
  process.stdout.write(out);
}
