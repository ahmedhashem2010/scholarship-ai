import { PrismaClient } from "@prisma/client";
import * as matcherNs from "../../src/lib/scholarship-matcher.ts";
import * as filtersNs from "../../src/lib/scholarship-filters.ts";
import * as personasMod from "./personas.ts";
const matcher = (matcherNs as any).default ?? matcherNs;
const filters = (filtersNs as any).default ?? filtersNs;
const personasRoot = (personasMod as any).default ?? personasMod;
const personas = (personasRoot as { personas: import("./personas").Persona[] }).personas;
const { matchScholarshipsToUser } = matcher;
const { visibleScholarshipWhere } = filters;

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

const lines: string[] = [];
const S = scholarships;
const n = S.length;
const pct = (x: number) => ((x / n) * 100).toFixed(0) + "%";

lines.push(`# Scholarships: ${n}`);
lines.push(`\n## 1. Country field`);
lines.push(`- distinct values: ${new Set(S.map((s) => s.country)).size}`);
lines.push(`- per-country counts:`);
const ccounts = S.reduce((a: Record<string, number>, s) => { a[s.country] = (a[s.country] ?? 0) + 1; return a; }, {});
for (const [c, v] of Object.entries(ccounts).sort((a, b) => b[1] - a[1])) lines.push(`  - ${c}: ${v}`);

lines.push(`\n## 2. eligibleCountries (nationality gate)`);
const pAll = S.filter((s) => s.eligibleCountries.length === 1 && s.eligibleCountries[0] === "All").length;
lines.push(`- len=1 [All]: ${pAll} (${pct(pAll)}) — global, no restriction`);
lines.push(`- len=1 [All] but with other gates: ${S.filter((s) => s.eligibleCountries.length === 1 && s.eligibleCountries[0] === "All" && (s.eligibleEducation.length || s.minimumAge || s.maximumAge || s.minimumGPA)).length}`);
const countryLists = S.filter((s) => !(s.eligibleCountries.length === 1 && s.eligibleCountries[0] === "All"));
lines.push(`- country-list records (not [All]): ${countryLists.length}`);
for (const s of countryLists) lines.push(`  - ${s.nameEn.slice(0, 58)}: ${s.eligibleCountries.length} countries`);
lines.push(`- records with EMPTY eligibleCountries: ${S.filter((s) => s.eligibleCountries.length === 0).length}`);
lines.push(`- effective nationality-restricted (i.e. NOT open to Egypt applicant): ${S.filter((s) => !(s.eligibleCountries.length === 1 && s.eligibleCountries[0] === "All") && !s.eligibleCountries.includes("Egypt")).length}`);

lines.push(`\n## 3. eligibleEducation (degree gate)`);
const edCounts: Record<string, number> = {};
for (const s of S) { const k = [...s.eligibleEducation].sort().join(","); edCounts[k] = (edCounts[k] ?? 0) + 1; }
for (const [k, v] of Object.entries(edCounts).sort((a, b) => b[1] - a[1])) lines.push(`- ${k || "(empty)"}: ${v}`);
lines.push(`- EMPTY eligibleEducation: ${S.filter((s) => s.eligibleEducation.length === 0).length}`);
const hasDegree = S.filter((s) => /(?:bachelor|master|phd)/i.test(s.degree ?? "")).length;
lines.push(`- records with degree-like free text in degree field: ${hasDegree}`);

lines.push(`\n## 4. fieldOfStudy (major gate)`);
const pAny = S.filter((s) => s.fieldOfStudy.length === 1 && s.fieldOfStudy[0] === "Any").length;
lines.push(`- len=1 [Any]: ${pAny} (${pct(pAny)})`);
lines.push(`- EMPTY fieldOfStudy: ${S.filter((s) => s.fieldOfStudy.length === 0).length}`);
lines.push(`- len>1: ${S.filter((s) => s.fieldOfStudy.length > 1).length}`);
const topFields: Record<string, number> = {};
for (const s of S) for (const f of s.fieldOfStudy) topFields[f] = (topFields[f] ?? 0) + 1;
lines.push(`- top field tokens: ${Object.entries(topFields).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}(${v})`).join(", ")}`);

lines.push(`\n## 5. Age bounds`);
lines.push(`- minimumAge set: ${S.filter((s) => s.minimumAge !== null).length} (${S.filter((s) => s.minimumAge !== null).map((s) => `${s.nameEn.slice(0, 30)}=${s.minimumAge}`).join("; ")})`);
lines.push(`- maximumAge set: ${S.filter((s) => s.maximumAge !== null).length} (${S.filter((s) => s.maximumAge !== null).map((s) => `${s.nameEn.slice(0, 30)}=${s.maximumAge}`).join("; ")})`);
lines.push(`- records with NEITHER age bound: ${S.filter((s) => s.minimumAge === null && s.maximumAge === null).length} (${pct(S.filter((s) => s.minimumAge === null && s.maximumAge === null).length)})`);

lines.push(`\n## 6. GPA`);
lines.push(`- minimumGPA set: ${S.filter((s) => s.minimumGPA !== null).length} (${S.filter((s) => s.minimumGPA !== null).map((s) => `${s.nameEn.slice(0, 30)}=${s.minimumGPA}`).join("; ")})`);

lines.push(`\n## 7. English`);
lines.push(`- englishRequirement === NOT_REQUIRED: ${S.filter((s) => s.englishRequirement === "NOT_REQUIRED").length}`);
lines.push(`- englishRequirement === PREFERRED: ${S.filter((s) => s.englishRequirement === "PREFERRED").length}`);
lines.push(`- free-text / other: ${S.filter((s) => !["NOT_REQUIRED", "PREFERRED"].includes(s.englishRequirement)).length}`);

lines.push(`\n## 8. Deadline`);
const now = Date.now();
lines.push(`- deadline set: ${S.filter((s) => s.deadline !== null).length}`);
lines.push(`- deadline NULL: ${S.filter((s) => s.deadline === null).length}`);
lines.push(`- deadline within 60 days: ${S.filter((s) => s.deadline && s.deadline.getTime() - now < 60 * 86400000 && s.deadline.getTime() >= now).length}`);
lines.push(`- deadline within 30 days: ${S.filter((s) => s.deadline && s.deadline.getTime() - now < 30 * 86400000 && s.deadline.getTime() >= now).length}`);

lines.push(`\n## 9. Competition`);
const comp: Record<string, number> = {};
for (const s of S) comp[s.competitionLevel] = (comp[s.competitionLevel] ?? 0) + 1;
for (const [k, v] of Object.entries(comp)) lines.push(`- ${k}: ${v}`);

lines.push(`\n## 10. Benefits / funding`);
const withBenefits = S.filter((s) => s.benefits && s.benefits.length > 2).length;
lines.push(`- benefits populated: ${withBenefits} (${pct(withBenefits)})`);
const fullTuition = S.filter((s) => s.benefits && s.benefits.toLowerCase().includes("full tuition")).length;
const tuitionAny = S.filter((s) => s.benefits && s.benefits.toLowerCase().includes("tuition")).length;
lines.push(`- benefits mentioning full tuition: ${fullTuition}, any tuition: ${tuitionAny}`);

lines.push(`\n## 11. Matching-critical completeness (eligibility gates)`);
const complete = S.filter((s) => s.eligibleCountries.length > 0 && s.eligibleEducation.length > 0 && s.fieldOfStudy.length > 0 && (s.benefits && s.benefits.length > 2));
lines.push(`- all 4 (countries, education, field, benefits): ${complete.length} (${pct(complete.length)})`);

lines.push(`\n## 12. Matcher results per persona`);
for (const p of personas) {
  const res = matchScholarshipsToUser(p.profile, scholarships);
  const elig = res.filter((m) => m.isEligible);
  const top = elig.slice(0, 3).map((m) => `${m.fitScore}% ${m.scholarship.nameEn.slice(0, 40)}`);
  lines.push(`- ${p.id} (${p.label}) target=${p.profile.targetDegree} country=${p.profile.country}: eligible=${elig.length}/${res.length}, top3: ${top.join(" || ") || "(none)"}`);
}

console.log(lines.join("\n"));
await prisma.$disconnect();
