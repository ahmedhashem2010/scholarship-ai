import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";

/**
 * Derives structured eligibility data from free-text fields that ARE populated.
 *
 *   node scripts/enrich-scholarships.mjs --dry     # preview (default)
 *   node scripts/enrich-scholarships.mjs --apply   # write changes
 *
 * This does NOT replace human verification. It closes the gap that can be
 * closed deterministically — every scraped record has a `degree` string and a
 * `description`, but empty `eligibleEducation` / `fieldOfStudy` arrays, which
 * made the matcher unable to reason about 83% of the catalogue.
 *
 * Only fills fields that are currently EMPTY. Never overwrites curated data.
 */

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

/** "Bachelor / Master / PhD" -> ["BACHELOR","MASTER","PHD"] */
function educationFromDegree(degree) {
  if (!degree) return [];
  const d = degree.toLowerCase();
  const out = new Set();
  if (/bachelor|undergrad|licence|بكالوريوس/.test(d)) out.add("BACHELOR");
  if (/master|msc|ma\b|mba|ماجستير/.test(d)) out.add("MASTER");
  if (/phd|doctora|dphil|دكتوراه/.test(d)) out.add("PHD");
  if (/diploma|certificate/.test(d)) out.add("DIPLOMA");
  if (/exchange|summer|short.?term|training/.test(d)) out.add("EXCHANGE");
  return [...out];
}

/**
 * Field-of-study keywords. Deliberately conservative — a wrong field is worse
 * than an absent one, because it produces a confident but false match.
 */
const FIELD_PATTERNS = [
  [/\b(engineering|engineer)\b/i, "Engineering"],
  [/\b(computer science|computing|informatics|software|artificial intelligence|data science)\b/i, "Computer Science"],
  [/\b(medicine|medical|health science|nursing|pharmacy|dentistry)\b/i, "Medicine & Health"],
  [/\b(business|management|mba|finance|accounting|economics)\b/i, "Business & Economics"],
  [/\b(law|legal studies|jurisprudence)\b/i, "Law"],
  [/\b(agricultur|veterinary|food science)\b/i, "Agriculture"],
  [/\b(education|teaching|pedagog)\b/i, "Education"],
  [/\b(art|design|architecture|music|film)\b/i, "Arts & Design"],
  [/\b(social science|sociology|anthropolog|political science|international relations)\b/i, "Social Sciences"],
  [/\b(physics|chemistry|biology|mathematics|natural science)\b/i, "Natural Sciences"],
  [/\b(environment|sustainab|climate|renewable energy)\b/i, "Environmental Studies"],
  [/\b(journalism|media studies|communication)\b/i, "Media & Communication"],
];

function fieldsFromText(text) {
  if (!text) return [];
  const out = new Set();
  for (const [re, label] of FIELD_PATTERNS) {
    if (re.test(text)) out.add(label);
  }
  // "all fields" phrasing is common and meaningful — record it explicitly.
  if (/\b(all (academic )?fields|any field|all disciplines|all majors|all specialties)\b/i.test(text)) {
    return ["ANY"];
  }
  return [...out];
}

/** Only extract nationality rules we can state with confidence. */
function countriesFromText(text) {
  if (!text) return [];
  if (/\b(open to (all|students from all) (nationalities|countries)|all nationalities|international students from any country|any nationality)\b/i.test(text)) {
    return ["ALL"];
  }
  return [];
}

function docsFromText(text) {
  if (!text) return [];
  const out = new Set();
  if (/\b(cv|curriculum vitae|resume)\b/i.test(text)) out.add("CV");
  if (/\b(motivation letter|statement of purpose|personal statement|cover letter)\b/i.test(text)) out.add("MOTIVATION_LETTER");
  if (/\b(recommendation letter|reference letter|letters? of recommendation)\b/i.test(text)) out.add("RECOMMENDATION_LETTER");
  if (/\b(transcript|academic record|certificate of grades)\b/i.test(text)) out.add("TRANSCRIPT");
  if (/\b(research proposal)\b/i.test(text)) out.add("RESEARCH_PROPOSAL");
  if (/\b(passport)\b/i.test(text)) out.add("PASSPORT");
  if (/\b(ielts|toefl|english proficiency|language certificate)\b/i.test(text)) out.add("ENGLISH_TEST");
  return [...out];
}

function englishFromText(text) {
  if (!text) return null;
  const ielts = text.match(/ielts[^\d]{0,20}(\d(?:\.\d)?)/i);
  if (ielts?.[1]) return `IELTS ${ielts[1]}`;
  const toefl = text.match(/toefl[^\d]{0,20}(\d{2,3})/i);
  if (toefl?.[1]) return `TOEFL ${toefl[1]}`;
  if (/\bno (ielts|toefl|english (test|certificate))\b/i.test(text)) return "NOT_REQUIRED";
  return null;
}

async function main() {
  const all = await prisma.scholarship.findMany();
  console.log(`\nScanning ${all.length} scholarships…\n`);

  const updates = [];

  for (const s of all) {
    const text = [s.description, s.requirements, s.benefits].filter(Boolean).join("\n");
    const patch = {};

    if (s.eligibleEducation.length === 0) {
      const edu = educationFromDegree(s.degree);
      if (edu.length) patch.eligibleEducation = edu;
    }
    if (s.fieldOfStudy.length === 0) {
      const f = fieldsFromText(text);
      if (f.length) patch.fieldOfStudy = f;
    }
    if (s.eligibleCountries.length === 0) {
      const c = countriesFromText(text);
      if (c.length) patch.eligibleCountries = c;
    }
    if (s.requiredDocuments.length === 0) {
      const d = docsFromText(text);
      if (d.length) patch.requiredDocuments = d;
    }
    if (!s.englishRequirement) {
      const e = englishFromText(text);
      if (e) patch.englishRequirement = e;
    }

    if (Object.keys(patch).length > 0) {
      updates.push({ id: s.id, name: s.nameEn, patch });
    }
  }

  const counts = {};
  for (const u of updates) {
    for (const k of Object.keys(u.patch)) counts[k] = (counts[k] ?? 0) + 1;
  }

  console.log("Fields that can be filled automatically:");
  for (const [k, v] of Object.entries(counts)) {
    console.log(`   ${k.padEnd(22)} ${v} records`);
  }
  console.log(`\n${updates.length} of ${all.length} records would be updated.`);

  console.log("\nSample (first 5):");
  for (const u of updates.slice(0, 5)) {
    console.log(`\n  ${u.name.slice(0, 70)}`);
    for (const [k, v] of Object.entries(u.patch)) {
      console.log(`     ${k}: ${JSON.stringify(v)}`);
    }
  }

  if (!APPLY) {
    console.log("\n(dry run — nothing written. Re-run with --apply to save.)\n");
    return;
  }

  let done = 0;
  for (const u of updates) {
    await prisma.scholarship.update({ where: { id: u.id }, data: u.patch });
    done++;
    if (done % 25 === 0) console.log(`   …${done}/${updates.length}`);
  }
  console.log(`\n✓ Updated ${done} scholarships.`);
  console.log("  These are INFERRED, not verified. isVerified stays false —");
  console.log("  a human still needs to confirm against the source URL.\n");
}

main()
  .catch((e) => {
    console.error("Enrichment failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
