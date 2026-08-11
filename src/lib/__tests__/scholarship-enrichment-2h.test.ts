import { describe, it, expect } from "vitest";
import { scholarships } from "../../../prisma/scholarship-enrichment-2h";

/**
 * TASK 2H validation — scoped strictly to the enrichment dataset file
 * (prisma/scholarship-enrichment-2h.ts). Deliberately self-contained: it
 * mirrors the pipeline's constants instead of importing
 * scripts/lib/scholarship-data.mjs so the tests never couple to the .mjs
 * helpers. No database access.
 */

const KNOWN_DOCUMENT_TYPES = new Set([
  "CV",
  "TRANSCRIPT",
  "RECOMMENDATION_LETTER",
  "MOTIVATION_LETTER",
  "PERSONAL_STATEMENT",
  "RESEARCH_PROPOSAL",
  "MEDICAL_CERTIFICATE",
  "PORTFOLIO",
  "LANGUAGE_TEST",
  "ENGLISH_TEST",
  "FINANCIAL_STATEMENT",
  "PASSPORT",
  "ESSAY",
]);

const COMPETITION_LEVELS = new Set(["low", "medium", "high"]);
const EDUCATION_TOKENS = new Set(["BACHELOR", "MASTER", "PHD"]);
const RESEARCH_DATE = new Date("2026-08-10T00:00:00Z");
const MAX_DEADLINE_YEAR = 2027;
const MOJIBAKE = /â€™|â€œ|â€|â€¦|Ã©|Ã¨|Ã¡|Ã­|Ã³|Ãº|Ã±|Â£|Â€|Â©|Â®|Â°|Ã¢|Ã¼/i;
const CJK = /[\u4e00-\u9fff]/;
const URL_RE = /^https?:\/\/[^\s]+/i;
const DEGREE_TOKEN_RE =
  /bachelor|undergrad|licence|master|msc|phd|doctora|dphil|diploma|certificate|exchange/i;

const RUSSIA = "Russian Government Quota Scholarship (Rossotrudnichestvo)";
const MELBOURNE =
  "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia";
const USKUDAR =
  "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students";

/**
 * The 11 records this dataset adds or enriches. `nameEn` is the identity key
 * the fill-empty import merge matches against — the first three are UPDATEs
 * (exact existing DB nameEn, no renames), the remaining eight are NEW.
 */
const EXPECTED_IDENTITIES: string[] = [
  RUSSIA,
  MELBOURNE,
  USKUDAR,
  "Greek Government Scholarship (IKY — Foreign Nationals)",
  "Banach NAWA Scholarship (Poland)",
  "Saudi Government Scholarship (Study in Saudi)",
  "PEC-PG Brazilian Government Scholarship",
  "Study in Kazakhstan Scholarship Program",
  "MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)",
  "Les Roches Scholarship (Switzerland)",
  "Innopolis University Scholarship (Russia)",
];

const UPDATE_NAMES = new Set([RUSSIA, MELBOURNE, USKUDAR]);

describe("scholarship-enrichment-2h dataset", () => {
  it("contains exactly the 11 expected identities (3 updates + 8 new, no extras)", () => {
    const names = scholarships.map((r) => r.nameEn);
    expect(names.length).toBe(11);
    expect(names.sort()).toEqual([...EXPECTED_IDENTITIES].sort());
  });

  it("exposes all required base fields on every record", () => {
    for (const r of scholarships) {
      expect(r.nameEn).toBeTypeOf("string");
      expect(r.nameEn.trim().length).toBeGreaterThan(0);
      expect(r.nameAr).toBeTypeOf("string");
      expect(r.nameAr.trim().length).toBeGreaterThan(0);
      expect(r.country).toBeTypeOf("string");
      expect(r.country.trim().length).toBeGreaterThan(0);
      expect(r.degree).toBeTypeOf("string");
      expect(r.degree.trim().length).toBeGreaterThan(0);
      expect(["MANUAL", "SCRAPED"]).toContain(r.source);
      expect(r.sourceUrl).toMatch(URL_RE);
      if (r.deadline !== null) {
        expect(r.deadline instanceof Date).toBe(true);
        expect(Number.isNaN(r.deadline.getTime())).toBe(false);
      }
    }
  });

  it("keeps the update records' verbatim sources and identity fields", () => {
    const byName = (n: string) => scholarships.find((r) => r.nameEn === n)!;
    expect(byName(RUSSIA).source).toBe("MANUAL");
    expect(byName(RUSSIA).nameAr).toBe("منحة الحكومة الروسية");
    expect(byName(RUSSIA).country).toBe("Russia");
    expect(byName(MELBOURNE).source).toBe("SCRAPED");
    expect(byName(MELBOURNE).nameEn).toContain("’");
    expect(byName(USKUDAR).source).toBe("SCRAPED");
    expect(byName(USKUDAR).nameAr).toBe("منحة جامعة أسكودار 2026 في تركيا | منح للطلاب الدوليين");
  });

  it("marks the eight new records as curated additions (source MANUAL)", () => {
    const newRecords = scholarships.filter((r) => !UPDATE_NAMES.has(r.nameEn));
    expect(newRecords.length).toBe(8);
    for (const r of newRecords) {
      expect(r.source).toBe("MANUAL");
      expect(r.isVerified).toBe(true);
    }
  });

  it("does not allow duplicate nameEn values", () => {
    const seen = new Set();
    for (const r of scholarships) {
      expect(seen.has(r.nameEn)).toBe(false);
      seen.add(r.nameEn);
    }
  });

  it("does not contain mojibake in text fields", () => {
    const fields = [
      "nameEn",
      "nameAr",
      "university",
      "benefits",
      "requirements",
      "englishRequirement",
      "fieldOfStudy",
      "eligibleCountries",
    ] as const;
    for (const r of scholarships) {
      for (const f of fields) {
        const val = r[f];
        if (val == null || val === "") continue;
        const text = typeof val === "string" ? val : JSON.stringify(val);
        expect(MOJIBAKE.test(text)).toBe(false);
      }
    }
  });

  it("does not contain lossy replacement characters or CJK mojibake in nameAr", () => {
    for (const r of scholarships) {
      expect(r.nameAr.includes("\uFFFD")).toBe(false);
      expect(CJK.test(r.nameAr)).toBe(false);
    }
  });

  it("every non-null deadline is within the 2026–2027 cycle", () => {
    for (const r of scholarships) {
      if (r.deadline === null) continue;
      expect(r.deadline.getTime()).toBeGreaterThanOrEqual(RESEARCH_DATE.getTime());
      expect(r.deadline.getUTCFullYear()).toBeLessThanOrEqual(MAX_DEADLINE_YEAR);
    }
  });

  it("recurring new programmes carry a null deadline with cycle history in requirements", () => {
    const newRecords = scholarships.filter((r) => !UPDATE_NAMES.has(r.nameEn));
    for (const r of newRecords) {
      expect(r.deadline).toBeNull();
      const req = JSON.parse(r.requirements!);
      expect(typeof req.deadline).toBe("string");
      expect(req.deadline.length).toBeGreaterThan(0);
    }
  });

  it("every record has structured gap/info fields filled (except Russia, already populated)", () => {
    for (const r of scholarships) {
      expect(r.eligibleCountries.length).toBeGreaterThan(0);
      expect(r.eligibleEducation.length).toBeGreaterThan(0);
      expect(r.fieldOfStudy.length).toBeGreaterThan(0);
      expect(r.requiredDocuments.length).toBeGreaterThan(0);
      if (r.nameEn !== RUSSIA) {
        expect(r.benefits).not.toBeNull();
        expect(r.benefits).not.toBeUndefined();
        expect(r.requirements).not.toBeNull();
        expect(r.requirements).not.toBeUndefined();
      }
    }
  });

  it("every record has a competitionLevel that is one of the known values", () => {
    for (const r of scholarships) {
      expect(COMPETITION_LEVELS.has(r.competitionLevel)).toBe(true);
    }
  });

  it("every record has a valid degree value", () => {
    for (const r of scholarships) {
      expect(r.degree).toMatch(DEGREE_TOKEN_RE);
      expect(r.degree.length).toBeLessThanOrEqual(100);
    }
  });

  it("every eligibleEducation value is a known token", () => {
    for (const r of scholarships) {
      for (const token of r.eligibleEducation) {
        expect(EDUCATION_TOKENS.has(token)).toBe(true);
      }
    }
  });

  it("every required document is a known document type", () => {
    for (const r of scholarships) {
      for (const doc of r.requiredDocuments) {
        expect(KNOWN_DOCUMENT_TYPES.has(doc)).toBe(true);
      }
    }
  });

  it("every provided benefits/requirements value parses as a JSON object", () => {
    for (const r of scholarships) {
      const benefits = r.benefits;
      if (benefits !== undefined && benefits !== null) {
        expect(() => JSON.parse(benefits)).not.toThrow();
        expect(JSON.parse(benefits)).toBeTypeOf("object");
      }
      const requirements = r.requirements;
      if (requirements !== undefined && requirements !== null) {
        expect(() => JSON.parse(requirements)).not.toThrow();
        expect(JSON.parse(requirements)).toBeTypeOf("object");
      }
    }
  });

  it("every provided benefits/requirements value is a serialized JSON object, not a string", () => {
    for (const r of scholarships) {
      if (r.benefits !== undefined && r.benefits !== null) {
        expect(typeof r.benefits).toBe("string");
      }
      if (r.requirements !== undefined && r.requirements !== null) {
        expect(typeof r.requirements).toBe("string");
      }
    }
  });

  it("every age/GPA value is valid", () => {
    for (const r of scholarships) {
      if (r.minimumAge !== null) {
        expect(r.minimumAge).toBeGreaterThanOrEqual(0);
      }
      if (r.maximumAge !== null) {
        expect(r.maximumAge).toBeGreaterThan(0);
      }
      if (r.minimumGPA !== null) {
        expect(r.minimumGPA).toBeGreaterThanOrEqual(0);
        expect(r.minimumGPA).toBeLessThanOrEqual(4.0);
      }
    }
  });

  it("every verifiedAt/isVerified/isActive/applicationOpenDate is set as expected", () => {
    for (const r of scholarships) {
      expect(r.isVerified).toBe(true);
      expect(r.verifiedAt instanceof Date).toBe(true);
      expect(r.isActive).toBe(true);
      expect(r.applicationOpenDate).toBeNull();
    }
  });

  it("asserts the deliberate corrections are present", () => {
    const byName = (n: string) => scholarships.find((r) => r.nameEn === n)!;
    // Russia: application fee filled with 0 (was null) — free application
    expect(byName(RUSSIA).applicationFee).toBe(0);
    // Melbourne: verified benefits superset carries the awards count and leave
    const melbBenefits = JSON.parse(byName(MELBOURNE).benefits as string);
    expect(melbBenefits).toHaveProperty("awards", "4 awards available per year");
    expect(melbBenefits).toHaveProperty("leave");
    expect(String(melbBenefits.relocation)).toContain("$2,000 (outside Victoria)");
    const melbReq = JSON.parse(byName(MELBOURNE).requirements as string);
    expect(melbReq).toHaveProperty("offer");
    expect(melbReq).toHaveProperty("prior");
    expect(melbReq.deadline).toContain("31 October 2026");
    // Üsküdar: gap fields filled + sourceUrl mojibake fixed
    const uskudar = byName(USKUDAR);
    expect(uskudar.eligibleCountries).toEqual(["All"]);
    expect(uskudar.eligibleEducation).toContain("BACHELOR");
    expect(uskudar.fieldOfStudy).toContain("Medicine");
    expect(uskudar.requiredDocuments.length).toBeGreaterThan(0);
    expect(uskudar.sourceUrl).not.toMatch(/Ã/);
    expect(uskudar.sourceUrl).toContain("%C3%BCsk%C3%BCdar");
    expect(uskudar.sourceUrl).toMatch(URL_RE);
  });
});
