import "./_env.mjs";
import { requireEnv } from "./_env.mjs";
requireEnv("DATABASE_URL");
import { PrismaClient } from "@prisma/client";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Re-scrapes for9a.com opportunity pages to recover the structured eligibility
 * data the original scraper skipped.
 *
 *   node scripts/rescrape-for9a.mjs --fetch        # download pages to cache
 *   node scripts/rescrape-for9a.mjs --parse        # parse cache, preview only
 *   node scripts/rescrape-for9a.mjs --parse --apply# parse cache, write to DB
 *   node scripts/rescrape-for9a.mjs --fetch --parse --apply   # all in one
 *
 * Options:
 *   --limit N      only process N records (test with --limit 5 first)
 *   --overwrite    replace existing values (default: only fills EMPTY fields)
 *   --delay MS     ms between requests (default 1500)
 *
 * WHY THIS EXISTS
 * The original scrape captured title, description and sometimes a deadline,
 * then dropped every structured block on the page. The result: 195 records with
 * 100% empty eligibleCountries / eligibleEducation / fieldOfStudy /
 * requiredDocuments. A for9a page actually carries all of it:
 *
 *     ## Applicant criteria
 *     Nationality  No specific nationality required     -> eligibleCountries
 *     Age          18 - 60                              -> min/maximumAge
 *     ## Opportunity criteria
 *     Degree       Master                               -> eligibleEducation
 *     Deadline     2027-05-01 | available | Ongoing     -> deadline + type
 *     Opens: Oct 1, 2026  Closes: May 2, 2027           -> applicationOpenDate
 *     ## Eligibility Countries                          -> eligibleCountries
 *     - Egypt, Arab Republic ...                           (55 of them!)
 *     ## Benefits                                       -> benefits
 *     ## Eligibility criteria                           -> requirements
 *
 * BE POLITE. Default delay is 1.5s between requests — ~5 minutes for 195 pages.
 * Don't lower it. Pages are cached in .scrape-cache/ so re-parsing is free;
 * you should only ever need to --fetch once.
 *
 * NOTE ON TERMS: you're re-fetching pages you already scraped. Check for9a's
 * terms before relying on this commercially, keep the sourceUrl attribution
 * that's already in your schema, and consider linking back to them.
 */

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const DO_FETCH = args.includes("--fetch");
const DO_PARSE = args.includes("--parse");
const APPLY = args.includes("--apply");
const OVERWRITE = args.includes("--overwrite");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? parseInt(args[i + 1], 10) : Infinity;
})();
const DELAY_MS = (() => {
  const i = args.indexOf("--delay");
  return i >= 0 ? parseInt(args[i + 1], 10) : 1500;
})();

const CACHE_DIR = ".scrape-cache";
const UA =
  "Mozilla/5.0 (compatible; SmartScholarBot/1.0; +refreshing previously collected listings)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cacheKey = (url) => url.replace(/[^a-zA-Z0-9]/g, "_").slice(-150) + ".html";

// ---------------------------------------------------------------------------
// HTML -> text
// ---------------------------------------------------------------------------

/**
 * for9a is a Next.js app. The rendered HTML contains everything we need, but
 * it's easier to reason about as plain text with structure preserved.
 */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<h([1-6])[^>]*>/gi, "\n## ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Cuts the shared page furniture off the end of the document.
 *
 * for9a's footer contains their ENTIRE site navigation — "Opportunities for
 * Science", "Opportunities for Law and Human Rights", "Medicine, Nursing and
 * Medical Sciences", every country they list, and so on. Any keyword scan that
 * reaches the footer will match nearly every category, which produced a nursing
 * scholarship tagged as Engineering + Law + Business on the very first test.
 *
 * Everything from the first of these markers is discarded.
 */
const BOILERPLATE_MARKERS = [
  "## Specifications",
  "Show More Countries",
  "## Opportunities\n",
  "## Courses Opportunities",
  "## Opportunities by Speciality",
  "## Scholarships by Location",
  "## Opportunities by location",
  "## Links",
  "Follow us on telegram",
  "\nTags\n",
];

function stripBoilerplate(text) {
  let cut = text.length;
  for (const marker of BOILERPLATE_MARKERS) {
    const i = text.indexOf(marker);
    if (i !== -1 && i < cut) cut = i;
  }
  return text.slice(0, cut);
}

/**
 * Text under "## Heading" up to the next "##".
 *
 * The heading pattern MUST be wrapped in a non-capturing group. Without it an
 * alternation like "Eligibility Countries|Countries" binds across the whole
 * regex — `##\s*Eligibility Countries` OR `Countries\s*\n(...)` — so the
 * capture group only exists on the last branch and the block silently never
 * matches. That bug cost us the 55-country eligibility lists.
 */
function section(text, headingPattern) {
  const re = new RegExp(`##\\s*(?:${headingPattern})\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, "i");
  return text.match(re)?.[1]?.trim() ?? null;
}

/** Bullet items from a chunk of text. */
function bullets(chunk) {
  if (!chunk) return [];
  return chunk
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter((l) => l.length > 1 && l.length < 200);
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

const MENA = [
  "Egypt", "Saudi Arabia", "Jordan", "Lebanon", "Palestine", "Syria", "Morocco",
  "Tunisia", "Algeria", "Libya", "Sudan", "Iraq", "Yemen", "Kuwait", "Qatar",
  "Bahrain", "Oman", "United Arab Emirates", "Mauritania", "Somalia", "Djibouti",
];

function normaliseCountry(raw) {
  const c = raw.replace(/\(.*?\)/g, "").replace(/,.*$/, "").trim();
  const map = {
    "Egypt": "Egypt",
    "Arab Republic": "Egypt",
    "United States of America": "United States",
    "UK": "United Kingdom",
    "Cote d'Ivoire": "Ivory Coast",
  };
  return map[c] ?? c;
}

function extractCountries(text) {
  // Explicit country list block — the richest source.
  const listBlock =
    section(text, "Eligibility Countries") ??
    section(text, "Eligible Countries") ??
    section(text, "Eligible Nationalities") ??
    section(text, "Countries");
  if (listBlock) {
    const items = bullets(listBlock)
      .map(normaliseCountry)
      .filter((c) => /^[A-Z][A-Za-z .'-]{2,40}$/.test(c));
    if (items.length >= 2) return [...new Set(items)];
  }
  // Residency restrictions override for9a's "Nationality" field.
  //
  // for9a contradicts itself on domestic awards: the Nationality widget says
  // "No specific nationality required" while the eligibility text says
  // "Applicants must be residents of the United States". Trusting the widget
  // told an Egyptian student they qualified for a Florida nursing grant.
  const eligText = [
    section(text, "Eligibility criteria"),
    section(text, "Eligibility"),
    section(text, "Program Details"),
  ].filter(Boolean).join("\n");

  const residency = eligText.match(
    /(?:must be|be a|open to|restricted to|available to)\s+(?:legal\s+|permanent\s+)?residents?\s+of\s+(?:the\s+)?([A-Z][A-Za-z ]{2,30})/
  );
  if (residency?.[1]) {
    return [normaliseCountry(residency[1].trim())];
  }
  if (/\b(?:U\.?S\.?|United States) citizens?\b|\bdomestic students only\b/i.test(eligText)) {
    return ["United States"];
  }

  // "Nationality  No specific nationality required"
  if (/Nationality\s*No specific nationality required/i.test(text)) return ["ALL"];
  const nat = text.match(/Nationality\s*\n?\s*([^\n]{3,120})/i)?.[1]?.trim();
  if (nat && !/no specific/i.test(nat)) {
    const parts = nat.split(/[,،]| and /).map(normaliseCountry).filter(Boolean);
    if (parts.length) return [...new Set(parts)];
  }
  if (/open to (students from )?all (nationalities|countries)/i.test(text)) return ["ALL"];
  // Fall back to scanning for MENA mentions in an eligibility context.
  const elig =
    (section(text, "Eligibility criteria") ?? "") + "\n" + (section(text, "Eligibility") ?? "");
  const found = MENA.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(elig));
  return found.length ? found : [];
}

function extractAges(text) {
  if (/Age\s*\n?\s*-?\s*No specific age required/i.test(text)) return { min: null, max: null };
  const range = text.match(/Age\s*\n?\s*-?\s*(\d{2})\s*[-–]\s*(\d{2})/i);
  if (range) return { min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
  const under = text.match(/(?:under|below|not exceed(?:ing)?|maximum age of)\s*(\d{2})/i);
  const over = text.match(/(?:at least|minimum age of|over)\s*(\d{2})\s*years/i);
  return {
    min: over ? parseInt(over[1], 10) : null,
    max: under ? parseInt(under[1], 10) : null,
  };
}

function extractEducation(text) {
  const out = new Set();
  const degreeLine = text.match(/Degree\s*\n?\s*([^\n]{2,80})/i)?.[1] ?? "";
  const hay = [
    degreeLine,
    section(text, "Program Details") ?? "",
    section(text, "Eligibility criteria") ?? "",
    section(text, "Eligibility") ?? "",
    section(text, "Opportunity description") ?? "",
  ].join(" ");
  if (/\bbachelor|undergraduate|associate degree|high school (completion|graduate|diploma)/i.test(hay)) out.add("BACHELOR");
  if (/\bmaster|postgraduate taught|\bPGT\b|\bMSc\b|\bMBA\b/i.test(hay)) out.add("MASTER");
  if (/\bphd|doctoral|doctorate/i.test(hay)) out.add("PHD");
  if (/\bdiploma|certificate\b/i.test(hay)) out.add("DIPLOMA");
  return [...out];
}

const FIELD_PATTERNS = [
  [/\ball (academic )?(fields|disciplines|majors|specialt)/i, "ANY"],
  [/\bengineering\b/i, "Engineering"],
  [/\bcomputer science|computing|informatics|software|artificial intelligence|data science\b/i, "Computer Science"],
  [/\bmedicine|medical|nursing|pharmacy|dentistry|health sciences?\b/i, "Medicine & Health"],
  [/\bbusiness|management|\bMBA\b|finance|accounting|economics\b/i, "Business & Economics"],
  [/\blaw\b|legal studies|human rights/i, "Law"],
  [/\bagricultur|veterinary|food science/i, "Agriculture"],
  [/\beducation|teaching|pedagog/i, "Education"],
  [/\barts?\b|design|architecture|music|film/i, "Arts & Design"],
  [/\bsociolog|anthropolog|political science|international relations|social sciences?\b/i, "Social Sciences"],
  [/\bphysics|chemistry|biology|mathematics|natural sciences?\b/i, "Natural Sciences"],
  [/\benvironment|sustainab|climate|renewable energy/i, "Environmental Studies"],
  [/\bjournalism|media studies|communication/i, "Media & Communication"],
];

function extractFields(text) {
  const scope =
    section(text, "Available Fields\\s*/?\\s*Departments") ??
    section(text, "Available Fields") ??
    section(text, "Fields of Study") ??
    section(text, "Eligible Fields") ??
    section(text, "Program Details") ??
    "";
  // NO whole-page fallback. If the page doesn't have an explicit fields
  // section, we genuinely don't know — and an empty array is honest, whereas a
  // guess scraped from the nav menu is a lie the matcher will act on.
  if (!scope) return [];

  const out = new Set();
  for (const [re, label] of FIELD_PATTERNS) {
    if (re.test(scope)) {
      if (label === "ANY") return ["ANY"];
      out.add(label);
    }
  }
  // A section that matched almost everything is a sign we're reading a list of
  // categories rather than this scholarship's actual fields.
  if (out.size >= 6) return [];
  return [...out];
}

function extractDocuments(text) {
  const scope =
    section(text, "Required Documents") ??
    section(text, "Application Documents") ??
    section(text, "Documents") ??
    section(text, "How to Apply") ??
    section(text, "Application") ??
    section(text, "Eligibility criteria") ??
    section(text, "Eligibility") ??
    null;
  if (!scope) return [];

  const out = new Set();
  if (/\bcv\b|curriculum vitae|resume/i.test(scope)) out.add("CV");
  if (/motivation letter|statement of purpose|personal statement|cover letter/i.test(scope)) out.add("MOTIVATION_LETTER");
  if (/recommendation letter|reference letter|letters? of recommendation/i.test(scope)) out.add("RECOMMENDATION_LETTER");
  if (/transcript|academic record/i.test(scope)) out.add("TRANSCRIPT");
  if (/research proposal/i.test(scope)) out.add("RESEARCH_PROPOSAL");
  if (/passport/i.test(scope)) out.add("PASSPORT");
  if (/\bielts\b|\btoefl\b|english proficiency|language certificate/i.test(scope)) out.add("ENGLISH_TEST");
  if (/\bessay\b/i.test(scope) && !/no essay/i.test(scope)) out.add("ESSAY");
  return [...out];
}

function extractEnglish(text) {
  // Only look at real content. Scanning the whole page returned "REQUIRED" for
  // 5 out of 5 test records, including a US community college that never
  // mentions an English test — the matches were coming from page furniture.
  const scope = [
    section(text, "Eligibility criteria"),
    section(text, "Eligibility"),
    section(text, "Requirements"),
    section(text, "Program Details"),
    section(text, "Opportunity description"),
    section(text, "Application"),
  ].filter(Boolean).join("\n");

  if (!scope) return null;

  const ielts = scope.match(/IELTS[^\d\n]{0,25}(\d(?:\.\d)?)/i);
  if (ielts) return `IELTS ${ielts[1]}`;
  const toefl = scope.match(/TOEFL[^\d\n]{0,25}(\d{2,3})/i);
  if (toefl) return `TOEFL ${toefl[1]}`;
  if (/no (ielts|toefl|english (test|certificate|proficiency))/i.test(scope)) return "NOT_REQUIRED";
  // Only claim it's required if a test is named explicitly.
  if (/\bielts\b|\btoefl\b|english (language )?(proficiency|certificate|test)/i.test(scope)) {
    return "REQUIRED";
  }
  return null;
}

function extractGPA(text) {
  const m = text.match(/(?:minimum|min\.?|at least|cumulative)\s*(?:cumulative\s*)?GPA\s*(?:of\s*)?(\d(?:\.\d{1,2})?)/i)
    ?? text.match(/GPA\s*(?:of\s*)?(\d\.\d{1,2})/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  return v > 0 && v <= 5 ? v : null;
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  // Normalise to midnight UTC. "Oct 1, 2026" parses in the machine's local
  // timezone, so a UTC+3 box would store Sep 30 21:00 and the date would
  // render as the previous day for some users.
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function extractDeadline(text) {
  // Explicit ISO date: "Deadline 2027-05-01"
  const iso = text.match(/Deadline\s*\n?\s*(\d{4}-\d{2}-\d{2})/i);
  if (iso) return { deadline: parseDate(iso[1]), type: "FIXED" };

  // "Closes: May 2, 2027"
  const closes = text.match(/Closes:\s*([A-Z][a-z]{2,9}\s+\d{1,2},\s*\d{4})/);
  if (closes) return { deadline: parseDate(closes[1]), type: "FIXED" };

  // Rolling / ongoing — a REAL answer, not missing data.
  if (/Deadline\s*\n?\s*(Ongoing|available)\b/i.test(text) ||
      /there is no deadline/i.test(text) ||
      /no application is required/i.test(text)) {
    return { deadline: null, type: "ONGOING" };
  }

  if (/Recurring Opportunity|Opens annually/i.test(text)) {
    return { deadline: null, type: "ANNUAL" };
  }

  return { deadline: null, type: "UNKNOWN" };
}

function extractOpenDate(text) {
  const opens = text.match(/Opens:\s*([A-Z][a-z]{2,9}\s+\d{1,2},\s*\d{4})/);
  return opens ? parseDate(opens[1]) : null;
}

function extractRecurrence(text) {
  return text.match(/(Opens annually from [^\n.]{3,80})/i)?.[1]?.trim() ?? null;
}

function extractRecord(html) {
  const text = stripBoilerplate(htmlToText(html));
  const { deadline, type } = extractDeadline(text);
  const ages = extractAges(text);

  return {
    eligibleCountries: extractCountries(text),
    eligibleEducation: extractEducation(text),
    fieldOfStudy: extractFields(text),
    requiredDocuments: extractDocuments(text),
    minimumAge: ages.min,
    maximumAge: ages.max,
    minimumGPA: extractGPA(text),
    englishRequirement: extractEnglish(text),
    benefits: section(text, "Benefits")?.slice(0, 2000) ?? null,
    requirements:
      (section(text, "Eligibility criteria") ?? section(text, "Eligibility"))?.slice(0, 2000) ?? null,
    deadline,
    deadlineType: type,
    applicationOpenDate: extractOpenDate(text),
    recurrenceNote: extractRecurrence(text),
    _dead: /page not found|404|no longer available/i.test(text.slice(0, 1500)),
  };
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchAll(records) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

  let fetched = 0, cached = 0, failed = 0;
  for (const [i, r] of records.entries()) {
    const file = join(CACHE_DIR, cacheKey(r.sourceUrl));
    if (existsSync(file)) { cached++; continue; }

    try {
      const res = await fetch(r.sourceUrl, {
        headers: { "User-Agent": UA, Accept: "text/html" },
        redirect: "follow",
      });
      if (!res.ok) {
        console.log(`  [${i + 1}/${records.length}] HTTP ${res.status} — ${r.nameEn.slice(0, 50)}`);
        writeFileSync(file, `<!--HTTP_${res.status}-->`, "utf8");
        failed++;
      } else {
        writeFileSync(file, await res.text(), "utf8");
        fetched++;
        if (fetched % 10 === 0) console.log(`  …fetched ${fetched}`);
      }
    } catch (e) {
      console.log(`  [${i + 1}/${records.length}] FAILED ${r.sourceUrl}: ${e.message}`);
      failed++;
    }
    await sleep(DELAY_MS);
  }
  console.log(`\n  Fetched ${fetched}, already cached ${cached}, failed ${failed}\n`);
}

// ---------------------------------------------------------------------------
// Parse + write
// ---------------------------------------------------------------------------

const ARRAY_FIELDS = ["eligibleCountries", "eligibleEducation", "fieldOfStudy", "requiredDocuments"];
const SCALAR_FIELDS = [
  "minimumAge", "maximumAge", "minimumGPA", "englishRequirement",
  "benefits", "requirements", "deadline", "applicationOpenDate", "recurrenceNote",
];

function buildPatch(existing, scraped) {
  const patch = {};

  for (const f of ARRAY_FIELDS) {
    const val = scraped[f];
    if (!val?.length) continue;
    if (OVERWRITE || existing[f].length === 0) patch[f] = val;
  }
  for (const f of SCALAR_FIELDS) {
    const val = scraped[f];
    if (val === null || val === undefined) continue;
    if (OVERWRITE || existing[f] === null || existing[f] === undefined) patch[f] = val;
  }
  // deadlineType is cheap and always worth refreshing when we learned something.
  if (scraped.deadlineType && scraped.deadlineType !== "UNKNOWN") {
    if (OVERWRITE || !existing.deadlineType || existing.deadlineType === "UNKNOWN") {
      patch.deadlineType = scraped.deadlineType;
    }
  }
  return patch;
}

async function parseAll(records) {
  const stats = {};
  const updates = [];
  let dead = 0, noCache = 0;

  for (const r of records) {
    const file = join(CACHE_DIR, cacheKey(r.sourceUrl));
    if (!existsSync(file)) { noCache++; continue; }

    const html = readFileSync(file, "utf8");
    if (html.startsWith("<!--HTTP_")) { dead++; continue; }

    const scraped = extractRecord(html);
    if (scraped._dead) { dead++; continue; }

    const patch = buildPatch(r, scraped);
    if (Object.keys(patch).length === 0) continue;

    for (const k of Object.keys(patch)) stats[k] = (stats[k] ?? 0) + 1;
    updates.push({ id: r.id, name: r.nameEn, patch });
  }

  console.log("  Fields recovered:");
  for (const [k, v] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${k.padEnd(22)} ${v}`);
  }
  console.log(`\n  ${updates.length} records would be updated.`);
  if (noCache) console.log(`  ${noCache} not in cache (run with --fetch first).`);
  if (dead) console.log(`  ${dead} pages dead or unreachable.`);

  console.log("\n  Sample (first 3):");
  for (const u of updates.slice(0, 3)) {
    console.log(`\n   ${u.name.slice(0, 66)}`);
    for (const [k, v] of Object.entries(u.patch)) {
      const s = Array.isArray(v) ? `[${v.slice(0, 6).join(", ")}${v.length > 6 ? ", …" : ""}]`
        : v instanceof Date ? v.toISOString().slice(0, 10)
        : String(v).slice(0, 70).replace(/\n/g, " ");
      console.log(`      ${k}: ${s}`);
    }
  }

  if (!APPLY) {
    console.log("\n  (preview only — re-run with --apply to write)\n");
    return;
  }

  let n = 0;
  for (const u of updates) {
    await prisma.scholarship.update({ where: { id: u.id }, data: u.patch });
    if (++n % 25 === 0) console.log(`     …${n}/${updates.length}`);
  }
  console.log(`\n  ✓ Updated ${n} scholarships.`);
  console.log("    isVerified stays false — scraped is not the same as verified.\n");
}

// ---------------------------------------------------------------------------

async function main() {
  if (!DO_FETCH && !DO_PARSE) {
    console.log("\nUsage:");
    console.log("  node scripts/rescrape-for9a.mjs --fetch --limit 5      # test on 5");
    console.log("  node scripts/rescrape-for9a.mjs --parse --limit 5      # preview");
    console.log("  node scripts/rescrape-for9a.mjs --fetch                # all (~5 min)");
    console.log("  node scripts/rescrape-for9a.mjs --parse --apply        # write\n");
    return;
  }

  const all = await prisma.scholarship.findMany({
    where: { sourceUrl: { contains: "for9a.com" } },
    orderBy: { createdAt: "asc" },
  });
  const records = all.slice(0, LIMIT);

  console.log(`\n${records.length} for9a records selected (of ${all.length}).\n`);

  if (DO_FETCH) {
    console.log(`Fetching (delay ${DELAY_MS}ms — please don't lower this)…\n`);
    await fetchAll(records);
  }
  if (DO_PARSE) {
    console.log("Parsing cached pages…\n");
    await parseAll(records);
  }
}

main()
  .catch((e) => { console.error("Rescrape failed:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
