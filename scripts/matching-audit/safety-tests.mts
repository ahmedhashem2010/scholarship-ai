import { PrismaClient } from "@prisma/client";
import * as matcherNs from "../../src/lib/scholarship-matcher.ts";
import * as filtersNs from "../../src/lib/scholarship-filters.ts";
const matcher = (matcherNs as any).default ?? matcherNs;
const filters = (filtersNs as any).default ?? filtersNs;
const { matchScholarshipsToUser } = matcher;
const { visibleScholarshipWhere } = filters;

/**
 * Task 3B/3D — matching SAFETY tests (read-only).
 *
 * For each safety case, run the CURRENT matcher against the frozen 50 and
 * inspect the full returned set (not just top-10) for the specific restricted
 * scholarship: is it returned at all? is it flagged isEligible? does it carry
 * a hard disqualifier?
 *
 * NOTE: since BUG 2 was fixed (Task 3C), `matchScholarshipsToUser` returns
 * ONLY eligible matches, so a restricted scholarship being absent from the
 * returned set IS the expected PASS outcome for the NOT_ELIGIBLE cases.
 */

const prisma = new PrismaClient();
const dbRows = await prisma.scholarship.findMany({ where: visibleScholarshipWhere(), take: 200 });
const scholarships = dbRows.map((r) => ({
  id: r.id, nameEn: r.nameEn, nameAr: r.nameAr, country: r.country, university: r.university,
  degree: r.degree, deadline: r.deadline, flagUrl: r.flagUrl, description: r.description,
  benefits: r.benefits, requirements: r.requirements, sourceUrl: r.sourceUrl, source: r.source,
  eligibleCountries: r.eligibleCountries, eligibleEducation: r.eligibleEducation,
  fieldOfStudy: r.fieldOfStudy, minimumAge: r.minimumAge, maximumAge: r.maximumAge,
  minimumGPA: r.minimumGPA, englishRequirement: r.englishRequirement,
  requiresResearch: r.requiresResearch, requiresWorkExp: r.requiresWorkExp,
  applicationFee: r.applicationFee, competitionLevel: r.competitionLevel,
  requiredDocuments: r.requiredDocuments,
}));

const base = {
  country: "Egypt", educationLevel: "bachelor", major: "Engineering",
  targetDegree: "master", englishLevel: "ADVANCED", hasEnglishTest: "YES",
  budget: "NONE", gpa: 3.5, hasResearch: true, hasWorkExperience: false,
};

const cases = [
  {
    id: "S1-country-exclusion",
    label: "Indian applicant must NOT be eligible for Gates Cambridge (MENA list, Egypt/Saudi/Jordan... no India)",
    profile: { ...base, dateOfBirth: "2002-07-01", country: "India", targetDegree: "master", major: "Engineering" },
    targetName: "Gates Cambridge Scholarship (UK)",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S2-country-exclusion-manaaki",
    label: "Indian applicant must NOT be eligible for Manaaki NZ (SEA list, no India)",
    profile: { ...base, dateOfBirth: "2002-07-01", country: "India", targetDegree: "master" },
    targetName: "Manaaki New Zealand Scholarships",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S3-degree-exclusion",
    label: "Bachelor's student must NOT get Master's-only Schwarzman as eligible",
    profile: { ...base, dateOfBirth: "2005-01-01", country: "Egypt", targetDegree: "bachelor", major: "Business" },
    targetName: "Schwarzman Scholars (China)",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S4-age-max",
    label: "Age-40 applicant must NOT get Turkish Research PhD (max 34) as eligible",
    profile: { ...base, dateOfBirth: "1986-08-09", targetDegree: "phd", major: "Engineering" },
    targetName: "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S5-age-min",
    label: "Age-15 applicant must NOT get Schwarzman (min 18) as eligible",
    profile: { ...base, dateOfBirth: "2011-06-30", targetDegree: "bachelor", major: "Business" },
    targetName: "Schwarzman Scholars (China)",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S6-gpa-min",
    label: "GPA-2.5 applicant must NOT get KAUST (minGPA 3) as fully eligible",
    profile: { ...base, dateOfBirth: "2003-01-01", gpa: 2.5, major: "Engineering", targetDegree: "master" },
    targetName: "KAUST Fellowship (Saudi Arabia)",
    expect: "NOT_ELIGIBLE",
  },
  {
    id: "S7-deadline",
    label: "Expired scholarship must not appear (visibility filter already excludes)",
    profile: { ...base, dateOfBirth: "2003-01-01", gpa: 3.5 },
    targetName: "(none)",
    expect: "NO_EXPIRED_RETURNED",
  },
  {
    id: "S8-missing-data-neutral",
    label: "Missing eligibleCountries must become 'unknown', not hard-eligible as confirmed",
    profile: { ...base, dateOfBirth: "2003-01-01" },
    targetName: "(any)",
    expect: "REPORT_ONLY",
  },
];

const out = [];
for (const c of cases) {
  const matches = matchScholarshipsToUser(c.profile, scholarships);
  if (c.id === "S7-deadline") {
    const expired = matches.filter((m) => m.scholarship.deadline && new Date(m.scholarship.deadline).getTime() < Date.now() - 2 * 86400000);
    out.push({ id: c.id, label: c.label, result: expired.length === 0 ? "PASS" : "FAIL", detail: `${expired.length} expired returned` });
    continue;
  }
  if (c.id === "S8-missing-data-neutral") {
    const unknownCountry = matches.filter((m) => m.unknowns.some((u) => u.includes("nationalities aren't listed")));
    out.push({ id: c.id, label: c.label, result: "REPORT", detail: `${unknownCountry.length} scholarships have unknown-nationality note (none in frozen 50 — all have country lists)`, samples: unknownCountry.slice(0, 2).map((m) => m.scholarship.nameEn) });
    continue;
  }
  const hit = matches.find((m) => m.scholarship.nameEn === c.targetName);
  if (!hit) {
    // Post-BUG-2 the matcher returns only eligible matches, so for a
    // NOT_ELIGIBLE expectation the scholarship being absent is the correct,
    // expected outcome — not an unknown.
    if (c.expect === "NOT_ELIGIBLE") {
      out.push({
        id: c.id,
        label: c.label,
        result: "PASS",
        detail: `${c.targetName} correctly absent (filtered out as ineligible) — ${matches.length} eligible returned`,
      });
    } else {
      out.push({
        id: c.id,
        label: c.label,
        result: "FAIL",
        detail: `${c.targetName} not returned`,
      });
    }
    continue;
  }
  const pass = c.expect === "NOT_ELIGIBLE" ? hit.isEligible === false : hit.isEligible === true;
  out.push({
    id: c.id,
    label: c.label,
    result: pass ? "PASS" : "FAIL",
    detail: `fit=${hit.fitScore} eligible=${hit.isEligible} reasons=[${hit.reasons.slice(0, 3).join(" | ")}] disq=[${hit.disqualifiers.join(" | ")}] unknowns=[${hit.unknowns.slice(0, 2).join(" | ")}]`,
  });
}

console.log("\n===== MATCHING SAFETY TESTS =====");
for (const o of out) {
  console.log(`\n[${o.result}] ${o.id} — ${o.label}`);
  console.log(`  ${o.detail}`);
  if (o.samples) console.log(`  samples: ${o.samples.join("; ")}`);
}

await prisma.$disconnect();
