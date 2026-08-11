/**
 * TASK 2H — Scholarship enrichment dataset (import-ready).
 *
 * Adds the 11 government / institutional scholarship candidates flagged as
 * "not yet researched" in the Task 2F follow-up
 * (SCHOLARSHIP_ENRICHMENT_PRIORITIES.csv / the source PDF's last section).
 *
 * Three of the eleven are UPDATE records — they match an EXISTING scholarship
 * by exact nameEn, so the fill-empty import merge updates it (never creates a
 * duplicate). Eight are genuinely NEW records (source "MANUAL" — curated
 * research additions; none of their nameEn values exist in the DB).
 *
 * Run with --force: the UPDATE records carry deliberate changes that must
 * overwrite existing values (Melbourne benefits/requirements superset, Üsküdar
 * sourceUrl mojibake fix, Russia applicationFee fill). Everything else is equal
 * to the DB (skipped by the merge) or an empty gap field (filled).
 *
 * UPDATE #1 — Russian Government Quota Scholarship (Rossotrudnichestvo):
 *   Only real DB change = applicationFee 0 (was null; the PDF confirms the
 *   application is free and warns to never pay an agent). Every other field is
 *   copied verbatim from the existing record so the --force merge treats it as
 *   equal and skips it. benefits/requirements are intentionally omitted (they
 *   are already populated and identical to what research would confirm).
 *
 * UPDATE #2 — Human Rights Scholarship, University of Melbourne:
 *   Benefits/requirements superset (verified against the official Melbourne
 *   graduate-research page): adds the awards count ("4 awards available per
 *   year"), paid sick/maternity/paternity leave within the allowance terms,
 *   the relocation band detail, the need to already hold a graduate-research
 *   offer, the human-rights topic requirement, the no-prior-research-qualification
 *   rule and the separate scholarship application. All other fields verbatim.
 *
 * UPDATE #3 — Üsküdar University Scholarship (for9a listing):
 *   Gap fields filled (eligibleCountries, eligibleEducation, fieldOfStudy,
 *   englishRequirement, requiredDocuments, benefits, requirements) plus the
 *   sourceUrl mojibake fix: the DB value was
 *   ".../Ã¼skÃ¼dar-university-scholarship-..." (corrupted), the correct
 *   percent-encoded for9a URL is
 *   ".../%C3%BCsk%C3%BCdar-university-scholarship-..." — fixed via --force.
 *
 * NEW records (8) — government/institutional scholarships from the Arabic
 * source PDF, verified against official sources. All are recurring annual
 * programmes whose 2026 cycles are closed, so `deadline` is null and the
 * cycle history lives in `requirements`.
 *
 * Compatibility notes (see scripts/lib/scholarship-data.mjs / FIELD_DEFS):
 *  - `nameEn` is the identity key — UPDATE values are copied verbatim from the
 *    DB dump (the Melbourne nameEn keeps its literal curly apostrophe).
 *  - `deadline` is `Date | null` here: the three updates carry their existing
 *    confirmed dates; the eight new records have null (recurring, no
 *    future-confirmed date).
 *  - `benefits`/`requirements` follow the seed convention: JSON.stringify().
 *    They are optional in this interface because the Russia UPDATE omits them
 *    (already populated — the merge skips undefined fields).
 *  - `isVerified` / `verifiedAt` / `isActive` / `applicationOpenDate` are NOT in
 *    FIELD_DEFS, so the import pipeline drops them (they only survive a direct
 *    Prisma upsert). They are set here so the dataset tests can assert them.
 */

export interface ScholarshipEnrichmentRecord {
  nameEn: string;
  nameAr: string;
  country: string;
  university?: string | null;
  degree: string;
  deadline: Date | null;
  eligibleCountries: string[];
  eligibleEducation: string[];
  fieldOfStudy: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGPA: number | null;
  englishRequirement: string | null;
  requiresResearch: boolean;
  requiresWorkExp: boolean;
  applicationFee: number | null;
  competitionLevel: string;
  requiredDocuments: string[];
  benefits?: string | null;
  requirements?: string | null;
  sourceUrl: string;
  source: string;
  officialWebsite?: string | null;
  applicationUrl?: string | null;
  applicationOpenDate: Date | null;
  isVerified: boolean;
  verifiedAt: Date;
  isActive: boolean;
}

export const scholarships: ScholarshipEnrichmentRecord[] = [
  /* ---------------------------------------------------------------------- *
   * UPDATE 1 — Russian Government Quota (Rossotrudnichestvo)
   * Only change: applicationFee 0 (was null). All other fields verbatim.
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Russian Government Quota Scholarship (Rossotrudnichestvo)",
    nameAr: "منحة الحكومة الروسية",
    country: "Russia",
    university: "500+ participating Russian universities (741 in the previous cycle)",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-01-15T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement: "NOT_REQUIRED",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: 0,
    competitionLevel: "medium",
    requiredDocuments: [
      "PASSPORT",
      "TRANSCRIPT",
      "MEDICAL_CERTIFICATE",
      "MOTIVATION_LETTER",
      "RECOMMENDATION_LETTER",
      "PORTFOLIO",
    ],
    sourceUrl: "https://education-in-russia.com/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * UPDATE 2 — Human Rights Scholarship, University of Melbourne
   * Benefits/requirements superset (verified official facts). Others verbatim.
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Human Rights Scholarship 2026 at the University of Melbourne | Fully Funded Master’s & PhD in Australia",
    nameAr: "منحة حقوق الإنسان 2026 في جامعة ملبورن | ماجستير ودكتوراه ممولين بالكامل في أستراليا",
    country: "Australia",
    university: "University of Melbourne",
    degree: "Master / PhD",
    deadline: new Date("2026-10-31T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["MASTER", "PHD"],
    fieldOfStudy: ["Human Rights"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Melbourne graduate research admission",
    requiresResearch: true,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "high",
    requiredDocuments: ["RESEARCH_PROPOSAL", "TRANSCRIPT", "CV", "RECOMMENDATION_LETTER"],
    benefits: JSON.stringify({
      feeRemission: "100% fee remission",
      allowance: "Living allowance $44,500 per year (2026 rate) for up to 2 years (Master by Research) or 3.5 years (PhD)",
      relocation: "Relocation grant of $2,000 (outside Victoria) or $3,000 (outside Australia)",
      insurance: "OSHC single membership for international students",
      totalValue: "Total value approximately $89,000–$155,000",
      awards: "4 awards available per year",
      leave: "Paid sick, maternity and paternity leave within the allowance terms",
    }),
    requirements: JSON.stringify({
      level: "Graduate research degree (Master by Research or PhD) in Human Rights at the University of Melbourne",
      offer: "Must hold an offer for a graduate research programme at the University of Melbourne",
      research: "Research must be in the field of human rights",
      prior: "Must not already hold a research qualification at the same or higher level",
      application: "Separate scholarship application required — includes a statement of commitment to human rights and relevant experience",
      english: "English proficiency per graduate research admission",
      eligibility: "Open to domestic and international students",
      awards: "4 awards per year",
      opened: "Applications opened 1 April 2026",
      deadline: "Applications close 31 October 2026",
      outcome: "Outcomes announced by email in February of the following year",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/human-rights-scholarship-2026-at-the-university-of-melbourne-fully-funded-masters-phd-in-australia",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * UPDATE 3 — Üsküdar University Scholarship (for9a)
   * Gap fields filled + sourceUrl mojibake fixed (force overwrite).
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Üsküdar University Scholarship 2026 in Turkey | Scholarships for International Students",
    nameAr: "منحة جامعة أسكودار 2026 في تركيا | منح للطلاب الدوليين",
    country: "Turkey",
    university: " Üsküdar University",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2026-08-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: [
      "Medicine",
      "Dentistry",
      "Pharmacy",
      "Engineering",
      "Business Administration",
      "Psychology",
      "Health Sciences",
      "Media and Communication",
      "Artificial Intelligence and Data Science",
      "Humanities and Social Sciences",
    ],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English or Turkish per programme; IELTS/TOEFL if required — some programmes allow no-IELTS entry via the university proficiency exam or a preparatory language year",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: [
      "PASSPORT",
      "TRANSCRIPT",
      "CV",
      "MOTIVATION_LETTER",
      "RECOMMENDATION_LETTER",
      "LANGUAGE_TEST",
    ],
    benefits: JSON.stringify({
      coverage: "Tuition discounts of 25–100% depending on the programme and merit",
      note: "Not fully funded for all students — usually no housing, stipend or flights",
      language: "Programmes offered in English or Turkish",
      extras: "Modern laboratories, exchange programmes and practical training opportunities in Istanbul",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's, Master's and PhD programmes (also Foundation/Diploma) at Üsküdar University, Istanbul",
      nationality: "Open to all nationalities",
      education: "High-school certificate for Bachelor's; Bachelor's degree for Master's; Master's for PhD",
      gpa: "Medical and health-science majors typically require a high school average — confirm per programme",
      language: "English or Turkish; IELTS/TOEFL where required, or the university proficiency exam / prep year",
      deadline: "Current 2026 intake closes 30 August 2026; multiple intakes per year",
      application: "Apply through the university's international admissions office",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/%C3%BCsk%C3%BCdar-university-scholarship-2026-in-turkey-scholarships-for-international-students",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Greek Government Scholarship (IKY — Foreign Nationals)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Greek Government Scholarship (IKY — Foreign Nationals)",
    nameAr: "منحة الحكومة اليونانية للطلاب الأجانب",
    country: "Greece",
    university: "State Scholarships Foundation of Greece (IKY)",
    degree: "Bachelor",
    deadline: null,
    eligibleCountries: [
      "Albania",
      "Serbia",
      "North Macedonia",
      "Bosnia and Herzegovina",
      "Kosovo",
      "Montenegro",
      "Azerbaijan",
      "Armenia",
      "Georgia",
      "Kazakhstan",
      "Moldova",
      "Uzbekistan",
      "Ukraine",
      "Egypt",
      "Jordan",
      "Iraq",
      "Israel",
      "Lebanon",
      "Libya",
      "Palestine",
      "Syria",
      "Chile",
      "Uruguay",
      "Brazil",
      "Colombia",
      "Argentina",
      "India",
      "Indonesia",
      "South Korea",
      "Ethiopia",
      "Democratic Republic of the Congo",
      "Cabo Verde",
      "South Africa",
      "Nigeria",
    ],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "No English test required — free one-year Greek preparatory course provided",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["PASSPORT", "CV", "TRANSCRIPT"],
    benefits: JSON.stringify({
      stipend: "Monthly stipend of €650",
      tuition: "Tuition fees covered (exemption from tuition fees)",
      books: "Book-cost exemption",
      language: "Free one-year Greek preparatory course before the programme",
      provider: "State Scholarships Foundation of Greece (IKY) for foreign nationals",
    }),
    requirements: JSON.stringify({
      level: "Full-time Bachelor's degree at a Greek university (programmes taught in Greek)",
      nationality: "Foreign nationals from the eligible countries — application submitted through the Greek embassy/consulate in the home country",
      residence: "Applicants must reside outside Greece (at least 5 years)",
      documents: "Application form, CV, birth certificate, family-status certificate, secondary-school certificate, embassy residence certificate, passport and photo",
      deadline: "Annual cycle — the 2026-27 application window has closed; deadlines are set each year by the Greek embassies/consulates, so confirm the next window on iky.gr",
    }),
    sourceUrl: "https://www.iky.gr/en/category/scholarships-en/scholarships-for-foreign-nationals/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Banach NAWA Scholarship (Poland)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Banach NAWA Scholarship (Poland)",
    nameAr: "برنامج باناش ناوا البولندي للمنح الدراسية",
    country: "Poland",
    university: "Polish National Agency for Academic Exchange (NAWA)",
    degree: "Master",
    deadline: null,
    eligibleCountries: [
      "Albania",
      "Angola",
      "Argentina",
      "Armenia",
      "Azerbaijan",
      "Belarus",
      "Bosnia and Herzegovina",
      "Brazil",
      "Montenegro",
      "Philippines",
      "Georgia",
      "India",
      "Indonesia",
      "Iraq",
      "Iran",
      "Jordan",
      "Kazakhstan",
      "Kenya",
      "Kosovo",
      "Lebanon",
      "North Macedonia",
      "Mexico",
      "Moldova",
      "Mongolia",
      "Nigeria",
      "Palestine",
      "Papua New Guinea",
      "Peru",
      "Rwanda",
      "Senegal",
      "Serbia",
      "Tanzania",
      "Tunisia",
      "Ukraine",
      "Uzbekistan",
      "Vietnam",
    ],
    eligibleEducation: ["MASTER"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "B2 English or B1/B2 Polish depending on the chosen programme",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["PASSPORT", "TRANSCRIPT", "LANGUAGE_TEST"],
    benefits: JSON.stringify({
      stipend: "Monthly stipend of PLN 2,500 during the second-cycle (Master's) study",
      travel: "One-time travel allowance of PLN 2,500",
      provider: "Polish National Agency for Academic Exchange (NAWA)",
      note: "Tuition charged by the host Polish university is additional",
    }),
    requirements: JSON.stringify({
      level: "Full-time second-cycle (Master's) study in Poland",
      nationality: "Nationals of the eligible countries (official NAWA list)",
      language: "B2 English or B1/B2 Polish depending on the programme",
      academic: "Degree relevant to the chosen programme; contact with/acceptance by a Polish university is part of the process",
      application: "Online application via the NAWA system during the annual call",
      deadline: "Annual call — the 2026 call ran 13 April – 8 May 2026 and has closed; next call expected in 2027, confirm on nawa.gov.pl",
    }),
    sourceUrl: "https://nawa.gov.pl/en/students/foreign-students/the-banach-scholarship-programme",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Saudi Government Scholarship (Study in Saudi)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Saudi Government Scholarship (Study in Saudi)",
    nameAr: "منحة الحكومة السعودية (ادرس في السعودية)",
    country: "Saudi Arabia",
    university: "Ministry of Education — Study in Saudi (multiple Saudi universities)",
    degree: "Bachelor / Master / PhD",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: 16,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per programme; Arabic proficiency for Arabic-taught programmes",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["PASSPORT", "TRANSCRIPT", "MEDICAL_CERTIFICATE"],
    benefits: JSON.stringify({
      tuition: "Full tuition coverage",
      stipend: "Monthly stipend during the study period",
      housing: "Housing/accommodation as applicable per university",
      medical: "Medical coverage per programme",
      note: "Funding and extras vary by scholarship tier and host university under the Study in Saudi umbrella",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's, Master's or PhD at an accredited Saudi university",
      age: "At least 16 years; per-level caps typically apply (Bachelor 17–25, Master up to 30, PhD up to 35) — confirm per scholarship",
      admission: "Admission to an accredited Saudi university is required before the scholarship is confirmed",
      attestation: "Previous certificates must be attested; a medical examination report is required",
      rule: "One scholarship per level; recipients must comply with attendance and academic-progress rules",
      application: "Apply via the Study in Saudi portal (studyinsaudi.moe.gov.sa)",
      deadline: "Periodic intakes — the 2026 cycle has closed; watch the portal for the next round",
    }),
    sourceUrl: "https://studyinsaudi.moe.gov.sa/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — PEC-PG Brazilian Government Scholarship
   * ---------------------------------------------------------------------- */
  {
    nameEn: "PEC-PG Brazilian Government Scholarship",
    nameAr: "منحة الحكومة البرازيلية PEC-PG",
    country: "Brazil",
    university: "Government of Brazil (CAPES / CNPq / MRE)",
    degree: "Master / PhD",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "Portuguese required (studies in Portuguese); some programmes in English",
    requiresResearch: true,
    requiresWorkExp: false,
    applicationFee: 0,
    competitionLevel: "medium",
    requiredDocuments: [
      "PASSPORT",
      "TRANSCRIPT",
      "CV",
      "RESEARCH_PROPOSAL",
      "RECOMMENDATION_LETTER",
      "LANGUAGE_TEST",
    ],
    benefits: JSON.stringify({
      stipend: "Monthly stipend: R$2,100 (Master's) or R$3,100 (PhD)",
      insurance: "Health insurance",
      flight: "International flight (one round trip)",
      funding: "Funded by the Brazilian Government (CAPES) under the PEC-PG programme",
      duration: "Full duration of the Master's or PhD programme",
      fee: "Free application — no application fee (apply via inscricao.capes.gov.br)",
    }),
    requirements: JSON.stringify({
      level: "Master's or PhD (PEC-PG) at a participating Brazilian higher-education institution (IES)",
      nationality: "Nationals of developing countries with cooperation agreements with Brazil, residing outside Brazil",
      academic: "Bachelor's degree for Master's; Master's degree for PhD",
      language: "Portuguese required (studies in Portuguese); some programmes in English",
      documents: "Passport, transcripts, CV, research proposal, recommendation letters and language certificate",
      application: "Free online application via inscricao.capes.gov.br during the open call",
      deadline: "Annual calls — the 2026 cycle closed (Master's: 14 Aug – 29 Sep 2025; Doctoral sandwich: 1 Oct – 30 Dec 2025); next cycle expected ~Aug–Dec 2026, confirm on gov.br/capes",
    }),
    sourceUrl: "https://www.gov.br/capes/pt-br/acesso-a-informacao/acoes-e-programas/bolsas/bolsas-e-auxilios-internacionais/encontre-aqui/paises/multinacional/programa-de-estudantes-convenio-de-pos-graduacao-pec-pg",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Study in Kazakhstan Scholarship Program
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Study in Kazakhstan Scholarship Program",
    nameAr: "منحة الحكومة الكازاخستانية (Study in Kazakhstan)",
    country: "Kazakhstan",
    university: "Ministry of Science and Higher Education of Kazakhstan (Study in Kazakhstan)",
    degree: "Bachelor / Master / PhD",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: [
      "Computer Science and Information Technology",
      "Artificial Intelligence",
      "Engineering",
      "Medicine and Health",
      "Business and Economics",
      "Natural Sciences",
      "Agriculture",
      "Law",
      "International Relations",
      "Languages and Humanities",
    ],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "Postgraduate programmes: IELTS ≥ 5.5 or TOEFL iBT ≥ 46 (or equivalent); Bachelor programmes may teach in Kazakh, Russian or English",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["PASSPORT", "TRANSCRIPT"],
    benefits: JSON.stringify({
      tuition: "Study funding — tuition covered for the programme duration",
      coverage: "Covers the cost of study only (accommodation, flights and stipend are not automatically included)",
      grants: "550 state grants in 2026: 490 Bachelor, 50 Master, 10 PhD",
      provider: "Ministry of Science and Higher Education of the Republic of Kazakhstan",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's, Master's or PhD at a Kazakhstani university (Study in Kazakhstan)",
      applicant: "Foreign citizens and persons of Kazakh origin who are not citizens of Kazakhstan",
      academic: "Bachelor: secondary-school completion with at least 'good' grades; higher levels require the prior degree",
      language: "Postgraduate programmes: IELTS ≥ 5.5 or TOEFL iBT ≥ 46 (or equivalent)",
      gpa: "Master's applicants should meet the university's minimum GPA (often ~2.33/4.0 equivalent) — confirm per university",
      application: "Apply via studyin.kz and the university admission process; grants are allocated per programme quota",
      deadline: "Annual cycle — the 2026 quota is allocated; the 2027 window typically opens in early 2027",
    }),
    sourceUrl: "https://studyin.kz/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "MAIPs-UniSIRAJ Higher Education Scholarship (Malaysia)",
    nameAr: "منحة MAIPs-UniSIRAJ للتعليم العالي",
    country: "Malaysia",
    university: "Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)",
    degree: "Bachelor / Master / PhD",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: [
      "Business and Management",
      "IT and Computer Science",
      "Islamic Finance and Banking",
      "Islamic Studies",
      "Humanities",
      "Languages and Foundation Studies",
    ],
    minimumAge: null,
    maximumAge: 35,
    minimumGPA: null,
    englishRequirement:
      "IELTS / TOEFL / MUET required for international students per programme",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: [
      "PASSPORT",
      "TRANSCRIPT",
      "ENGLISH_TEST",
      "RECOMMENDATION_LETTER",
      "MEDICAL_CERTIFICATE",
    ],
    benefits: JSON.stringify({
      tuition: "Full tuition fees",
      housing: "Free university housing",
      allowance: "Monthly living allowance",
      refund: "Registration fees refunded",
      provider: "MAIPs Higher Education Scholarship with UniSIRAJ (Universiti Islam Antarabangsa Tuanku Syed Sirajuddin)",
      scope: "Diploma, Bachelor, Master and PhD programmes",
    }),
    requirements: JSON.stringify({
      level: "Diploma, Bachelor's, Master's or PhD at UniSIRAJ",
      age: "Maximum 35 years for most programmes",
      admission: "International students must first gain university admission, then apply for the MAIPs grant",
      language: "IELTS / TOEFL / MUET for international students per programme",
      docs: "Passport, transcripts, English test, recommendation letter and medical certificate",
      note: "Scholars cannot simultaneously hold another scholarship; full-time study required",
      deadline: "Application open with each intake — no unified closing date; apply early for each semester",
    }),
    sourceUrl: "https://www.unisiraj.edu.my/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Les Roches Scholarship (Switzerland)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Les Roches Scholarship (Switzerland)",
    nameAr: "منح معهد لي روش (Les Roches)",
    country: "Switzerland",
    university: "Les Roches (Sommet Education) — Switzerland, Spain and UAE campuses",
    degree: "Bachelor / Master",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER"],
    fieldOfStudy: [
      "Hospitality Management",
      "Luxury Management",
      "Business Administration",
      "Finance",
      "Entrepreneurship",
    ],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency required (IELTS/TOEFL per programme)",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: [
      "PASSPORT",
      "TRANSCRIPT",
      "CV",
      "MOTIVATION_LETTER",
      "ENGLISH_TEST",
    ],
    benefits: JSON.stringify({
      type: "Partial scholarships and tuition grants/discounts (no full-cost scholarships)",
      coverage: "Reduces tuition for eligible programmes (Bachelor and Master, incl. MSc International Hospitality Management)",
      campuses: "Switzerland, Spain and UAE campuses",
      selection: "Merit and needs-based, varies by programme and campus",
      application: "Scholarship request submitted as part of the admissions application",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's and Master's programmes at Les Roches (e.g. BBA Global Hospitality Management, MSc International Hospitality Management)",
      applicant: "Open to all nationalities",
      language: "English proficiency required per programme",
      docs: "Passport, transcripts/certificates, CV, motivation letter and English test (IELTS/TOEFL)",
      availability: "Limited seats — apply early",
      deadline: "Rolling throughout the year, varies by programme and campus; seats fill on a first-come basis",
    }),
    sourceUrl: "https://lesroches.edu/apply/scholarships/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  /* ---------------------------------------------------------------------- *
   * NEW — Innopolis University Scholarship (Russia)
   * ---------------------------------------------------------------------- */
  {
    nameEn: "Innopolis University Scholarship (Russia)",
    nameAr: "منحة جامعة إينوبوليس التقنية",
    country: "Russia",
    university: "Innopolis University",
    degree: "Bachelor / Master / PhD",
    deadline: null,
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: [
      "Computer Science",
      "Software Engineering",
      "Data Science and Artificial Intelligence",
      "Security and Network Engineering",
      "Robotics and Computer Vision",
      "IT Entrepreneurship",
    ],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English-taught programmes — proficiency required per programme",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["PASSPORT", "TRANSCRIPT"],
    benefits: JSON.stringify({
      scholarship: "Scholarships covering 20–100% of tuition based on entrance-competition results",
      language: "English-taught programmes",
      levels: "Bachelor, Master and PhD in IT fields",
      note: "Some funded recipients may owe a period of work at a partner company after graduation",
      application: "Apply through the official admissions portal (apply.innopolis.university)",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's, Master's or PhD in IT-related fields at Innopolis University (Russia)",
      admission: "Entrance tests and an interview form part of the selection",
      language: "English proficiency required (programmes taught in English)",
      documents: "Passport and transcripts",
      application: "Apply via apply.innopolis.university",
      deadline: "Multiple intakes per year — confirm the current application window on the portal",
    }),
    sourceUrl: "https://innopolis.university/en/",
    source: "MANUAL",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
];

export default scholarships;
