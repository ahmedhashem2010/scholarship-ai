import { describe, it, expect } from "vitest";
import { scholarships } from "../../../prisma/scholarship-enrichment-2g";

/**
 * TASK 2G validation — scoped strictly to the enrichment dataset file
 * (prisma/scholarship-enrichment-2g.ts). Deliberately self-contained: it
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
const MOJIBAKE = /â€™|â€œ|â€|â€¦|Ã©|Ã¨|Ã¡|Ã­|Ã³|Ãº|Ã±|Â£|Â€|Â©|Â®|Â°|Ã¢/i;
const CJK = /[\u4e00-\u9fff]/;
const URL_RE = /^https?:\/\/[^\s]+/i;
const DEGREE_TOKEN_RE =
  /bachelor|undergrad|licence|master|msc|phd|doctora|dphil|diploma|certificate|exchange/i;

/**
 * The 18 high-value scraped records this dataset enriches. `nameEn` is the
 * identity key the fill-empty import merge matches against, so each value below
 * must be EXACTLY the existing DB nameEn (no renames/no duplicates).
 */
const EXPECTED_IDENTITIES: string[] = [
  "Aberdeen Global Scholarship for Postgraduate Students from Africa",
  "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University",
  "Concordia University Entrance Scholarships for Bachelor's Students",
  "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen",
  "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore",
  "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia",
  "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey",
  "Mastercard Foundation Scholarship at the University of Pretoria",
  "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia",
  "New Zealand Government Scholarship for International Students 2026",
  "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK",
  "Partially-Funded University of Bradford MERO Scholarship",
  "PhD Scholarships for Development Countries Students at the University of Cambridge 2026",
  "Partially Funded Master Scholarships of up to £9,000 from the University of Southampton",
  "Undergraduate & Postgraduate Business Scholarships at QUT in Australia",
  "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK",
  "University of Sydney International Scholarship for Postgraduates Students 2026",
  "University of Sydney Undergraduate Scholarship 2026 (Fully Funded)",
];

const CURATED_NAMES = new Set([
  "Chevening Scholarship (UK Government)",
  "Swiss Government Excellence Scholarship",
  "Gates Cambridge Scholarship (UK)",
  "Rhodes Scholarship (Oxford)",
  "KAUST Fellowship (Saudi Arabia)",
  "Turkiye Burslari Scholarship (Türkiye)",
  "Erasmus Mundus Joint Master",
  "Dalhousie University Scholarship (Canada)",
  "University of Toronto (Canada) Scholarships",
  "University of Manchester (UK) Scholarships",
  "MEXT Scholarship (Japan)",
  "CSC Scholarship China",
  "Australia Awards Scholarship",
  "Fulbright Scholarship (USA)",
  "Stipendium Hungaricum (Hungary)",
  "Romanian Government Scholarship",
  "DAAD Scholarship (Germany) — Master & PhD",
  "Al Quds University Scholarship",
  "Stanford University Scholarship (USA)",
  "Harvard — Fulbright Joint Scholarship (USA)",
  "MIT Scholarship (USA)",
  "University of Oxford (UK) Scholarships",
  "University of British Columbia (Canada) Scholarship",
  "University of Lethbridge (Canada) Scholarship",
  "University of Saskatchewan (Canada) Scholarship",
  "University of Alberta (Canada) Scholarships",
  "Canadian and international students Scholarship",
  "Australian National University (ANU) Scholarship (USA)",
]);

describe("scholarship-enrichment-2g dataset", () => {
  it("enriches exactly the 18 expected scraped identities (no renames, no extras)", () => {
    const names = scholarships.map((r) => r.nameEn);
    expect(names.length).toBe(18);
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
      expect(r.source).toBe("SCRAPED");
      expect(r.sourceUrl).toMatch(URL_RE);
      expect(r.deadline instanceof Date).toBe(true);
      expect(Number.isNaN(r.deadline.getTime())).toBe(false);
    }
  });

  it("does not include any curated records by accident", () => {
    for (const r of scholarships) {
      expect(CURATED_NAMES.has(r.nameEn)).toBe(false);
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

  it("does not contain lossy replacement characters in nameAr", () => {
    for (const r of scholarships) {
      expect(r.nameAr.includes("\uFFFD")).toBe(false);
    }
  });

  it("does not contain CJK mojibake in nameAr", () => {
    for (const r of scholarships) {
      expect(CJK.test(r.nameAr)).toBe(false);
    }
  });

  it("every deadline is within the 2026–2027 cycle", () => {
    for (const r of scholarships) {
      expect(r.deadline.getTime()).toBeGreaterThanOrEqual(RESEARCH_DATE.getTime());
      expect(r.deadline.getUTCFullYear()).toBeLessThanOrEqual(MAX_DEADLINE_YEAR);
    }
  });

  it("every record has structured gap/info fields filled", () => {
    for (const r of scholarships) {
      expect(r.eligibleCountries.length).toBeGreaterThan(0);
      expect(r.eligibleEducation.length).toBeGreaterThan(0);
      expect(r.fieldOfStudy.length).toBeGreaterThan(0);
      expect(r.requiredDocuments.length).toBeGreaterThan(0);
      expect(r.benefits).not.toBeNull();
      expect(r.requirements).not.toBeNull();
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

  it("every benefits/requirements value parses as a JSON object", () => {
    for (const r of scholarships) {
      expect(() => JSON.parse(r.benefits)).not.toThrow();
      expect(JSON.parse(r.benefits)).toBeTypeOf("object");
      expect(() => JSON.parse(r.requirements)).not.toThrow();
      expect(JSON.parse(r.requirements)).toBeTypeOf("object");
    }
  });

  it("every benefits/requirements value is a serialized JSON object, not a string", () => {
    for (const r of scholarships) {
      expect(typeof r.benefits).toBe("string");
      expect(typeof r.requirements).toBe("string");
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
    // degree corrections (verified)
    expect(byName("University of Sydney Undergraduate Scholarship 2026 (Fully Funded)").degree).toBe("Bachelor");
    expect(byName("Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK").degree).toBe("Bachelor");
    expect(byName("Undergraduate & Postgraduate Business Scholarships at QUT in Australia").degree).toBe("Bachelor / Master");
    expect(byName("Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University").degree).toBe("Bachelor");
    expect(byName("Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK").degree).toBe("Bachelor / Master / PhD");
    expect(byName("Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia").degree).toBe("Bachelor / Master / PhD");
    expect(byName("Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia").degree).toBe("Bachelor / Master / PhD");
    expect(byName("University of Sydney International Scholarship for Postgraduates Students 2026").degree).toBe("Master / PhD");
    // university corrections (verified)
    expect(byName("Partially-Funded University of Bradford MERO Scholarship").university).toBe("University of Bradford");
    expect(byName("Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK").university).toBe("University of Bradford");
    expect(byName("Mastercard Foundation Scholarship at the University of Pretoria").university).toBe("University of Pretoria");
    expect(byName("Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia").university).toBe("Deakin University");
    // country corrections (study destination, verified)
    expect(byName("Aberdeen Global Scholarship for Postgraduate Students from Africa").country).toBe("United Kingdom");
    expect(byName("Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen").country).toBe("Netherlands");
    // age cap (verified)
    expect(byName("Government of Turkey Research Scholarships in Different Fields in PhD in Turkey").maximumAge).toBe(34);
    // key verified deadlines
    expect(byName("Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen").deadline.toISOString()).toBe("2026-12-01T23:59:00.000Z");
    expect(byName("PhD Scholarships for Development Countries Students at the University of Cambridge 2026").deadline.toISOString()).toBe("2026-12-02T23:59:00.000Z");
    expect(byName("Mastercard Foundation Scholarship at the University of Pretoria").deadline.toISOString()).toBe("2026-09-30T23:59:00.000Z");
    expect(byName("Government of Turkey Research Scholarships in Different Fields in PhD in Turkey").deadline.toISOString()).toBe("2027-02-20T23:59:00.000Z");
    // Southampton nameEn keeps its literal pound sign (no lossy mojibake)
    expect(byName("Partially Funded Master Scholarships of up to £9,000 from the University of Southampton").nameEn).toContain("£9,000");
  });
});
