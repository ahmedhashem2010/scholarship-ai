import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";

/**
 * Repairs UTF-8 mojibake in scraped scholarship text.
 *
 *   node scripts/fix-encoding.mjs           # preview
 *   node scripts/fix-encoding.mjs --apply   # write
 *
 * The original scrape read UTF-8 bytes as Windows-1252, so every non-ASCII
 * character became a short sequence of Latin-1 glyphs. Curly apostrophes are
 * the most visible casualty — "Bachelor's" became "Bachelorâ€™s", which the
 * dashboard was rendering as "elorâ□□s".
 *
 * The fix is the inverse transform: take the string's characters as
 * Windows-1252 bytes and decode those bytes as UTF-8.
 */

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

/** Cheap detector: these sequences essentially never occur in clean text. */
const MOJIBAKE = /â€™|â€œ|â€|â€"|â€"|â€¦|Ã©|Ã¨|Ã¡|Ã­|Ã³|Ãº|Ã±|Â£|Â€|Â©|Â®|Â°|Â\s|â€|Ã¢/;

function looksCorrupted(v) {
  return typeof v === "string" && MOJIBAKE.test(v);
}

/**
 * Reverse a UTF-8-read-as-CP1252 round trip.
 *
 * Node has no CP1252 decoder built in, but the printable range maps to Latin-1
 * apart from 0x80–0x9F. Map those back explicitly, then reinterpret as UTF-8.
 */
const CP1252_HIGH = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84,
  "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

function repair(str) {
  if (typeof str !== "string" || !str) return str;
  try {
    const bytes = [];
    for (const ch of str) {
      const code = ch.codePointAt(0);
      if (CP1252_HIGH[ch] !== undefined) bytes.push(CP1252_HIGH[ch]);
      else if (code <= 0xff) bytes.push(code);
      else return str; // Real multi-byte content — leave it alone.
    }
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(bytes)
    );
    // Only accept the repair if it actually removed the corruption.
    return MOJIBAKE.test(decoded) ? str : decoded;
  } catch {
    return str; // Not valid UTF-8 — don't make it worse.
  }
}

const FIELDS = ["nameEn", "nameAr", "description", "benefits", "requirements", "university"];

async function main() {
  const all = await prisma.scholarship.findMany();
  const updates = [];

  for (const s of all) {
    const patch = {};
    for (const f of FIELDS) {
      const v = s[f];
      if (!looksCorrupted(v)) continue;
      const fixed = repair(v);
      if (fixed !== v) patch[f] = fixed;
    }
    if (Object.keys(patch).length) updates.push({ id: s.id, name: s.nameEn, patch });
  }

  console.log(`\nScanned ${all.length} scholarships.`);
  console.log(`${updates.length} have repairable encoding corruption.\n`);

  const byField = {};
  for (const u of updates) {
    for (const k of Object.keys(u.patch)) byField[k] = (byField[k] ?? 0) + 1;
  }
  for (const [k, v] of Object.entries(byField)) {
    console.log(`   ${k.padEnd(14)} ${v} records`);
  }

  console.log("\nSample repairs:");
  for (const u of updates.slice(0, 5)) {
    for (const [k, v] of Object.entries(u.patch)) {
      const before = String(all.find((x) => x.id === u.id)[k]).slice(0, 70);
      console.log(`\n   ${k}`);
      console.log(`     before: ${before}`);
      console.log(`     after:  ${String(v).slice(0, 70)}`);
      break;
    }
  }

  if (!APPLY) {
    console.log("\n(preview only — re-run with --apply to write)\n");
    return;
  }

  let n = 0;
  for (const u of updates) {
    await prisma.scholarship.update({ where: { id: u.id }, data: u.patch });
    if (++n % 25 === 0) console.log(`   …${n}/${updates.length}`);
  }
  console.log(`\n✓ Repaired ${n} scholarships.\n`);
}

main()
  .catch((e) => {
    console.error("Encoding repair failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
