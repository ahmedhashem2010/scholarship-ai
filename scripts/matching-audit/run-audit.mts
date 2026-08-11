import { PrismaClient } from "@prisma/client";
import * as matcherNs from "../../src/lib/scholarship-matcher.ts";
import * as filtersNs from "../../src/lib/scholarship-filters.ts";
import * as personasNs from "./personas.ts";
const personasRoot = (personasNs as any).default ?? personasNs;
const { personas } = personasRoot as { personas: import("./personas").Persona[] };
import { writeFileSync } from "node:fs";

// tsx compiles src/*.ts as CJS (no "type":"module" in root package.json), so
// named imports fail from an ESM .mts file. Resolve through the namespace.
const matcher = (matcherNs as any).default ?? matcherNs;
const filters = (filtersNs as any).default ?? filtersNs;
const { matchScholarshipsToUser } = matcher as {
  matchScholarshipsToUser: typeof import("../../src/lib/scholarship-matcher").matchScholarshipsToUser;
};
const { visibleScholarshipWhere } = filters as {
  visibleScholarshipWhere: typeof import("../../src/lib/scholarship-filters").visibleScholarshipWhere;
};
type ScholarshipData = import("../../src/lib/scholarship-matcher").ScholarshipData;

/**
 * Task 3B — run the CURRENT matcher against synthetic personas.
 *
 *   npx tsx scripts/matching-audit/run-audit.mts
 *
 * Read-only. Loads the frozen 50 scholarships exactly as the match API route
 * does (visibleScholarshipWhere), runs matchScholarshipsToUser for every
 * persona, and writes a machine-readable result dump to
 * matching-audit-results.json in the repo.
 */

const prisma = new PrismaClient();

const dbRows = await prisma.scholarship.findMany({
  where: visibleScholarshipWhere(),
  take: 200,
  orderBy: [{ isVerified: "desc" }, { deadline: "asc" }],
});

const scholarships: ScholarshipData[] = dbRows.map((r) => ({
  id: r.id,
  nameEn: r.nameEn,
  nameAr: r.nameAr,
  country: r.country,
  university: r.university,
  degree: r.degree,
  deadline: r.deadline,
  flagUrl: r.flagUrl,
  description: r.description,
  benefits: r.benefits,
  requirements: r.requirements,
  sourceUrl: r.sourceUrl,
  source: r.source,
  eligibleCountries: r.eligibleCountries,
  eligibleEducation: r.eligibleEducation,
  fieldOfStudy: r.fieldOfStudy,
  minimumAge: r.minimumAge,
  maximumAge: r.maximumAge,
  minimumGPA: r.minimumGPA,
  englishRequirement: r.englishRequirement,
  requiresResearch: r.requiresResearch,
  requiresWorkExp: r.requiresWorkExp,
  applicationFee: r.applicationFee,
  competitionLevel: r.competitionLevel,
  requiredDocuments: r.requiredDocuments,
}));

console.log(`Loaded ${scholarships.length} scholarships from frozen DB (visible filter).`);

const results = personas.map((p) => {
  const matches = matchScholarshipsToUser(p.profile, scholarships);
  const eligible = matches.filter((m) => m.isEligible);
  const top10 = matches.slice(0, 10).map((m) => ({
    rank: m.rank,
    nameEn: m.scholarship.nameEn,
    fitScore: m.fitScore,
    successProbability: m.successProbability,
    isEligible: m.isEligible,
    competitionLabel: m.competitionLabel,
    dataCompleteness: m.dataCompleteness,
    reasons: m.reasons,
    disqualifiers: m.disqualifiers,
    unknowns: m.unknowns,
  }));
  return {
    id: p.id,
    label: p.label,
    intent: p.intent,
    profile: p.profile,
    totalReturned: matches.length,
    eligibleCount: eligible.length,
    topEligible: eligible.slice(0, 10).map((m) => ({
      nameEn: m.scholarship.nameEn,
      fitScore: m.fitScore,
    })),
    top10,
  };
});

writeFileSync(
  "matching-audit-results.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      scholarshipCount: scholarships.length,
      personas: results,
    },
    null,
    2
  ),
  "utf8"
);

for (const r of results) {
  console.log(`\n=== ${r.id} ${r.label} — ${r.eligibleCount} eligible of ${r.totalReturned}`);
  for (const m of r.top10) {
    const dq = m.disqualifiers.length ? ` [DISQ: ${m.disqualifiers.join(" | ")}]` : "";
    console.log(`  #${m.rank} ${m.fitScore}% ${m.isEligible ? "✓" : "✗"} ${m.nameEn.slice(0, 70)}${dq}`);
  }
}

await prisma.$disconnect();
