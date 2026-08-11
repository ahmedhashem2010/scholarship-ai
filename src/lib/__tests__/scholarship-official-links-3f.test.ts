import { describe, it, expect } from "vitest";
import { scholarshipOfficialLinks } from "../../../prisma/scholarship-official-links-3f";

/**
 * TASK 3F validation — scoped strictly to the official-links dataset file
 * (prisma/scholarship-official-links-3f.ts). Deliberately self-contained: it
 * mirrors the Final MVP 50 identity list and the pipeline's URL rules instead
 * of importing scripts/lib/scholarship-data.mjs, so the tests never couple to
 * the .mjs helpers. No database access.
 *
 * Rules enforced:
 *  1. exactly 50 records (one per Final MVP scholarship)
 *  2. nameEn unique and matching the Final MVP 50 set (no extras/missing)
 *  3. base fields present on every record
 *  4. officialWebsite / applicationUrl are either null or HTTPS URLs
 *  5. no aggregator hosts (for9a.com / for9a.org) anywhere
 *  6. every URL lives on a provider-owned domain (vendor application portals
 *     that the provider runs on Qualtrics / SmartyGrants / Power Apps are
 *     explicitly allowed per-record)
 */

const AGGREGATOR_HOSTS = new Set(["for9a.com", "for9a.org"]);
const HTTPS_ONLY = /^https:\/\//i;

const MVP_NAMES: string[] = [
  "Australia Awards Scholarship",
  "Banach NAWA Scholarship (Poland)",
  "Chevening Scholarship (UK Government)",
  "Chinese Government Scholarship (CSC)",
  "Erasmus Mundus Joint Master Degree",
  "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen",
  "Fulbright Foreign Student Program (USA)",
  "Fully Funded ADB Master's Scholarship in Asia and Pacific 2026",
  "Fully Funded Research Scholarships at CQUniversity Australia",
  "Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026",
  "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University",
  "Fully Funded Scholarships in Iraq 2026 for International Students",
  "Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation",
  "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia",
  "Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026",
  "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore",
  "Gates Cambridge Scholarship (UK)",
  "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey",
  "Greek Government Scholarship (IKY — Foreign Nationals)",
  "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia",
  "Innopolis University Scholarship (Russia)",
  "KAUST Fellowship (Saudi Arabia)",
  "Knight-Hennessy Scholars (Stanford)",
  "Les Roches Scholarship (Switzerland)",
  "MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)",
  "Manaaki New Zealand Scholarships",
  "Mastercard Foundation Scholarship at the University of Pretoria",
  "McCall MacBain Scholarship | Fully Funded Master's Programs at McGill University in Canada",
  "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia",
  "MEXT Scholarship (Japanese Government Scholarship)",
  "New Zealand Government Scholarship for International Students 2026",
  "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK",
  "Partially Funded Harvard MBA Scholarship 2026",
  "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK",
  "Partially-Funded University of Bradford MERO Scholarship",
  "PhD Scholarships for Development Countries Students at the University of Cambridge 2026",
  "Rhodes Scholarship (Oxford)",
  "Romanian Government Scholarship (MFA Scholarships for non-EU Students)",
  "Russian Government Quota Scholarship (Rossotrudnichestvo)",
  "Saudi Government Scholarship (Study in Saudi)",
  "Schwarzman Scholars (China)",
  "Stipendium Hungaricum Scholarship",
  "Study in Kazakhstan Scholarship Program",
  "Swedish Institute Scholarship for Global Professionals",
  "Swiss Government Excellence Scholarship",
  "Turkiye Burslari Scholarship (Türkiye)",
  "Undergraduate & Postgraduate Business Scholarships at QUT in Australia",
  "University of Sydney International Scholarship for Postgraduates Students 2026",
  "University of Sydney Undergraduate Scholarship 2026 (Fully Funded)",
  "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students",
];

/**
 * Registrable provider domains per record (nameEn -> allowed suffixes).
 * vendor-hosting exceptions where the provider runs its own application on a
 * third-party platform:
 *   - Univ. of Sydney undergrad → qualtrics.com (official "Apply now" form)
 *   - Univ. of Melbourne Human Rights → smartygrants.com.au (SmartyGrants)
 *   - Manaaki NZ → powerappsportals.com (official MNZSP applicant portal)
 */
const PROVIDER_DOMAINS: Record<string, string[]> = {
  "Australia Awards Scholarship": ["dfat.gov.au"],
  "Banach NAWA Scholarship (Poland)": ["nawa.gov.pl"],
  "Chevening Scholarship (UK Government)": ["chevening.org"],
  "Chinese Government Scholarship (CSC)": ["campuschina.org", "csc.edu.cn"],
  "Erasmus Mundus Joint Master Degree": ["europa.eu"],
  "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen": [
    "rug.nl",
  ],
  "Fulbright Foreign Student Program (USA)": ["fulbrightonline.org"],
  "Fully Funded ADB Master's Scholarship in Asia and Pacific 2026": ["adb.org"],
  "Fully Funded Research Scholarships at CQUniversity Australia": ["cqu.edu.au"],
  "Fully Funded Scholarships for Bachelor's, Master's, and PhD in Germany 2026": [
    "boell.de",
  ],
  "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University": [
    "adu.ac.ae",
  ],
  "Fully Funded Scholarships in Iraq 2026 for International Students": [
    "scrd-gate.gov.iq",
  ],
  "Fully Funded Shanghai Government Scholarship 2026 with Stipend & Accommodation": [
    "sh.gov.cn",
    "study-shanghai.cn",
  ],
  "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia": [
    "curtin.edu.au",
  ],
  "Fully Funded Undergraduate, Master’s & PhD Scholarship in China 2026": [
    "ustc.edu.cn",
  ],
  "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore": [
    "ntu.edu.sg",
  ],
  "Gates Cambridge Scholarship (UK)": ["gatescambridge.org"],
  "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey": [
    "turkiyeburslari.gov.tr",
  ],
  "Greek Government Scholarship (IKY — Foreign Nationals)": ["iky.gr"],
  "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia": [
    "unimelb.edu.au",
    "smartygrants.com.au",
  ],
  "Innopolis University Scholarship (Russia)": ["innopolis.university"],
  "KAUST Fellowship (Saudi Arabia)": ["kaust.edu.sa"],
  "Knight-Hennessy Scholars (Stanford)": ["stanford.edu"],
  "Les Roches Scholarship (Switzerland)": ["lesroches.edu"],
  "MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)": ["unisiraj.edu.my"],
  "Manaaki New Zealand Scholarships": [
    "nzscholarships.govt.nz",
    "powerappsportals.com",
  ],
  "Mastercard Foundation Scholarship at the University of Pretoria": ["up.ac.za"],
  "McCall MacBain Scholarship | Fully Funded Master's Programs at McGill University in Canada": [
    "mccallmacbainscholars.org",
  ],
  "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia": [
    "deakin.edu.au",
  ],
  "MEXT Scholarship (Japanese Government Scholarship)": ["studyinjapan.go.jp"],
  "New Zealand Government Scholarship for International Students 2026": [
    "nzscholarships.govt.nz",
  ],
  "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK": [
    "bradford.ac.uk",
  ],
  "Partially Funded Harvard MBA Scholarship 2026": ["hbs.edu"],
  "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK": [
    "gla.ac.uk",
  ],
  "Partially-Funded University of Bradford MERO Scholarship": ["bradford.ac.uk"],
  "PhD Scholarships for Development Countries Students at the University of Cambridge 2026": [
    "cambridgetrust.org",
  ],
  "Rhodes Scholarship (Oxford)": ["ox.ac.uk"],
  "Romanian Government Scholarship (MFA Scholarships for non-EU Students)": [
    "mae.ro",
    "studyinromania.gov.ro",
  ],
  "Russian Government Quota Scholarship (Rossotrudnichestvo)": [
    "education-in-russia.com",
  ],
  "Saudi Government Scholarship (Study in Saudi)": ["moe.gov.sa", "studyinsaudi.sa"],
  "Schwarzman Scholars (China)": ["schwarzmanscholars.org"],
  "Stipendium Hungaricum Scholarship": ["stipendiumhungaricum.hu"],
  "Study in Kazakhstan Scholarship Program": ["studyin.kz"],
  "Swedish Institute Scholarship for Global Professionals": ["si.se"],
  "Swiss Government Excellence Scholarship": ["sbfi.admin.ch"],
  "Turkiye Burslari Scholarship (Türkiye)": ["turkiyeburslari.gov.tr"],
  "Undergraduate & Postgraduate Business Scholarships at QUT in Australia": [
    "qut.edu.au",
  ],
  "University of Sydney International Scholarship for Postgraduates Students 2026": [
    "sydney.edu.au",
  ],
  "University of Sydney Undergraduate Scholarship 2026 (Fully Funded)": [
    "sydney.edu.au",
    "qualtrics.com",
  ],
  "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students": [
    "uskudar.edu.tr",
  ],
};

function hostOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function allowedHost(hostname: string, domains: string[]): boolean {
  return domains.some(
    (d) => hostname === d || hostname.endsWith("." + d)
  );
}

function expectProviderDomain(url: string, record: string) {
  const host = hostOf(url);
  const allowed = PROVIDER_DOMAINS[record];
  if (!allowed) {
    throw new Error(`no PROVIDER_DOMAINS entry for "${record}"`);
  }
  expect(
    allowedHost(host, allowed),
    `${record}: "${url}" host "${host}" is not on a provider domain (${allowed.join(", ")})`
  ).toBe(true);
}

describe("scholarship-official-links-3f dataset", () => {
  it("contains exactly the 50 Final MVP identities (no extras, no missing)", () => {
    const names = scholarshipOfficialLinks.map((r) => r.nameEn);
    expect(names.length).toBe(50);
    expect(names.sort()).toEqual([...MVP_NAMES].sort());
  });

  it("does not allow duplicate nameEn values", () => {
    const seen = new Set<string>();
    for (const r of scholarshipOfficialLinks) {
      expect(seen.has(r.nameEn)).toBe(false);
      seen.add(r.nameEn);
    }
  });

  it("exposes all base fields on every record", () => {
    for (const r of scholarshipOfficialLinks) {
      expect(r.nameAr).toBeTypeOf("string");
      expect(r.nameAr.trim().length).toBeGreaterThan(0);
      expect(r.country).toBeTypeOf("string");
      expect(r.country.trim().length).toBeGreaterThan(0);
      expect(r.degree).toBeTypeOf("string");
      expect(r.degree.trim().length).toBeGreaterThan(0);
    }
  });

  it("officialWebsite is either null or a well-formed HTTPS URL", () => {
    for (const r of scholarshipOfficialLinks) {
      if (r.officialWebsite === null) continue;
      expect(r.officialWebsite, r.nameEn).toMatch(HTTPS_ONLY);
      expect(() => new URL(r.officialWebsite as string), r.nameEn).not.toThrow();
    }
  });

  it("applicationUrl is either null or a well-formed HTTPS URL", () => {
    for (const r of scholarshipOfficialLinks) {
      if (r.applicationUrl === null) continue;
      expect(r.applicationUrl, r.nameEn).toMatch(HTTPS_ONLY);
      expect(() => new URL(r.applicationUrl as string), r.nameEn).not.toThrow();
    }
  });

  it("never references an aggregator host (for9a.com / for9a.org)", () => {
    for (const r of scholarshipOfficialLinks) {
      for (const url of [r.officialWebsite, r.applicationUrl]) {
        if (url === null) continue;
        const host = hostOf(url);
        expect(
          AGGREGATOR_HOSTS.has(host) ||
            Array.from(AGGREGATOR_HOSTS).some((h) => host.endsWith("." + h)),
          `${r.nameEn}: "${url}" is an aggregator`
        ).toBe(false);
      }
    }
  });

  it("every officialWebsite is on the provider's own domain", () => {
    for (const r of scholarshipOfficialLinks) {
      expect(r.officialWebsite, `${r.nameEn} has no officialWebsite`).not.toBeNull();
      expectProviderDomain(r.officialWebsite as string, r.nameEn);
    }
  });

  it("every applicationUrl is on the provider's own domain (or a sanctioned vendor portal)", () => {
    for (const r of scholarshipOfficialLinks) {
      if (r.applicationUrl === null) continue;
      expectProviderDomain(r.applicationUrl, r.nameEn);
    }
  });

  it("every record that lacks an applicationUrl is applied for automatically via admission", () => {
    const AUTO_CONSIDERATION = new Set<string>([
      "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen",
      "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University",
      "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia",
      "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore",
      "Les Roches Scholarship (Switzerland)",
      "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia",
      "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK",
      "Partially Funded Harvard MBA Scholarship 2026",
      "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK",
      "Partially-Funded University of Bradford MERO Scholarship",
      "PhD Scholarships for Development Countries Students at the University of Cambridge 2026",
      "Undergraduate & Postgraduate Business Scholarships at QUT in Australia",
      "University of Sydney International Scholarship for Postgraduates Students 2026",
      "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students",
    ]);
    const missing = scholarshipOfficialLinks.filter((r) => r.applicationUrl === null);
    expect(missing.length).toBe(14);
    for (const r of missing) {
      expect(AUTO_CONSIDERATION.has(r.nameEn), r.nameEn).toBe(true);
    }
  });
});
