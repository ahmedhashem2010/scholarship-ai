import { describe, it, expect } from "vitest";
import { scholarships } from "../../../prisma/scholarship-enrichment-2f";

/**
 * TASK 2F validation — scoped strictly to the enrichment dataset file
 * (prisma/scholarship-enrichment-2f.ts). Deliberately self-contained: it
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
 * The 17 scraped records this dataset enriches. `nameEn` is the identity key
 * the fill-empty import merge matches against, so each value below must be
 * EXACTLY the existing DB nameEn (no renames/no duplicates).
 */
const EXPECTED_IDENTITIES: string[] = [
  "Master’s in Renewable and Sustainable Energy in the United Kingdom 2026",
  "Partially Funded Master's Scholarship in UK From York University 2026",
  "Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026",
  "McCall MacBain Scholarship | Fully Funded Master's Programs at McGill University in Canada",
  "Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026",
  "Study Opportunity in Europe at EMUNI University | Master’s and PhD with Partial Scholarships",
  "Fully Funded Scholarships in Iraq 2026 for International Students",
  "Gilman International Scholarship 2026 | Fully Funded Program for Undergraduate Students in the USA",
  "University of Winnipeg Scholarship 2026 in Canada for International Students with Funding up to CAD 5,000",
  "Partially Funded Bachelor's Scholarship in USA 2026",
  "National Scholarship Program Slovakia 2026 for International Students",
  "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia",
  "Fully Funded Research Scholarships at CQUniversity Australia",
  "Fully Funded ADB Master's Scholarship in Asia and Pacific 2026",
  "Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation",
  "Fully Funded Undergraduate and Master's Scholarships at University of Siena, Italy 2026",
  "Partially Funded Harvard MBA Scholarship 2026",
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

describe("scholarship-enrichment-2f dataset", () => {
  it("enriches exactly the 17 expected scraped identities (no renames, no extras)", () => {
    const names = scholarships.map((r) => r.nameEn);
    expect(names.length).toBe(17);
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

  it("does not contain CJK mojibake in nameAr (fixed '部分' fragments)", () => {
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
    expect(byName("Gilman International Scholarship 2026 | Fully Funded Program for Undergraduate Students in the USA").degree).toBe("Bachelor");
    expect(byName("Fully Funded Research Scholarships at CQUniversity Australia").degree).toBe("Master / PhD");
    expect(byName("Fully Funded Undergraduate and Master's Scholarships at University of Siena, Italy 2026").degree).toBe("Bachelor / Master");
    expect(byName("Partially Funded Harvard MBA Scholarship 2026").degree).toBe("Master");
    expect(byName("National Scholarship Program Slovakia 2026 for International Students").degree).toBe("Master / PhD");
    expect(byName("Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026").degree).toBe("Bachelor / Master / PhD");
    // nameAr mojibake fixes
    expect(byName("Partially Funded Bachelor's Scholarship in USA 2026").nameAr).not.toContain("部分");
    expect(byName("Partially Funded Harvard MBA Scholarship 2026").nameAr).not.toContain("部分");
    // university cleanups
    expect(byName("Master’s in Renewable and Sustainable Energy in the United Kingdom 2026").university).toBe("University of Bradford");
    expect(byName("Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation").university).toBe("Shanghai Government Scholarship");
    // age caps (verified)
    expect(byName("Partially Funded Bachelor's Scholarship in USA 2026").maximumAge).toBe(18);
    expect(byName("Fully Funded ADB Master's Scholarship in Asia and Pacific 2026").maximumAge).toBe(35);
  });
});
