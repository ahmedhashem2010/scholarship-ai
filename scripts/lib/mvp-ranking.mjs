/**
 * MVP ranking — deterministic scoring for the SmartScholar Top-50 catalog.
 *
 * Every score is computed purely from the database fields of a Scholarship
 * record. No AI, no subjective judgement: given the same record, this module
 * always produces the same score. The formula is documented in
 * SCHOLARSHIP_MVP_RANKING.md and mirrors the task's suggested weighting:
 *
 *   Data completeness    20
 *   Source quality       15
 *   Deadline quality     15
 *   Funding              15
 *   Bachelor relevance   10
 *   Egypt/MENA eligibility 10
 *   Application usability  5
 *   Matching confidence    5
 *   Programme value        3
 *   Freshness              2
 *   ----------------------100
 */

/** Research date for "current cycle" checks (matches the 2026/27 cycle). */
export const RESEARCH_DATE = new Date("2026-08-10T00:00:00Z");

/** Countries treated as MENA for the Egypt/MENA eligibility component. */
export const MENA_COUNTRIES = new Set([
  "Egypt", "Jordan", "Iraq", "Lebanon", "Palestine", "Syria", "Libya",
  "Tunisia", "Algeria", "Morocco", "Sudan", "Yemen", "Saudi Arabia",
  "United Arab Emirates", "Qatar", "Kuwait", "Bahrain", "Oman", "Turkey",
  "Iran", "Israel", "Azerbaijan",
]);

const MAX_FUTURE_YEAR = 2027;

/* ------------------------------------------------------------------------- *
 * Helpers
 * ------------------------------------------------------------------------- */

const isPresent = (v) =>
  v !== null && v !== undefined && v !== "" &&
  (Array.isArray(v) ? v.length > 0 : true);

const cleanText = (v) => (typeof v === "string" ? v : "");

/* ------------------------------------------------------------------------- *
 * 1. Data completeness (20) — 10 checks × 2
 * ------------------------------------------------------------------------- */

export function dataCompleteness(r) {
  let score = 0;
  score += isPresent(r.eligibleCountries) ? 2 : 0;
  score += isPresent(r.eligibleEducation) ? 2 : 0;
  score += isPresent(r.fieldOfStudy) ? 2 : 0;
  score += isPresent(r.benefits) ? 2 : 0;
  score += isPresent(r.requirements) ? 2 : 0;
  score += isPresent(r.requiredDocuments) ? 2 : 0;
  score += isPresent(r.deadline) ? 2 : 0;
  score += isPresent(r.englishRequirement) ? 2 : 0;
  score += isPresent(r.minimumAge) || isPresent(r.maximumAge) || isPresent(r.minimumGPA) ? 2 : 0;
  score += isPresent(r.description) ? 2 : 0;
  return score;
}

/* ------------------------------------------------------------------------- *
 * 2. Source quality (15)
 * ------------------------------------------------------------------------- */

const OFFICIAL_DOMAIN_RE =
  /\.(gov|edu|ac|mil|int)\b|\.gov\.|\.ac\.|\.edu\.|\.gov\.eg\b|\.edu\.eg\b|\.org\.(sa|qa|ae|jo|kw)\b/i;

export function sourceQuality(r) {
  const url = cleanText(r.sourceUrl);
  const officialUrl = OFFICIAL_DOMAIN_RE.test(url);
  if (r.source === "MANUAL") return 15;            // curated, government/official org
  if (r.source === "SCRAPED") {
    if (officialUrl) return 10;                    // enriched with an official URL
    if (/for9a\.com/i.test(url)) return 3;         // aggregator listing
    return 5;                                      // other secondary source
  }
  return 4;
}

/* ------------------------------------------------------------------------- *
 * 3. Deadline quality (15)
 * ------------------------------------------------------------------------- */

export function deadlineQuality(r) {
  if (isPresent(r.deadline)) {
    const d = new Date(r.deadline);
    if (d.getTime() < RESEARCH_DATE.getTime()) return 0;        // expired
    if (d.getUTCFullYear() <= MAX_FUTURE_YEAR) return 15;        // confirmed 2026/27
    return 6;                                                     // far/suspicious placeholder
  }
  // No captured deadline.
  if (r.source === "MANUAL") return 10;   // curated research: cycle documented in requirements
  return 8;                               // unknown
}

/* ------------------------------------------------------------------------- *
 * 4. Funding (15) — keyword heuristics over benefits + description.
 *    Negation-aware so "accommodation not included" does not score housing.
 * ------------------------------------------------------------------------- */

const NEGATION_RE =
  /not (covered|included|automatically included)|not automatically|excluding|does not (cover|include)|without (accommodation|housing|stipend)|no (housing|stipend|accommodation)/i;

function hitsAround(text, kw) {
  const re = new RegExp(kw, "gi");
  let m;
  let hits = 0;
  while ((m = re.exec(text))) {
    const win = text.slice(Math.max(0, m.index - 35), Math.min(text.length, m.index + m[0].length + 35));
    if (!NEGATION_RE.test(win)) hits += 1;
  }
  return hits;
}

export function funding(r) {
  const text = `${cleanText(r.benefits)}\n${cleanText(r.description)}`;
  if (!text.trim()) return { score: 2, label: "unknown" };

  if (/no (financial )?(aid|funding)|not funded|self.?funded|does not provide (funding|financial)/i.test(text)) {
    return { score: 0, label: "no funding" };
  }
  const tuition = hitsAround(text, "tuition") > 0;
  const fullTuition = /full tuition|100%[^\n.]{0,20}tuition|tuition.{0,30}(fully )?cover/i.test(text);
  const stipend = hitsAround(text, "stipend|allowance|living cost|maintenance allowance") > 0;
  const housing = hitsAround(text, "accommodation|housing|dormitor") > 0;
  const fullyFunded = /fully ?funded|full funding|fully-funded/i.test(text);

  if (fullyFunded || (fullTuition && stipend)) return { score: 15, label: "fully funded" };
  if (tuition && stipend) return { score: 12, label: "tuition + stipend" };
  if (tuition && housing) return { score: 10, label: "tuition + accommodation" };
  if (fullTuition || /fee remission|tuition.{0,40}(waiv|reduc)|up to \d+%/i.test(text)) {
    return { score: 8, label: "substantial funding" };
  }
  if (/discount|partial|reduction|%/i.test(text)) return { score: 5, label: "partial funding" };
  return { score: 3, label: "benefits present, no amount found" };
}

/* ------------------------------------------------------------------------- *
 * 5. Bachelor relevance (10)
 * ------------------------------------------------------------------------- */

export function bachelorRelevance(r) {
  const edu = r.eligibleEducation || [];
  const degree = cleanText(r.degree);
  if (edu.includes("BACHELOR") || /bachelor|undergrad/i.test(degree)) return 10;
  if (edu.length > 0 || /master|phd|doctora|diploma/i.test(degree)) return 4;
  return 5; // unknown
}

/* ------------------------------------------------------------------------- *
 * 6. Egypt / MENA eligibility (10)
 * ------------------------------------------------------------------------- */

export function egyptMenaEligibility(r) {
  const countries = r.eligibleCountries || [];
  if (countries.length === 0) return 4; // cannot confirm
  if (countries.some((c) => /egypt/i.test(c))) return 10;
  if (countries.some((c) => MENA_COUNTRIES.has(c))) return 9;
  if (countries.includes("All")) return 8; // international — eligible but not country-specific
  return 5; // listed countries, no MENA
}

/* ------------------------------------------------------------------------- *
 * 7. Application usability (5)
 * ------------------------------------------------------------------------- */

export function applicationUsability(r) {
  const url = cleanText(r.sourceUrl);
  if (r.source === "MANUAL") return 5;
  if (OFFICIAL_DOMAIN_RE.test(url)) return 5;
  if (/for9a\.com/i.test(url)) return 2;
  return 3;
}

/* ------------------------------------------------------------------------- *
 * 8. Matching confidence (5)
 * ------------------------------------------------------------------------- */

export function matchingConfidence(r) {
  const hasCountry = isPresent(r.eligibleCountries);
  const hasEdu = isPresent(r.eligibleEducation);
  const hasField = isPresent(r.fieldOfStudy);
  if (hasCountry && hasEdu && hasField) return 5;
  if (hasCountry || hasEdu) return 3;
  return 1;
}

/* ------------------------------------------------------------------------- *
 * 9. Programme value (3)
 * ------------------------------------------------------------------------- */

export function programmeValue(r) {
  const url = cleanText(r.sourceUrl);
  if (r.source === "MANUAL" || OFFICIAL_DOMAIN_RE.test(url)) return 3;
  if (/for9a\.com/i.test(url)) return 1;
  return 2;
}

/* ------------------------------------------------------------------------- *
 * 10. Freshness (2) — based on updatedAt (recently verified/edited data).
 * ------------------------------------------------------------------------- */

export function freshness(r, now = new Date()) {
  const d = r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt);
  const ageDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  if (ageDays <= 90) return 2;
  if (ageDays <= 365) return 1;
  return 0;
}

/* ------------------------------------------------------------------------- *
 * Total score + reason
 * ------------------------------------------------------------------------- */

export function scoreScholarship(r, now = new Date()) {
  const components = {
    completeness: dataCompleteness(r),
    source: sourceQuality(r),
    deadline: deadlineQuality(r),
    funding: funding(r).score,
    bachelor: bachelorRelevance(r),
    mena: egyptMenaEligibility(r),
    usability: applicationUsability(r),
    matching: matchingConfidence(r),
    value: programmeValue(r),
    freshness: freshness(r, now),
  };
  const total = Object.values(components).reduce((a, b) => a + b, 0);
  return { components, total };
}

const MANUAL_LABELS = {
  completeness: "complete structured eligibility & benefits",
  source: "government / official source",
  deadline: "confirmed 2026/27 deadline",
  funding: "strong funding",
  bachelor: "open to Bachelor's / high-school graduates",
  mena: "open to Egyptian / MENA / international students",
  usability: "official application link & clear process",
  matching: "confident eligibility matching",
  value: "recognised government / university programme",
  freshness: "recently verified",
};

export function whyMadeTop50(r, score) {
  const c = score.components;
  const parts = [];
  const add = (key, cond, label) => { if (cond) parts.push(label); };
  add("source", c.source >= 10, "official government/university source");
  add("deadline", c.deadline >= 15, "confirmed 2026/27 deadline");
  add("funding", c.funding >= 12, "fully funded / tuition + stipend");
  add("funding2", c.funding >= 8 && c.funding < 12, "substantial funding");
  add("bachelor", c.bachelor === 10, "Bachelor's / high-school eligible");
  add("mena", c.mena >= 8, "open to Egyptians / MENA / internationals");
  add("completeness", c.completeness >= 14, "complete structured data");
  if (parts.length === 0) parts.push("balanced structured profile");
  return parts.join("; ");
}
