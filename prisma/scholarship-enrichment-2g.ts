/**
 * TASK 2G — Scholarship enrichment dataset (import-ready).
 *
 * Enriches the 18-record high-value shortlist identified in Task 2F's follow-up
 * (SCHOLARSHIP_ENRICHMENT_PRIORITIES.csv — the top-ranked scraped records that
 * carry a null deadline and empty eligibility fields, ranked 28+ or flagged as
 * "deadline NULL / needs research"). Every record matches an EXISTING scraped
 * scholarship by exact nameEn, so the fill-empty import merge UPDATES it —
 * never creates a duplicate. Run with --force so the small set of deliberate
 * corrections below overwrites existing values; everything else is equal to the
 * DB (skipped) or an empty gap field (filled).
 *
 * Enrichment scope per record:
 *  - gap fields filled (were null/empty): deadline, eligibleCountries,
 *    eligibleEducation, fieldOfStudy, maximumAge, englishRequirement,
 *    requiresResearch, requiredDocuments, benefits, requirements.
 *  - deliberate corrections (differ from the existing DB values — verified
 *    against the official source AND the scraped description):
 *      degree     Sydney UG (was "Master", undergrad programme)      -> "Bachelor"
 *      degree     Glasgow UG Excellence (was "Master")               -> "Bachelor"
 *      degree     QUT Business (was "Master", UG+PG)                 -> "Bachelor / Master"
 *      degree     ADU Chairman's (was "Master", fresh secondary grads)-> "Bachelor"
 *      degree     Bradford country-specific (was "Master", UG/PGT/PGR)-> "Bachelor / Master / PhD"
 *      degree     Deakin Merit (was "Master", B/M/PhD in description) -> "Bachelor / Master / PhD"
 *      degree     Curtin AAS (was "Master", mainly PG + limited UG)   -> "Bachelor / Master / PhD"
 *      degree     Sydney postgrad (was "Master", MRes or PhD)         -> "Master / PhD"
 *      university Bradford MERO + country-specific: "Bradford University " (trailing space)
 *                                                 -> "University of Bradford"
 *      university Mastercard: "Mastercard Foundation " (trailing space)
 *                                                 -> "University of Pretoria" (host institution)
 *      university Deakin: "Deakin university"    -> "Deakin University"
 *      country    Aberdeen (was "Egypt" — that is the audience origin,
 *                 not the study destination; scholarship is at Aberdeen, UK)
 *                                                 -> "United Kingdom"
 *      country    Eric Bleumink (was "Sudan" — audience origin, not the study
 *                 destination; host is University of Groningen, NL)
 *                                                 -> "Netherlands"
 *
 * NOT changed (kept verbatim from the DB, verified clean):
 *  - `nameAr` is already clean Arabic for all 18 records — copied verbatim so
 *    the merge treats it as equal and never rewrites it.
 *  - `nameEn` including the literal "£" in the Southampton record.
 *  - `sourceUrl` (for9a listing) and `source` ("SCRAPED") — provenance preserved.
 *  - `competitionLevel` — kept at the existing DB value.
 *
 * Deliberately NOT in this dataset (documented in the Task 2G report):
 *  - The 6 NTU near-duplicate records (this dataset only touches
 *    cmpfgl4z4 "Fully-funded Bachelor's Scholarships in Various Disciplines…").
 *  - The Manaaki New Zealand curated record (cmslptdg…) which is the same
 *    programme as the scraped NZ Government record enriched here.
 *  - The Türkiye Burslari curated record (cmpfgje2c…) which overlaps the
 *    Government of Turkey PhD record enriched here.
 *  - The Gates Cambridge / Cambridge disabled-students records — only the
 *    Schlumberger/Trust developing-countries PhD record is enriched.
 *
 * Compatibility notes (see scripts/lib/scholarship-data.mjs / FIELD_DEFS):
 *  - `nameEn` is the identity key — values below are copied verbatim from the DB.
 *  - `deadline` was null for every record — these are the next-cycle dates from
 *    the research notes. Rolling/"no fixed deadline" programmes carry an
 *    indicative end-of-cycle date and say so in `requirements`.
 *  - `source` stays "SCRAPED" (provenance preserved).
 *  - `description` and `flagUrl` are intentionally omitted → untouched by the
 *    merge; verified facts live in `benefits` / `requirements`.
 *  - `benefits`/`requirements` follow the seed convention: JSON.stringify().
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
  deadline: Date;
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
  benefits: string;
  requirements: string;
  sourceUrl: string;
  source: string;
  applicationOpenDate: Date | null;
  isVerified: boolean;
  verifiedAt: Date;
  isActive: boolean;
}

const AFRICAN_COUNTRIES = [
  "Algeria",
  "Angola",
  "Benin",
  "Botswana",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cameroon",
  "Central African Republic",
  "Chad",
  "Comoros",
  "Congo",
  "Côte d'Ivoire",
  "Democratic Republic of the Congo",
  "Djibouti",
  "Egypt",
  "Equatorial Guinea",
  "Eritrea",
  "Eswatini",
  "Ethiopia",
  "Gabon",
  "Gambia",
  "Ghana",
  "Guinea",
  "Guinea-Bissau",
  "Kenya",
  "Lesotho",
  "Liberia",
  "Libya",
  "Madagascar",
  "Malawi",
  "Mali",
  "Mauritania",
  "Mauritius",
  "Morocco",
  "Mozambique",
  "Namibia",
  "Niger",
  "Nigeria",
  "Rwanda",
  "São Tomé and Príncipe",
  "Senegal",
  "Seychelles",
  "Sierra Leone",
  "Somalia",
  "South Africa",
  "South Sudan",
  "Sudan",
  "Tanzania",
  "Togo",
  "Tunisia",
  "Uganda",
  "Zambia",
  "Zimbabwe",
];

export const scholarships: ScholarshipEnrichmentRecord[] = [
  {
    nameEn: "Aberdeen Global Scholarship for Postgraduate Students from Africa",
    nameAr: "منحة أبردين العالمية لطلاب الدراسات العليا من أفريقيا",
    country: "United Kingdom",
    university: "University of Aberdeen",
    degree: "Master",
    deadline: new Date("2026-11-30T23:59:00.000Z"),
    eligibleCountries: AFRICAN_COUNTRIES,
    eligibleEducation: ["MASTER"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Aberdeen taught postgraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      discount: "£8,000 tuition-fee discount for eligible self-funded taught Masters students",
      eligibility: "International fee status and domiciled in an African country",
      start: "September 2026 and January 2027 intakes",
      application: "Automatic — no separate scholarship application (awarded with admission)",
      excluded: "Not available for PGDE degrees or students receiving other external / University of Aberdeen scholarships (except Development Trust awards)",
    }),
    requirements: JSON.stringify({
      level: "Full-time on-campus taught Masters (PGT) programme at the University of Aberdeen",
      domicile: "Classed as international fee status and domiciled in an African country",
      funding: "Self-funded",
      deadline: "No separate scholarship deadline — apply for admission; the January 2027 intake deadline is typically late autumn 2026 (indicative 30 Nov 2026), confirm on abdn.ac.uk",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/aberdeen-global-scholarship-for-postgraduate-students-from-africa",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Fully Funded Scholarships for Undergraduates Students at Abu Dhabi University",
    nameAr: "منح دراسية ممولة بالكامل لطلاب البكالوريوس في جامعة أبوظبي",
    country: "United Arab Emirates",
    university: "Abu Dhabi University",
    degree: "Bachelor",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per Abu Dhabi University undergraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "PASSPORT", "ENGLISH_TEST"],
    benefits: JSON.stringify({
      coverage: "100% tuition and academic-fees waiver (Chairman's Scholarship)",
      eligibility: "International students who join ADU in the same year as their secondary-school graduation",
      gpa: "High-school average of at least 97%",
      duration: "Full duration of the undergraduate programme, subject to maintaining academic standing",
    }),
    requirements: JSON.stringify({
      level: "Undergraduate (Bachelor's) programmes at Abu Dhabi University",
      graduation: "Must have graduated secondary school in the same year as joining ADU",
      gpa: "High-school average of 97% or higher",
      application: "Awarded as part of admission — apply through the ADU admissions portal",
      deadline: "Intake-dependent; applications open each semester (indicative 30 Jun 2027), confirm current dates on adu.ac.ae",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/chairman-scholarship-students",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Concordia University Entrance Scholarships for Bachelor's Students",
    nameAr: "منح دخول جامعة كونكورديا لطلاب البكالوريوس",
    country: "Canada",
    university: "Concordia University",
    degree: "Bachelor",
    deadline: new Date("2027-02-01T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per Concordia University undergraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      award: "Entrance scholarships up to CAD 10,000",
      selection: "Most entrance scholarships are automatic and based on the academic ranking of admission candidates",
      payable: "Disbursed to the university account after registration verification, in two equal installments across the Fall and Winter terms",
    }),
    requirements: JSON.stringify({
      level: "Full-time, first-entry Bachelor's admission at Concordia University",
      basis: "Top CEGEP grades or equivalent (Canadian high school or equivalent)",
      note: "An offer of admission does not guarantee selection; not available to visiting, independent or continuing students",
      deadline: "Awarded every Fall with admission — the effective date follows the chosen program's admission deadline (indicative 1 Feb 2027), confirm on concordia.ca",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/concordia-university-entrance-scholarships-for-bachelors-students",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Eric Bleumink Fund Scholarship for International Masters Students at the University of Groningen",
    nameAr: "منحة صندوق إريك بليومينك لطلاب الماجستير الدوليين في جامعة خرونينجن",
    country: "Netherlands",
    university: "University of Groningen",
    degree: "Master",
    deadline: new Date("2026-12-01T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["MASTER"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Groningen master's admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "high",
    requiredDocuments: ["TRANSCRIPT", "MOTIVATION_LETTER", "RECOMMENDATION_LETTER", "CV", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      coverage: "Full funding: tuition fees, international travel, accommodation and living costs (and visa costs where applicable)",
      duration: "Covers the full master's programme (one or two years depending on the programme)",
      note: "Administered by the Eric Bleumink Fund of the University of Groningen for students from developing countries",
    }),
    requirements: JSON.stringify({
      level: "Master's programmes (MSc / MA / LL.M) at the University of Groningen",
      nationality: "Nationals of developing countries (fund priority list — confirm on rug.nl)",
      admission: "Must hold an unconditional offer of admission for a Groningen master's programme",
      application: "Apply via the University of Groningen application portal (OAS) using the correct study-grant code",
      deadline: "1 December 2026 (applications open from mid-October)",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/eric-bleumink-fund-scholarship-for-international-masters-students-at-the-university-of-groningen",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Fully-funded Bachelor's Scholarships in Various Disciplines from Nanyang Technological University in Singapore",
    nameAr: "منح البكالوريوس الممولة بالكامل في مختلف التخصصات من جامعة نانيانغ التكنولوجية في سنغافورة",
    country: "Singapore",
    university: "Nanyang Technological University",
    degree: "Bachelor",
    deadline: new Date("2027-03-19T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per Nanyang Technological University undergraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "CV", "PERSONAL_STATEMENT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      coverage: "Full tuition fees (after the Tuition Grant) for the duration of the undergraduate programme",
      stipend: "Living allowance of S$6,500 per year",
      extras: "Accommodation allowance and travel grant",
      note: "Administered by Nanyang Technological University for outstanding full-time undergraduate students",
    }),
    requirements: JSON.stringify({
      level: "Full-time undergraduate programmes (any major) at NTU",
      academic: "Outstanding academic results in the final years of secondary/high school",
      admission: "Scholarship consideration is part of the undergraduate admission application",
      deadline: "Annual application window ~Jan–Mar (indicative 19 Mar 2027 for the next cycle; the 2026 entry window closed 19 Mar 2026) — confirm on ntu.edu.sg",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/fully-funded-bachelors-scholarships-in-various-disciplines-from-nanyang-technological-university-in-singapore",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Fully Funded Undergraduate and Postgraduate Scholarships at Curtin University in Australia",
    nameAr: "منح دراسية ممولة بالكامل للبكالوريوس والدراسات العليا في جامعة كورتين في أستراليا",
    country: "Australia",
    university: "Curtin University",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-04-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Business", "Law", "Health Sciences", "Humanities", "Science", "Engineering"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per Curtin University / Australia Awards requirements (IELTS, TOEFL or PTE)",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT", "RECOMMENDATION_LETTER"],
    benefits: JSON.stringify({
      programme: "Australia Awards Scholarships (AAS), funded by the Australian Government",
      coverage: "Full tuition fees, return air travel, establishment allowance and Overseas Student Health Cover (OSHC)",
      level: "Primarily postgraduate (Master's/PhD) with a limited number of undergraduate awards",
      duration: "Full duration of the course at Curtin University",
    }),
    requirements: JSON.stringify({
      level: "Postgraduate (mainly) and limited undergraduate study at Curtin University (Business & Law, Health Sciences, Humanities, Science & Engineering, WASM)",
      nationality: "Citizens of eligible developing/partner countries under bilateral and regional agreements",
      admission: "Apply via the Australia Awards online application portal during the open round",
      return: "Scholars must return to their home country for at least two years after completion",
      deadline: "2027 round expected ~Feb–Apr 2027 (indicative 30 Apr 2027); the previous round opened 1 Feb 2026 and closed 30 Apr 2026 — confirm on australiaawards.gov.au",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/fully-funded-undergraduate-and-postgraduate-scholarships-at-curtin-university-in-australia",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Government of Turkey Research Scholarships in Different Fields in PhD in Turkey",
    nameAr: "منح بحثية حكومية تركية في مجالات مختلفة في دكتوراه في تركيا",
    country: "Turkey",
    university: "Government of Turkey",
    degree: "PhD",
    deadline: new Date("2027-02-20T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: 34,
    minimumGPA: null,
    englishRequirement:
      "Language proficiency as required by the host programme (Turkish or English); a Turkish language year may apply",
    requiresResearch: true,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "high",
    requiredDocuments: ["TRANSCRIPT", "PASSPORT", "MOTIVATION_LETTER", "RESEARCH_PROPOSAL", "RECOMMENDATION_LETTER", "LANGUAGE_TEST"],
    benefits: JSON.stringify({
      funding: "Fully funded PhD research scholarship (Türkiye Burslari) at Turkish public universities",
      coverage: "Tuition, monthly stipend, health insurance, accommodation and round-trip flight",
      fields: "Almost all fields of education except health sciences",
      note: "Administered by the Presidency for Turks Abroad and Related Communities (YTB)",
    }),
    requirements: JSON.stringify({
      level: "PhD and post-doctoral research at Turkish public universities",
      nationality: "Open to citizens of all countries (Turkish citizens and those who have lost Turkish citizenship are not eligible)",
      academic: "Minimum academic achievement of 75% for doctorate applicants",
      age: "Applicants must be under 35 years of age",
      language: "Some programmes are taught in English; a Turkish language year may be required",
      application: "Apply via tbbs.turkiyeburslari.gov.tr during the annual window",
      deadline: "Annual application window ~10 Jan–20 Feb (the 2026 round was extended to 25 Feb; indicative 20 Feb 2027) — confirm on turkiyeburslari.gov.tr",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/Government-of-Turkey-Research-Scholarships-in-Different-Fields-in-PhD-in-Turkey-2020",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Mastercard Foundation Scholarship at the University of Pretoria",
    nameAr: "منحة مؤسسة ماستركارد في جامعة بريتوريا",
    country: "South Africa",
    university: "University of Pretoria",
    degree: "Master",
    deadline: new Date("2026-09-30T23:59:00.000Z"),
    eligibleCountries: AFRICAN_COUNTRIES,
    eligibleEducation: ["MASTER"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Pretoria postgraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT", "RECOMMENDATION_LETTER", "PERSONAL_STATEMENT"],
    benefits: JSON.stringify({
      programme: "Mastercard Foundation Scholars Program at the University of Pretoria (MCFSP)",
      coverage: "Full funding: tuition, accommodation, meals, monthly stipend, medical insurance, laptop, travel and visa",
      cohort: "2026–2027 academic year intake",
      extras: "Mentorship plus community-service and practical-internship components",
    }),
    requirements: JSON.stringify({
      level: "Postgraduate (Master's) studies at the University of Pretoria",
      nationality: "African nationals (academically excellent students who face financial barriers)",
      selection: "Focus on leadership potential, community service and commitment to development (e.g. climate change, access to clean water)",
      deadline: "Postgraduate applications close 30 September 2026 for the 2027 intake (undergraduate closes 31 August 2026) — apply via the UP online application portal",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/mastercard-foundation-scholarship-at-the-university-of-pretoria",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Merit Excellence Scholarships Undergraduate and Graduate Students at Deakin University in Australia",
    nameAr: "منح متميزة للتميز لطلاب البكالوريوس والدراسات العليا في جامعة ديكين في أستراليا",
    country: "Australia",
    university: "Deakin University",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per Deakin University course admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      dvcIS: "Deakin Vice-Chancellor's International Scholarship (DVCIS): 100% or 50% tuition-fee reduction for the normal course duration",
      secondary: "Unsuccessful DVCIS applicants are automatically considered for the Deakin International Scholarship (25% tuition reduction)",
      gpa: "DVCIS requires an 85% (or equivalent) weighted average; Deakin International requires 65%",
      extras: "Participation in the Vice-Chancellor's Professional Excellence Program (VCPEP) and priority on-campus accommodation (at own cost)",
    }),
    requirements: JSON.stringify({
      level: "Bachelor's, Master's and PhD coursework degrees at Deakin University",
      applicant: "Prospective international students for a coursework degree at Deakin",
      basis: "Consistently high academic performance (DVCIS 85%+; Deakin International 65%+)",
      application: "Automatic consideration with the course application — no separate scholarship form",
      deadline: "Rolling with trimester admissions (indicative 30 Jun 2027); confirm current rounds on deakin.edu.au",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/Merit-Excellence-Scholarships-Undergraduate-and-Graduate-Students-at-Deakin-University-in-Australia",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "New Zealand Government Scholarship for International Students 2026",
    nameAr: "منحة حكومة نيوزيلندا للطلاب الدوليين 2026",
    country: "New Zealand",
    university: "Foreign Affairs & Trade, New Zealand",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-03-31T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per the requirements of the host New Zealand institution",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT", "RECOMMENDATION_LETTER"],
    benefits: JSON.stringify({
      programme: "Manaaki New Zealand Scholarships (New Zealand Aid Programme)",
      coverage: "Full tuition fees, living allowance (stipend), establishment allowance, medical insurance and return travel",
      stipend: "Living allowance NZD 615 per week (2026 rate) plus a NZD 3,000 establishment allowance",
    }),
    requirements: JSON.stringify({
      level: "Full tertiary study (undergraduate, master's, PhD) at a New Zealand education institution or a Pacific University",
      nationality: "Citizens of eligible developing countries in Africa, Asia, Latin America, the Caribbean and the Pacific",
      duration: "Full duration of the programme",
      deadline: "2027 cycle expected to open ~March 2027 (the 2026 intake closed 31 Mar 2026; indicative 31 Mar 2027) — confirm on nzscholarships.govt.nz",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/new-zealand-government-scholarship-for-international-students",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Partially Funded Undergraduate Excellence Scholarships at Glasgow University in the UK",
    nameAr: "منح متميزة جزئيًا للبكالوريوس في جامعة غلاسكو في المملكة المتحدة",
    country: "United Kingdom",
    university: "University of Glasgow",
    degree: "Bachelor",
    deadline: new Date("2027-05-01T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Glasgow undergraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      award: "Undergraduate Excellence Scholarship: £5,000 tuition-fee discount per year of study",
      total: "100 scholarships available to new international students",
      renewal: "Subject to satisfactory academic progress in consecutive years of study",
      application: "Automatic — guaranteed for applicants achieving (or predicted) the published A-Level / IB grades (or local equivalent); no separate application",
    }),
    requirements: JSON.stringify({
      feeStatus: "Classed as International students for fee purposes",
      level: "New undergraduate (Bachelor's) entry; eligible programmes in Arts, Social Sciences (excluding Law/Accounting & Finance), Medical, Veterinary & Life Sciences (excluding Medicine/Dentistry/Vet Medicine) and Science & Engineering",
      grades: "Excellent academic achievement — guaranteed offer for applicants meeting the published A-Level / IB grades (or local equivalent)",
      deadline: "No separate scholarship deadline — applies with admission; course deadlines vary (often 1 May; indicative 1 May 2027), confirm on gla.ac.uk",
      note: "The 2026 entry window has closed; this is the 2027 entry cycle",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/Partially-Funded-Undergraduate-Excellence-Scholarships-at-Glasgow-University-in-the-UK",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Partially-Funded University of Bradford MERO Scholarship",
    nameAr: "منحة جامعة برادفورد MERO جزئيًا",
    country: "United Kingdom",
    university: "University of Bradford",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["Egypt", "Indonesia", "Jordan", "Bangladesh", "Turkey", "Lebanon", "Sri Lanka", "Palestine", "Nepal"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Bradford programme admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT", "PERSONAL_STATEMENT"],
    benefits: JSON.stringify({
      award: "MERO Scholarship — tuition-fee reduction for nationals of the Middle East Regional Office countries",
      countries: "Egypt, Indonesia, Jordan, Bangladesh, Turkey, Lebanon, Sri Lanka, Palestine, Nepal",
      jubilee: "Includes the Golden Jubilee undergraduate award for BA International Relations, Politics and Security Studies (2026)",
      application: "Automatic for eligible applicants — no separate application",
    }),
    requirements: JSON.stringify({
      nationality: "National of one of: Egypt, Indonesia, Jordan, Bangladesh, Turkey, Lebanon, Sri Lanka, Palestine, Nepal",
      feeStatus: "Self-funding, international fee-paying student (not on a discounted partnership programme)",
      level: "Undergraduate and postgraduate programmes at the University of Bradford",
      deadline: "No fixed deadline — available for each intake (indicative 30 Jun 2027); confirm on bradford.ac.uk",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/partially-funded-university-of-bradford-mero-scholarship",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "PhD Scholarships for Development Countries Students at the University of Cambridge 2026",
    nameAr: "منح دكتوراه لطلاب من الدول النامية في جامعة كامبريدج 2026",
    country: "United Kingdom",
    university: "University of Cambridge",
    degree: "PhD",
    deadline: new Date("2026-12-02T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["PHD"],
    fieldOfStudy: ["Geosciences", "Petroleum Engineering", "Engineering", "Physics", "Applied Mathematics"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Cambridge postgraduate admission requirements",
    requiresResearch: true,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["RESEARCH_PROPOSAL", "TRANSCRIPT", "CV", "RECOMMENDATION_LETTER", "ENGLISH_TEST"],
    benefits: JSON.stringify({
      programme: "Schlumberger Cambridge Scholarship (in partnership with Schlumberger Cambridge Research Limited), now administered under the Cambridge Trust funding framework for developing-country students",
      coverage: "Full funding for PhD research at the University of Cambridge (tuition and stipend)",
      fields: "Research subjects relevant to the work of the Schlumberger Gould Research Centre in Cambridge (geosciences, reservoir engineering and related applied sciences)",
    }),
    requirements: JSON.stringify({
      level: "PhD (research degree) at the University of Cambridge",
      nationality: "Students from developing countries, including Nigeria and other African countries",
      fields: "Research topics relevant to the Schlumberger Gould Research Centre",
      admission: "Apply for PhD admission via the University of Cambridge Postgraduate Application Portal",
      deadline: "Course applications open 3 September 2026; funding deadline 2 December 2026 for most applicants (15 October for US residents) — confirm on the Cambridge funding-deadlines page",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/phd-scholarships-for-development-countries-students-at-the-university-of-cambridge-2026",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Partially Funded Master Scholarships of up to £9,000 from the University of Southampton",
    nameAr: "منح ماجستير ممولة جزئياً تصل إلى 9,000 جنيه إسترليني من جامعة ساوثهامبتون",
    country: "United Kingdom",
    university: "University of Southampton",
    degree: "Master",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["MASTER"],
    fieldOfStudy: ["Arts and Humanities", "Engineering and Physical Sciences", "Environmental and Life Sciences", "Medicine", "Social Sciences"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Southampton master's admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      award: "Postgraduate Merit Scholarship — tuition-fee discount of up to £9,000",
      basis: "Awarded on academic merit; the amount depends on the course and undergraduate grades",
      eligibility: "International students paying overseas fees with a conditional or unconditional Southampton offer",
    }),
    requirements: JSON.stringify({
      level: "Taught Master's degree at the University of Southampton in Arts & Humanities, Engineering & Physical Sciences, Environmental & Life Sciences, Medicine, or Social Sciences",
      feeStatus: "Classed as 'Overseas' for fees purposes and paying fees yourself",
      offer: "Hold a conditional or unconditional offer and pay any required deposit by the date shown on the offer letter",
      excluded: "Not available to students entering a second/subsequent year, foundation-year entrants, or study-abroad/exchange/visitor students; scholarships are non-deferrable",
      deadline: "No fixed deadline — awarded with admission (indicative 30 Jun 2027); confirm on the Southampton international scholarships page",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/postgraduate-merit-scholarships",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Undergraduate & Postgraduate Business Scholarships at QUT in Australia",
    nameAr: "منح أعمال لطلاب البكالوريوس والدراسات العليا في QUT في أستراليا",
    country: "Australia",
    university: "Queensland University of Technology-QUT",
    degree: "Bachelor / Master",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER"],
    fieldOfStudy: ["Business Management"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per QUT degree entry requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      first: "Entry-based scholarship: a one-time 25% tuition-fee reduction for the first and second semesters",
      ongoing: "Ongoing International Merit Scholarship: 25% tuition-fee reduction per semester",
      maintenance: "Maintain a minimum overall GPA of 5.5 on the QUT 7-point scale for the ongoing award",
      application: "Automatic assessment on admission — no separate application",
    }),
    requirements: JSON.stringify({
      level: "Undergraduate and postgraduate (Master's) business degrees in the QUT College of Business",
      feeStatus: "International students",
      academic: "Demonstrated academic excellence in previous studies (entry score) and continued high standards",
      deadline: "Ongoing — assessed per intake (indicative 30 Jun 2027); confirm on qut.edu.au",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/Undergraduate-Postgraduate-Business-Scholarships-at-QUT-in-Australia",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "Partial Funded Scholarships for Undergraduates and Graduates at the University of Bradford in the UK",
    nameAr: "منح جزئيا ممولة للبكالوريوس والدراسات العليا في جامعة برادفورد في المملكة المتحدة",
    country: "United Kingdom",
    university: "University of Bradford",
    degree: "Bachelor / Master / PhD",
    deadline: new Date("2027-06-30T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR", "MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Bradford programme admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      coverage: "Partial tuition-fee reduction for meeting or exceeding the entry criteria",
      levels: "Undergraduate, Postgraduate Taught and Postgraduate Research programmes",
      amounts: "Achievement-based awards (e.g. International Academic Achievement up to £4,000 / £2,500 depending on grades — confirm current values on bradford.ac.uk)",
      application: "Automatic on admission",
    }),
    requirements: JSON.stringify({
      level: "Undergraduate, Postgraduate Taught and Postgraduate Research at the University of Bradford",
      feeStatus: "International students meeting or exceeding the published entry criteria",
      deadline: "No fixed deadline — applied at admission per intake (indicative 30 Jun 2027); confirm on bradford.ac.uk",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/university-of-bradford-country-specific-scholarships",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "University of Sydney International Scholarship for Postgraduates Students 2026",
    nameAr: "منحة جامعة سيدني الدولية للدراسات العليا 2026",
    country: "Australia",
    university: "University of Sydney",
    degree: "Master / PhD",
    deadline: new Date("2026-12-18T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["MASTER", "PHD"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Sydney research-degree admission (IELTS, TOEFL or PTE)",
    requiresResearch: true,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "medium",
    requiredDocuments: ["TRANSCRIPT", "CV", "RESEARCH_PROPOSAL", "ENGLISH_TEST"],
    benefits: JSON.stringify({
      programme: "University of Sydney International Scholarship (USydIS) for commencing or enrolled international research students",
      stipend: "Stipend of AUD 42,754 per annum (2026 rate) for living costs",
      tuition: "Full tuition-fee offset (100%) for the duration of the research degree",
      extras: "Assistance with Overseas Student Health Cover (OSHC)",
    }),
    requirements: JSON.stringify({
      level: "Master by Research or PhD at the University of Sydney",
      applicant: "Commencing or enrolled international student with an unconditional offer of admission",
      academic: "Outstanding record of academic achievement and research potential",
      english: "English language results are not required for scholarship assessment, but are required for admission",
      deadline: "Assessed ahead of each research period: 11 September 2026 and 18 December 2026 — apply for admission by the relevant round",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/university-of-sydney-international-scholarship-for-postgraduates-students-2026",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
  {
    nameEn: "University of Sydney Undergraduate Scholarship 2026 (Fully Funded)",
    nameAr: "منحة جامعة سيدني للبكالوريوس 2026 (ممولة بالكامل)",
    country: "Australia",
    university: "University of Sydney",
    degree: "Bachelor",
    deadline: new Date("2026-12-01T23:59:00.000Z"),
    eligibleCountries: ["All"],
    eligibleEducation: ["BACHELOR"],
    fieldOfStudy: ["Any"],
    minimumAge: null,
    maximumAge: null,
    minimumGPA: null,
    englishRequirement:
      "English proficiency per University of Sydney undergraduate admission requirements",
    requiresResearch: false,
    requiresWorkExp: false,
    applicationFee: null,
    competitionLevel: "high",
    requiredDocuments: ["TRANSCRIPT", "ENGLISH_TEST", "PASSPORT"],
    benefits: JSON.stringify({
      coverage: "100% tuition-fee coverage plus the Student Services Amenities Fee (SSAF)",
      duration: "For the published full-time duration of the single undergraduate degree including embedded honours (maximum 4 years)",
      cohort: "Approximately 20 scholarships awarded globally per year across two intakes, focusing on course and nationality diversity",
      application: "Automatic consideration with the admission application — no separate form; indicative turnaround ~5 weeks",
    }),
    requirements: JSON.stringify({
      level: "Single undergraduate coursework degree (may include embedded honours) at the University of Sydney, excluding combined degrees with a postgraduate component",
      applicant: "International student who has applied for, but not yet commenced, the degree (enrolled full-time)",
      exclusion: "Australian citizens, permanent residents and dual citizens with Australian nationality are not eligible; not for a second degree",
      deadline: "Rolling — no fixed closing date; two intakes per year (indicative admission deadline for Semester 1 2027: 1 December 2026), confirm on sydney.edu.au",
    }),
    sourceUrl: "https://www.for9a.com/en/opportunity/university-of-sydney-undergraduate-scholarship-2026-fully-funded",
    source: "SCRAPED",
    applicationOpenDate: null,
    isVerified: true,
    verifiedAt: new Date("2026-08-10T00:00:00Z"),
    isActive: true,
  },
];

export default scholarships;
