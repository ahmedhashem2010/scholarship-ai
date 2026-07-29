/**
 * Unit tests for the translate-names validators. No API key, no database.
 *
 *   node scripts/test-translate-names.mjs
 *
 * These exist because a dry run produced a translation containing "KCC 2026"
 * for a scholarship whose English name mentions neither. Fabricated detail in
 * a scholarship name is worse than an untranslated one.
 */
import fs from "node:fs";
let src = fs.readFileSync("scripts/translate-names.mjs", "utf8");
src = src.replace(/^import .*$/gm, "").replace(/^requireEnv.*$/gm, "")
         .replace(/const prisma = new PrismaClient\(\);/, "");
fs.writeFileSync("/tmp/pure2.mjs", src);
const { rejectReason } = await import("/tmp/pure2.mjs");

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = want === null ? got === null : (got ?? "").startsWith(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `  → got ${JSON.stringify(got)}`}`);
};

console.log("\n-- hallucination guard --");
// The exact case from the dry run.
t("invented 'KCC 2026'",
  rejectReason("فرصة لدراسة دبلوم في الولايات المتحدة مع تمويل جزئي في KCC 2026",
               "Opportunity to study a diploma in the United States with partial funding"),
  "invented content not in source");
t("same name, no invention",
  rejectReason("فرصة لدراسة دبلوم في الولايات المتحدة مع تمويل جزئي",
               "Opportunity to study a diploma in the United States with partial funding"),
  null);

console.log("\n-- must NOT break the good ones from your run --");
t("Stipendium Hungaricum", rejectReason("منحة ستيبينيوم هنجاريوم", "Stipendium Hungaricum Scholarship"), null);
t("Curtin 2026 (year IS in source)", rejectReason("منحة دعم البداية في جامعة كورتين 2026", "Starter Support Scholarship at Curtin University 2026"), null);
t("Florida nursing", rejectReason("منحة فلوريدا للتمريض 2026 لطلاب التمريض في فلوريدا", "Florida Nursing Scholarship 2026 for Nursing Students in Florida"), null);
t("Aberdeen", rejectReason("منحة أبردين العالمية لطلاب الدراسات العليا من أفريقيا", "Aberdeen Global Scholarship for Postgraduate Students from Africa"), null);
t("A & J keeps Latin brand", rejectReason("منحة A & J لتنظيف المجاري 2026 في الولايات المتحدة مع تمويل يصل إلى 2000 دولار", "A & J Duct Cleaning Scholarship 2026 in the USA with Funding up to $2,000"), null);
t("Alvernia 2026-25", rejectReason("منحة جامعة ألفرنيا للبكالوريوس في الولايات المتحدة 2026-25 - تمويل جزئي", "Alvernia University Undergraduate Scholarship in USA 2026-25 - Partially Funded"), null);
t("Ara", rejectReason("منحة أكاديمية آرا الدولية للطلاب 2026", "Ara International Student Academic Scholarship 2026"), null);

console.log("\n-- other invention shapes --");
t("invented year", rejectReason("منحة جامعة أكسفورد 2027", "Oxford University Scholarship"), "invented content not in source");
t("invented university", rejectReason("منحة دراسية في MIT", "Fully funded scholarship"), "invented content not in source");

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
