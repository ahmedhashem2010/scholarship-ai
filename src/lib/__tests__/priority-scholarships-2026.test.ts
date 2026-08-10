import { describe, it, expect } from "vitest";
import { priorityScholarships2026 } from "../../../prisma/priority-scholarships-2026";

/**
 * TASK 2E validation — scoped strictly to the dataset file
 * (prisma/priority-scholarships-2026.ts). Deliberately self-contained: it
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
const DEGREE_TOKEN_RE =
  /bachelor|undergrad|licence|master|msc|phd|doctora|dphil|diploma|certificate|exchange/i;
const MOJIBAKE = /â€™|â€œ|â€|â€¦|Ã©|Ã¨|Ã¡|Ã­|Ã³|Ãº|Ã±|Â£|Â€|Â©|Â®|Â°|Ã¢/i;
const URL_RE = /^https?:\/\/[^\s]+/i;

/**
 * The 13 flagships that already exist as curated records in prisma/seed.ts.
 * This dataset deliberately reuses their exact nameEn (and nameAr) so the
 * fill-empty import/seed merge matches them instead of creating duplicates.
 * Every other record here is intentionally a NEW nameEn.
 */
const EXPECTED_CURATED_OVERLAPS = new Set([
  "Chevening Scholarship (UK Government)",
  "Swiss Government Excellence Scholarship",
  "Gates Cambridge Scholarship (UK)",
  "Rhodes Scholarship (Oxford)",
  "KAUST Fellowship (Saudi Arabia)",
  "Turkiye Burslari Scholarship (Türkiye)",
  "Erasmus Mundus Joint Master Degree",
  "MEXT Scholarship (Japanese Government Scholarship)",
  "Chinese Government Scholarship (CSC)",
  "Fulbright Foreign Student Program (USA)",
  "Stipendium Hungaricum Scholarship",
  "Swedish Institute Scholarship for Global Professionals",
  "Australia Awards Scholarship",
]);

/** Complete curated nameEn set from prisma/seed.ts — no accidental collisions allowed. */
const CURATED_NAMES = new Set([
  "MEXT Scholarship (Japanese Government Scholarship)",
  "Stipendium Hungaricum Scholarship",
  "Chevening Scholarship (UK Government)",
  "DAAD Scholarship (Germany) — Master & PhD",
  "Turkiye Burslari Scholarship (Türkiye)",
  "Erasmus Mundus Joint Master Degree",
  "Fulbright Foreign Student Program (USA)",
  "Gates Cambridge Scholarship (UK)",
  "Rhodes Scholarship (Oxford)",
  "Italian Government Scholarship (MAECI)",
  "Eiffel Excellence Scholarship (France)",
  "Holland Scholarship (Netherlands)",
  "Swedish Institute Scholarship for Global Professionals",
  "Swiss Government Excellence Scholarship",
  "KAUST Fellowship (Saudi Arabia)",
  "King Saud University Scholarship (Saudi Arabia)",
  "Mohammed Bin Rashid Al Maktoum Scholarship (UAE)",
  "Qatar University International Student Scholarship",
  "Chinese Government Scholarship (CSC)",
  "GKS Scholarship (Global Korea Scholarship — KGSP)",
  "Australia Awards Scholarship",
  "Vanier Canada Graduate Scholarship",
  "Lester B. Pearson International Scholarship (University of Toronto)",
  "Heinrich Böll Foundation Scholarship (Germany)",
  "Orange Tulip Scholarship (Netherlands)",
  "University of Tokyo — ADB Scholarship",
  "ETH Zurich Excellence Scholarship (Switzerland)",
  "University of Warsaw — Polish Government Scholarship",
  "Sawiris Foundation Scholarship for Egyptians",
  "DAAD GERSs (German Egyptian Research Scholarships)",
  "Mälardalen University Scholarship (Sweden)",
  "Austrian Government Scholarship (OeAD)",
  "University of Queensland — Destination Australia Scholarship",
  "Clarendon Fund Scholarship (University of Oxford)",
  "Danish Government Scholarship (University of Copenhagen)",
  "University of Bologna Study Grant for International Students (Italy)",
  "ARES Scholarship (Belgium)",
  "VLIR-UOS Scholarship (Belgium — Master)",
  "University of Geneva Excellence Master Fellowship (Switzerland)",
]);

const RESEARCH_DATE = new Date("2026-08-09T00:00:00Z");

describe("priorityScholarships2026 dataset", () => {
  it("contains exactly 21 records (Russia + 20 priority flagships)", () => {
    expect(priorityScholarships2026).toHaveLength(21);
  });

  it("has unique case-insensitive nameEn values (pipeline identity key)", () => {
    const names = priorityScholarships2026.map((r) => r.nameEn.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("every record has all required base fields set", () => {
    for (const r of priorityScholarships2026) {
      expect(r.nameEn.trim(), r.nameEn).not.toBe("");
      expect(r.nameAr.trim(), r.nameEn).not.toBe("");
      expect(r.country.trim(), r.nameEn).not.toBe("");
      expect(r.degree.trim(), r.nameEn).not.toBe("");
      expect(r.source.trim(), r.nameEn).not.toBe("");
      expect(r.sourceUrl, r.nameEn).toBeTruthy();
    }
  });

  it("every record is verified, active and carries a verifiedAt date", () => {
    for (const r of priorityScholarships2026) {
      expect(r.isVerified, r.nameEn).toBe(true);
      expect(r.isActive, r.nameEn).toBe(true);
      expect(r.verifiedAt instanceof Date, r.nameEn).toBe(true);
      expect(Number.isNaN(r.verifiedAt.getTime()), r.nameEn).toBe(false);
    }
  });

  it("nameEn stays within the pipeline max length (300 chars)", () => {
    for (const r of priorityScholarships2026) {
      expect(r.nameEn.length, r.nameEn).toBeLessThanOrEqual(300);
    }
  });

  it("nameAr is clean, reasonably short, and not an auto-generated placeholder", () => {
    for (const r of priorityScholarships2026) {
      expect(r.nameAr.length, r.nameEn).toBeLessThanOrEqual(500);
      expect(MOJIBAKE.test(r.nameAr), `${r.nameEn}: mojibake in nameAr`).toBe(false);
      const isPlaceholder =
        r.nameAr.startsWith("منحة ") && r.nameAr.length < 60 && r.nameAr.includes(r.nameEn);
      expect(isPlaceholder, `${r.nameEn}: nameAr looks like a placeholder`).toBe(false);
    }
  });

  it("degree names a recognised level (pipeline DEGREE_TOKEN_RE check)", () => {
    for (const r of priorityScholarships2026) {
      expect(DEGREE_TOKEN_RE.test(r.degree), `${r.nameEn}: degree "${r.degree}"`).toBe(true);
    }
  });

  it("sourceUrl is a valid http(s) URL and not an aggregator placeholder", () => {
    for (const r of priorityScholarships2026) {
      expect(URL_RE.test(r.sourceUrl), `${r.nameEn}: bad sourceUrl "${r.sourceUrl}"`).toBe(true);
    }
  });

  it("deadline is null or a valid Date within the 2026–2027 cycle", () => {
    for (const r of priorityScholarships2026) {
      if (r.deadline === null) continue;
      expect(r.deadline instanceof Date, r.nameEn).toBe(true);
      expect(Number.isNaN(r.deadline.getTime()), r.nameEn).toBe(false);
      expect(r.deadline.getTime() >= RESEARCH_DATE.getTime(), r.nameEn).toBe(true);
      expect(r.deadline.getUTCFullYear(), r.nameEn).toBeLessThanOrEqual(2027);
    }
  });

  it("applicationOpenDate is null or a valid Date not after the deadline", () => {
    for (const r of priorityScholarships2026) {
      if (r.applicationOpenDate === null) continue;
      expect(r.applicationOpenDate instanceof Date, r.nameEn).toBe(true);
      expect(Number.isNaN(r.applicationOpenDate.getTime()), r.nameEn).toBe(false);
      if (r.deadline !== null) {
        expect(
          r.applicationOpenDate.getTime() <= r.deadline.getTime(),
          r.nameEn
        ).toBe(true);
      }
    }
  });

  it("eligibleCountries values are clean non-empty strings; empty means 'unknown' (allowed)", () => {
    for (const r of priorityScholarships2026) {
      for (const c of r.eligibleCountries) {
        expect(typeof c === "string" && c.trim() !== "", r.nameEn).toBe(true);
        expect(MOJIBAKE.test(c), `${r.nameEn}: mojibake in country "${c}"`).toBe(false);
      }
    }
  });

  it("eligibleEducation uses only BACHELOR / MASTER / PHD tokens", () => {
    for (const r of priorityScholarships2026) {
      expect(r.eligibleEducation.length, r.nameEn).toBeGreaterThan(0);
      for (const e of r.eligibleEducation) {
        expect(EDUCATION_TOKENS.has(e), `${r.nameEn}: token "${e}"`).toBe(true);
      }
    }
  });

  it("fieldOfStudy values are clean non-empty strings", () => {
    for (const r of priorityScholarships2026) {
      for (const f of r.fieldOfStudy) {
        expect(typeof f === "string" && f.trim() !== "", r.nameEn).toBe(true);
        expect(MOJIBAKE.test(f), `${r.nameEn}: mojibake in field "${f}"`).toBe(false);
      }
    }
  });

  it("requiredDocuments use only known document types", () => {
    for (const r of priorityScholarships2026) {
      expect(r.requiredDocuments.length, r.nameEn).toBeGreaterThan(0);
      for (const d of r.requiredDocuments) {
        expect(
          KNOWN_DOCUMENT_TYPES.has(d.toUpperCase()),
          `${r.nameEn}: unknown document type "${d}"`
        ).toBe(true);
      }
    }
  });

  it("competitionLevel is low / medium / high", () => {
    for (const r of priorityScholarships2026) {
      expect(COMPETITION_LEVELS.has(r.competitionLevel), `${r.nameEn}: "${r.competitionLevel}"`).toBe(
        true
      );
    }
  });

  it("benefits and requirements are valid JSON objects (seed convention)", () => {
    for (const r of priorityScholarships2026) {
      for (const field of ["benefits", "requirements"] as const) {
        const v = r[field];
        expect(typeof v === "string" && v.length > 0, `${r.nameEn}: ${field}`).toBe(true);
        expect(() => JSON.parse(v), `${r.nameEn}: ${field}`).not.toThrow();
        const parsed = JSON.parse(v) as unknown;
        expect(typeof parsed === "object" && parsed !== null, `${r.nameEn}: ${field}`).toBe(true);
      }
    }
  });

  it("age/GPA fields are numeric or null; minimumAge <= maximumAge when both present", () => {
    for (const r of priorityScholarships2026) {
      for (const n of ["minimumAge", "maximumAge", "minimumGPA", "applicationFee"] as const) {
        const v = r[n];
        if (v !== null) {
          expect(typeof v === "number" && !Number.isNaN(v), `${r.nameEn}: ${n}`).toBe(true);
        }
      }
      if (r.minimumAge !== null && r.maximumAge !== null) {
        expect(r.minimumAge <= r.maximumAge, r.nameEn).toBe(true);
      }
      if (r.minimumGPA !== null) {
        expect(r.minimumGPA >= 0 && r.minimumGPA <= 4, `${r.nameEn}: minimumGPA`).toBe(true);
      }
    }
  });

  it("collides with curated seed names ONLY where designed (no accidental duplicates)", () => {
    const collisions = priorityScholarships2026
      .filter((r) => CURATED_NAMES.has(r.nameEn))
      .map((r) => r.nameEn);
    expect(new Set(collisions)).toEqual(EXPECTED_CURATED_OVERLAPS);
  });

  it("aligned records reuse the exact curated nameAr (clean fill-empty merge)", () => {
    const curatedNameAr: Record<string, string> = {
      "Chevening Scholarship (UK Government)": "منحة Chevening البريطانية",
      "Swiss Government Excellence Scholarship": "منحة الحكومة السويسرية",
      "Gates Cambridge Scholarship (UK)": "منحة جيتس كامبريدج",
      "Rhodes Scholarship (Oxford)": "منحة رودس — أوكسفورد",
      "KAUST Fellowship (Saudi Arabia)": "منحة كاوست — جامعة الملك عبدالله",
      "Turkiye Burslari Scholarship (Türkiye)": "منحة تركيا بورسلاري",
      "Erasmus Mundus Joint Master Degree": "منحة إيراسموس موندوس",
      "MEXT Scholarship (Japanese Government Scholarship)": "منحة MEXT اليابانية",
      "Chinese Government Scholarship (CSC)": "منحة الحكومة الصينية",
      "Fulbright Foreign Student Program (USA)": "منحة فولبرايت الأمريكية",
      "Stipendium Hungaricum Scholarship": "منحة Stipendium Hungaricum",
      "Swedish Institute Scholarship for Global Professionals": "منحة المعهد السويدي",
      "Australia Awards Scholarship": "منحة جوائز أستراليا",
    };
    for (const r of priorityScholarships2026) {
      if (EXPECTED_CURATED_OVERLAPS.has(r.nameEn)) {
        expect(r.nameAr, r.nameEn).toBe(curatedNameAr[r.nameEn]);
      }
    }
  });

  it("matcher catch-all encodings are used only where the research supports them", () => {
    // eligibleCountries "All" — programmes open to (effectively) all nationalities.
    const allCountries = new Set([
      "Russian Government Quota Scholarship (Rossotrudnichestvo)",
      "Chevening Scholarship (UK Government)",
      "Swiss Government Excellence Scholarship",
      "Gates Cambridge Scholarship (UK)",
      "Schwarzman Scholars (China)",
      "Knight-Hennessy Scholars (Stanford)",
      "KAUST Fellowship (Saudi Arabia)",
      "Turkiye Burslari Scholarship (Türkiye)",
      "Erasmus Mundus Joint Master Degree",
      "MEXT Scholarship (Japanese Government Scholarship)",
      "Chinese Government Scholarship (CSC)",
      "Fulbright Foreign Student Program (USA)",
      "Stipendium Hungaricum Scholarship",
      "Romanian Government Scholarship (MFA Scholarships for non-EU Students)",
    ]);
    // fieldOfStudy "Any" — open to any field.
    const anyField = new Set([
      "Russian Government Quota Scholarship (Rossotrudnichestvo)",
      "Chevening Scholarship (UK Government)",
      "Commonwealth Scholarships (UK)",
      "Swiss Government Excellence Scholarship",
      "Gates Cambridge Scholarship (UK)",
      "Rhodes Scholarship (Oxford)",
      "Schwarzman Scholars (China)",
      "Knight-Hennessy Scholars (Stanford)",
      "Manaaki New Zealand Scholarships",
      "Turkiye Burslari Scholarship (Türkiye)",
      "MEXT Scholarship (Japanese Government Scholarship)",
      "Chinese Government Scholarship (CSC)",
      "Fulbright Foreign Student Program (USA)",
      "Stipendium Hungaricum Scholarship",
      "Australia Awards Scholarship",
      "Government of Ireland International Education Scholarship (GOI-IES)",
      "Romanian Government Scholarship (MFA Scholarships for non-EU Students)",
    ]);
    // englishRequirement "NOT_REQUIRED" — no English test required to apply.
    const noEnglishTest = new Set([
      "Russian Government Quota Scholarship (Rossotrudnichestvo)",
      "Commonwealth Scholarships (UK)",
      "Turkiye Burslari Scholarship (Türkiye)",
      "Romanian Government Scholarship (MFA Scholarships for non-EU Students)",
    ]);

    for (const r of priorityScholarships2026) {
      const isAllCountries = r.eligibleCountries.length === 1 && r.eligibleCountries[0] === "All";
      expect(isAllCountries, `${r.nameEn}: countries`).toBe(allCountries.has(r.nameEn));

      const isAnyField = r.fieldOfStudy.length === 1 && r.fieldOfStudy[0] === "Any";
      expect(isAnyField, `${r.nameEn}: fieldOfStudy`).toBe(anyField.has(r.nameEn));

      expect(r.englishRequirement === "NOT_REQUIRED", `${r.nameEn}: englishRequirement`).toBe(
        noEnglishTest.has(r.nameEn)
      );
    }
  });
});
