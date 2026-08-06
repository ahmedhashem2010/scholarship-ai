/**
 * AI orchestration for deep extraction.
 *
 * Builds one prompt per scholarship from crawled pages + analyzed PDFs, asks
 * the AI chain for the full DeepExtracted object, then runs a deterministic
 * sanitize pass (type coercion, enum mapping, bounds, dedupe) before anything
 * is handed to the merge layer. The model is told never to invent facts and to
 * prefer the official PDF when both exist.
 */

import { callAI, parseJsonResponse } from './ai';
import { parseDate } from '../acquisition/normalizers/dates';
import { DeepExtracted, CrawlResult, DetectedDoc, DEEP_EXTRACT_VERSION } from './types';

export interface ExtractInput {
  scholarship: {
    slug: string;
    title: string;
    sourceUrl: string | null;
    officialWebsite: string | null;
    providerName: string;
    existingFundingType: string | null;
    existingCountryCode: string | null;
  };
  crawl: CrawlResult;
  docs: DetectedDoc[];
}

const DOCUMENT_TYPES = [
  'TRANSCRIPT', 'DIPLOMA', 'CERTIFICATE', 'CV', 'RESUME', 'STATEMENT_OF_PURPOSE',
  'MOTIVATION_LETTER', 'LETTER_OF_RECOMMENDATION', 'PASSPORT', 'ID_CARD', 'IELTS',
  'TOEFL', 'DUOLINGO', 'SAT', 'GRE', 'GMAT', 'PORTFOLIO', 'FINANCIAL_STATEMENT',
  'BANK_STATEMENT', 'MEDICAL_CERTIFICATE', 'PHOTO', 'TAX_RETURN', 'WORK_CONTRACT',
  'PUBLICATION', 'OTHER',
];

const TEST_TYPES = ['IELTS', 'TOEFL', 'DUOLINGO', 'SAT', 'ACT', 'GRE', 'GMAT', 'OTHER'];

const REQUIREMENT_TYPES = [
  'NATIONALITY', 'RESIDENCE', 'AGE', 'GPA', 'PERCENTAGE', 'IELTS', 'TOEFL', 'DUOLINGO',
  'SAT', 'ACT', 'GRE', 'GMAT', 'GAP_YEARS', 'PORTFOLIO', 'INTERVIEW', 'MEDICAL_EXAM',
  'WORK_EXPERIENCE', 'ENROLLMENT_STATUS', 'GENDER', 'DISABILITY', 'FIRST_GENERATION',
  'REFUGEE', 'OTHER',
];

const BENEFIT_TYPES = [
  'TUITION', 'TUITION_DISCOUNT', 'HOUSING', 'MONTHLY_STIPEND', 'YEARLY_STIPEND',
  'ONE_TIME_GRANT', 'INSURANCE', 'FLIGHT', 'BOOKS', 'RESEARCH_GRANT', 'TRAVEL_GRANT',
  'VISA_SUPPORT', 'SETTLEMENT_ALLOWANCE', 'FAMILY_ALLOWANCE', 'APPLICATION_FEE_WAIVER',
  'COMPUTER', 'LANGUAGE_COURSE', 'OTHER',
];

const DEGREE_SLUGS = [
  'associate-degree', 'bachelors-degree', 'masters-degree', 'doctorate-phd', 'diploma',
  'certificate', 'short-course', 'exchange-program', 'language-course', 'research',
  'summer-school', 'other',
];

const DEGREE_ALIASES: Record<string, string> = {
  bachelor: 'bachelors-degree', bachelors: 'bachelors-degree', 'bachelor s degree': 'bachelors-degree',
  undergraduate: 'bachelors-degree', bsc: 'bachelors-degree', ba: 'bachelors-degree',
  master: 'masters-degree', masters: 'masters-degree', 'master s degree': 'masters-degree',
  postgraduate: 'masters-degree', graduate: 'masters-degree', msc: 'masters-degree', ma: 'masters-degree', mba: 'masters-degree',
  phd: 'doctorate-phd', doctorate: 'doctorate-phd', doctoral: 'doctorate-phd', 'doctor of philosophy': 'doctorate-phd',
  'high school': 'high-school', secondary: 'secondary-school', diploma: 'diploma',
  associate: 'associate-degree', certificate: 'certificate', 'short course': 'short-course',
  exchange: 'exchange-program', language: 'language-course', research: 'research',
  'summer school': 'summer-school',
};

const FIELD_ALIASES: Record<string, string> = {
  'computer science': 'computer-science', cs: 'computer-science', computing: 'computer-science',
  software: 'software-engineering', data: 'data-science', 'machine learning': 'artificial-intelligence',
  ai: 'artificial-intelligence', it: 'information-technology', technology: 'information-technology',
  security: 'cybersecurity', engineering: 'engineering', mechanical: 'mechanical-engineering',
  electrical: 'electrical-engineering', civil: 'civil-engineering', business: 'business-administration',
  management: 'business-administration', economics: 'economics', finance: 'finance', accounting: 'accounting',
  medicine: 'medicine', medical: 'medicine', pharmacy: 'pharmacy', dentistry: 'dentistry', nursing: 'nursing',
  law: 'law', legal: 'law', architecture: 'architecture', education: 'education', teaching: 'education',
  psychology: 'psychology', 'international relations': 'international-relations', politics: 'international-relations',
  'political science': 'international-relations', media: 'media-communications', communication: 'media-communications',
  journalism: 'media-communications', art: 'arts-design', design: 'arts-design', arts: 'arts-design',
  mathematics: 'mathematics', math: 'mathematics', physics: 'physics', chemistry: 'chemistry', biology: 'biology',
  'life sciences': 'biology', environmental: 'environmental-science', agriculture: 'agriculture',
  'public health': 'public-health', health: 'public-health', linguistics: 'linguistics', languages: 'linguistics',
  humanities: 'linguistics', 'social sciences': 'social-sciences', natural: 'natural-sciences', 'earth sciences': 'earth-sciences',
  geology: 'earth-sciences', astronomy: 'astronomy', 'space sciences': 'astronomy',
};

const LANG_ALIASES: Record<string, string> = {
  english: 'en', french: 'fr', german: 'de', spanish: 'es', portuguese: 'pt', italian: 'it',
  russian: 'ru', chinese: 'zh', mandarin: 'zh', japanese: 'ja', korean: 'ko', turkish: 'tr',
  arabic: 'ar', dutch: 'nl', swedish: 'sv', norwegian: 'no', danish: 'da', finnish: 'fi',
  polish: 'pl', greek: 'el', hebrew: 'he', persian: 'fa', farsi: 'fa', indonesian: 'id',
  thai: 'th', vietnamese: 'vi', swahili: 'sw', czech: 'cs', ukrainian: 'uk', hindi: 'hi', urdu: 'ur',
};

function normKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function mapEnum(raw: unknown, allowed: string[], aliases?: Record<string, string>): string | null {
  if (raw === null || raw === undefined) return null;
  const direct = String(raw).trim().toUpperCase();
  if (allowed.includes(direct)) return direct;
  const key = normKey(String(raw));
  if (aliases && aliases[key]) return aliases[key]!.toUpperCase();
  for (const a of allowed) {
    if (key.includes(normKey(a))) return a;
  }
  return null;
}

function str(raw: unknown, max = 500): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'na') return null;
  return s.slice(0, max);
}

function strList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    const s = str(item, 200);
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

function num(raw: unknown, min: number, max: number): number | null {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.round(n * 100) / 100;
}

function bool(raw: unknown): boolean | null {
  if (typeof raw === 'boolean') return raw;
  if (raw === null || raw === undefined) return null;
  if (['true', 'yes', 'y', '1'].includes(String(raw).toLowerCase())) return true;
  if (['false', 'no', 'n', '0'].includes(String(raw).toLowerCase())) return false;
  return null;
}

function date(raw: unknown): string | null {
  const parsed = parseDate(str(raw, 100));
  return parsed ? parsed.date : null;
}

function countryCode(raw: unknown): string | null {
  const s = str(raw, 20);
  if (!s) return null;
  const code = s.toUpperCase().replace(/[^A-Z]/g, '');
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function langCode(raw: unknown): string | null {
  const s = str(raw, 20);
  if (!s) return null;
  const lower = s.toLowerCase().split('-')[0];
  if (/^[a-z]{2}$/.test(lower)) return lower;
  const key = normKey(s);
  return LANG_ALIASES[key] ?? null;
}

function degreeSlug(raw: unknown): string | null {
  const s = str(raw, 100);
  if (!s) return null;
  const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (DEGREE_SLUGS.includes(slug)) return slug;
  const key = normKey(s);
  if (DEGREE_ALIASES[key]) return DEGREE_ALIASES[key]!;
  for (const [alias, mapped] of Object.entries(DEGREE_ALIASES)) {
    if (key.includes(alias)) return mapped;
  }
  for (const slug2 of DEGREE_SLUGS) {
    if (key.includes(slug2.replace(/-/g, ' '))) return slug2;
  }
  return null;
}

function fieldSlug(raw: unknown): string | null {
  const s = str(raw, 150);
  if (!s) return null;
  const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (slug.length <= 3) return null;
  const key = normKey(s);
  if (FIELD_ALIASES[key]) return FIELD_ALIASES[key]!;
  for (const [alias, mapped] of Object.entries(FIELD_ALIASES)) {
    if (key.includes(alias)) return mapped;
  }
  return slug.slice(0, 200);
}

function currencyCode(raw: unknown): string | null {
  const s = str(raw, 10);
  if (!s) return null;
  const code = s.toUpperCase().replace(/[^A-Z]/g, '');
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

function money(raw: unknown): number | null {
  return num(raw, 0, 100_000_000);
}

function fundingType(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (['FULLY_FUNDED', 'PARTIALLY_FUNDED', 'SELF_FUNDED', 'LOAN', 'WORK_STUDY', 'UNKNOWN'].includes(s)) return s;
  if (/full/.test(s)) return 'FULLY_FUNDED';
  if (/partial/.test(s)) return 'PARTIALLY_FUNDED';
  if (/self/.test(s)) return 'SELF_FUNDED';
  return null;
}

function dedupe<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export function sanitizeDeepExtracted(raw: Record<string, unknown>): DeepExtracted {
  const confidence = num(raw['confidence'], 0, 1) ?? 0.5;
  const provider = str(raw['provider'], 50);

  const closingPerIntake = Array.isArray(raw['closingPerIntake'])
    ? raw['closingPerIntake']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          label: str(r['label'], 100),
          date: date(r['date']),
          raw: str(r['raw'], 200),
        }))
        .filter((r) => r.date || r.raw)
        .slice(0, 20)
    : [];

  const requirements = Array.isArray(raw['requirements'])
    ? raw['requirements']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          type: mapEnum(r['type'], REQUIREMENT_TYPES),
          description: str(r['description'], 500),
          isMandatory: bool(r['isMandatory']) ?? true,
        }))
        .filter((r): r is NonNullable<typeof r> & { type: string } => !!r.type)
    : [];

  const testRequirements = Array.isArray(raw['testRequirements'])
    ? raw['testRequirements']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          type: mapEnum(r['type'], TEST_TYPES),
          minimumScore: str(r['minimumScore'], 20),
          minimumBand: str(r['minimumBand'], 20),
          isMandatory: bool(r['isMandatory']) ?? true,
          notes: str(r['notes'], 300),
        }))
        .filter((r): r is NonNullable<typeof r> & { type: string } => !!r.type)
    : [];

  const documents = Array.isArray(raw['documents'])
    ? raw['documents']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          type: mapEnum(r['type'], DOCUMENT_TYPES),
          name: str(r['name'], 200),
          isRequired: bool(r['isRequired']) ?? true,
        }))
        .filter((r): r is NonNullable<typeof r> & { type: string } => !!r.type)
    : [];

  const benefits = Array.isArray(raw['benefits'])
    ? raw['benefits']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          type: mapEnum(r['type'], BENEFIT_TYPES),
          amount: money(r['amount']),
          currency: currencyCode(r['currency']),
          period: str(r['period'], 30),
          description: str(r['description'], 500),
        }))
        .filter((r): r is NonNullable<typeof r> & { type: string } => !!r.type)
    : [];

  const faqs = Array.isArray(raw['faqs'])
    ? raw['faqs']
        .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
        .map((r) => ({
          question: str(r['question'], 500),
          answer: str(r['answer'], 1000),
        }))
        .filter((r): r is { question: string; answer: string } => !!r.question && !!r.answer)
    : [];

  return {
    confidence,
    parserVersion: DEEP_EXTRACT_VERSION,
    provider,
    title: str(raw['title'], 300),
    titleAr: str(raw['titleAr'], 300),
    description: str(raw['description'], 8000),
    descriptionAr: str(raw['descriptionAr'], 8000),
    seoDescription: str(raw['seoDescription'], 500),
    summary: str(raw['summary'], 2000),
    tips: str(raw['tips'], 2000),
    university: str(raw['university'], 200),
    faculty: str(raw['faculty'], 200),
    department: str(raw['department'], 200),
    campus: str(raw['campus'], 200),
    city: str(raw['city'], 120),
    countryCode: countryCode(raw['countryCode']),
    degreeLevels: strList(raw['degreeLevels']).map(degreeSlug).filter((s): s is string => !!s),
    studyFields: strList(raw['studyFields']).map(fieldSlug).filter((s): s is string => !!s),
    languageCodes: strList(raw['languageCodes']).map(langCode).filter((s): s is string => !!s),
    durationMonths: num(raw['durationMonths'], 1, 120),
    durationText: str(raw['durationText'], 100),
    openingDate: date(raw['openingDate']),
    closingDate: date(raw['closingDate']),
    closingPerIntake,
    interviewDate: date(raw['interviewDate']),
    resultsDate: date(raw['resultsDate']),
    enrollmentDate: date(raw['enrollmentDate']),
    eligibleCountryCodes: strList(raw['eligibleCountryCodes']).map(countryCode).filter((s): s is string => !!s),
    nationalityRestriction: str(raw['nationalityRestriction'], 1000),
    residencyRestriction: str(raw['residencyRestriction'], 1000),
    refugeeEligibility: str(raw['refugeeEligibility'], 1000),
    minimumAge: num(raw['minimumAge'], 0, 120),
    maximumAge: num(raw['maximumAge'], 0, 120),
    minimumGpa: num(raw['minimumGpa'], 0, 4.5),
    gpaScale: num(raw['gpaScale'], 0, 10),
    minimumPercentage: num(raw['minimumPercentage'], 0, 100),
    degreeRequirement: str(raw['degreeRequirement'], 1000),
    workExperience: str(raw['workExperience'], 1000),
    researchExperience: str(raw['researchExperience'], 1000),
    graduationYearRestriction: str(raw['graduationYearRestriction'], 500),
    requirements: dedupe(requirements, (r) => r.type),
    testRequirements: dedupe(testRequirements, (r) => r.type),
    documents: dedupe(documents, (d) => d.type),
    fundingType: fundingType(raw['fundingType']),
    tuitionCovered: bool(raw['tuitionCovered']),
    accommodationCovered: bool(raw['accommodationCovered']),
    healthInsurance: bool(raw['healthInsurance']),
    travelCovered: bool(raw['travelCovered']),
    visaSupport: bool(raw['visaSupport']),
    monthlyStipendAmount: money(raw['monthlyStipendAmount']),
    monthlyStipendCurrency: currencyCode(raw['monthlyStipendCurrency']),
    yearlyStipendAmount: money(raw['yearlyStipendAmount']),
    yearlyStipendCurrency: currencyCode(raw['yearlyStipendCurrency']),
    oneTimeGrantAmount: money(raw['oneTimeGrantAmount']),
    oneTimeGrantCurrency: currencyCode(raw['oneTimeGrantCurrency']),
    benefits: dedupe(benefits, (b) => b.type + '|' + (b.amount ?? '') + '|' + (b.currency ?? '')),
    applicationPortal: str(raw['applicationPortal'], 500),
    applicationUrl: str(raw['applicationUrl'], 500),
    applicationFeeAmount: money(raw['applicationFeeAmount']),
    applicationFeeCurrency: currencyCode(raw['applicationFeeCurrency']),
    applicationProcess: str(raw['applicationProcess'], 4000),
    selectionProcess: str(raw['selectionProcess'], 4000),
    contactEmail: str(raw['contactEmail'], 320),
    contactPhone: str(raw['contactPhone'], 40),
    coordinator: str(raw['coordinator'], 200),
    officeAddress: str(raw['officeAddress'], 500),
    faqs: dedupe(faqs, (f) => f.question).slice(0, 10),
  };
}

function buildPrompt(input: ExtractInput): string {
  const { scholarship, crawl, docs } = input;

  // Budget the source text to fit free-tier model limits (~12k tokens total).
  const SOURCE_BUDGET = 14_000;

  const blocks: Array<{ weight: number; text: string }> = [];
  crawl.pages.forEach((page) => {
    const title = page.title ? ` (${page.title})` : '';
    blocks.push({ weight: page.relevance, text: `--- PAGE: ${page.url}${title}\n${page.text}` });
  });
  docs.forEach((doc) => {
    blocks.push({ weight: 1.5, text: `--- DOCUMENT (${doc.kind.toUpperCase()}): ${doc.url}\n${doc.text}` });
  });
  blocks.sort((a, b) => b.weight - a.weight);

  let used = 0;
  const selected: string[] = [];
  for (const block of blocks) {
    if (used + block.text.length > SOURCE_BUDGET && selected.length > 0) break;
    selected.push(block.text);
    used += block.text.length;
  }
  const sourceText = selected.join('\n\n');

  return `You are an expert scholarship-data extraction engine for an Arabic-first scholarship platform (SmartScholar). Extract facts about ONE scholarship from the official sources below. Output a single JSON object and nothing else.

TARGET SCHOLARSHIP
- Title: ${scholarship.title}
- Provider: ${scholarship.providerName}
- Official page: ${scholarship.officialWebsite ?? scholarship.sourceUrl ?? 'n/a'}
${scholarship.existingCountryCode ? `- Study country (use this as the primary country hint): ${scholarship.existingCountryCode}` : ''}
${scholarship.existingFundingType ? `- Funding type known already: ${scholarship.existingFundingType}` : ''}

RULES
1. Base every value ONLY on the provided source text. If a fact is not present, use null (or [] for arrays). NEVER invent numbers, dates, amounts or URLs.
2. The official PDF/DOCUMENT is the most authoritative; pages come second.
3. Strings in English. Fields ending in _Ar (titleAr, descriptionAr, seoDescription) must be in ARABIC and are MANDATORY whenever you can translate the source — provide them even when the source is English-only. titleAr = Arabic translation of the program title; descriptionAr = Arabic translation of the main description (up to 400 words); seoDescription = short Arabic meta description (up to 300 chars). Also write summary and tips in Arabic.
4. Dates: ISO YYYY-MM-DD. If a deadline is "rolling"/"open year-round", set closingDate=null.
5. Countries: ISO 3166-1 alpha-2 codes (e.g. "EG", "US", "SA", "AE"). Countries ELIGIBLE to apply go in eligibleCountryCodes. If the source names eligible countries or regions, ENUMERATE ALL of them (the list can be long — list every country named). If the program is open to "all countries" / "any nationality", set eligibleCountryCodes to the broad region list if given (e.g. all EU/EEA members) or null if truly unrestricted. The single country where the scholarship is HOSTED goes in countryCode.
6. Languages: ISO 639-1 codes (e.g. "en", "ar", "fr", "de").
7. Currencies: ISO 4217 codes (e.g. "USD", "EUR", "JPY", "GBP").
8. degreeLevels: use only these slugs: ${DEGREE_SLUGS.join(', ')}.
9. documents.type: use only one of: ${DOCUMENT_TYPES.join(', ')}. Map loose terms (e.g. "personal statement" -> STATEMENT_OF_PURPOSE, "letter of intent" -> MOTIVATION_LETTER, "reference letter" -> LETTER_OF_RECOMMENDATION).
10. testRequirements.type: only ${TEST_TYPES.join(', ')}. requirements.type: only ${REQUIREMENT_TYPES.join(', ')}. benefits.type: only ${BENEFIT_TYPES.join(', ')}.
11. fundingType: one of FULLY_FUNDED, PARTIALLY_FUNDED, SELF_FUNDED, LOAN, WORK_STUDY, UNKNOWN. Set the _Covered booleans and stipend amounts from the text.
12. closingPerIntake: for programs with several intakes/deadlines list each (label like "Round 1" or country group). Only include when the text lists multiple.
13. faqs: extract up to 5 real Q&A pairs found in the text.
14. applicationProcess / selectionProcess: concise 1-4 sentence factual descriptions from the text. tips = practical advice from the source. null when absent.
15. confidence: your overall confidence in the extraction as a 0-1 number.
16. provider: the AI provider is unknown to you; set "provider": null.

OUTPUT JSON (all these keys exactly):
{
  "confidence": 0.9,
  "provider": null,
  "title": null, "titleAr": null, "description": null, "descriptionAr": null,
  "seoDescription": null, "summary": null, "tips": null,
  "university": null, "faculty": null, "department": null, "campus": null, "city": null, "countryCode": null,
  "degreeLevels": [], "studyFields": [], "languageCodes": [], "durationMonths": null, "durationText": null,
  "openingDate": null, "closingDate": null,
  "closingPerIntake": [{"label": null, "date": null, "raw": null}],
  "interviewDate": null, "resultsDate": null, "enrollmentDate": null,
  "eligibleCountryCodes": [],
  "nationalityRestriction": null, "residencyRestriction": null, "refugeeEligibility": null,
  "minimumAge": null, "maximumAge": null, "minimumGpa": null, "gpaScale": null, "minimumPercentage": null,
  "degreeRequirement": null, "workExperience": null, "researchExperience": null, "graduationYearRestriction": null,
  "requirements": [{"type": null, "description": null, "isMandatory": true}],
  "testRequirements": [{"type": null, "minimumScore": null, "minimumBand": null, "isMandatory": true, "notes": null}],
  "documents": [{"type": null, "name": null, "isRequired": true}],
  "fundingType": null, "tuitionCovered": null, "accommodationCovered": null, "healthInsurance": null,
  "travelCovered": null, "visaSupport": null,
  "monthlyStipendAmount": null, "monthlyStipendCurrency": null,
  "yearlyStipendAmount": null, "yearlyStipendCurrency": null,
  "oneTimeGrantAmount": null, "oneTimeGrantCurrency": null,
  "benefits": [{"type": null, "amount": null, "currency": null, "period": null, "description": null}],
  "applicationPortal": null, "applicationUrl": null,
  "applicationFeeAmount": null, "applicationFeeCurrency": null,
  "applicationProcess": null, "selectionProcess": null,
  "contactEmail": null, "contactPhone": null, "coordinator": null, "officeAddress": null,
  "faqs": [{"question": null, "answer": null}]
}

=== OFFICIAL SOURCE TEXT ===
${sourceText}
`;
}

/**
 * Run the full extraction for one scholarship: build prompt -> AI chain -> sanitize.
 * Throws when AI is unavailable or the response is not valid JSON.
 */
export async function extractScholarship(input: ExtractInput): Promise<DeepExtracted> {
  const prompt = buildPrompt(input);
  if (process.env.AI_DEBUG) {
    console.log(`[extract] ${input.scholarship.slug} prompt chars=${prompt.length} pages=${input.crawl.pages.length} docs=${input.docs.length}`);
  }
  const result = await callAI(prompt, { maxTokens: 5000, temperature: 0.1 });
  const parsed = parseJsonResponse<Record<string, unknown>>(result.text);
  if (!parsed) {
    throw new Error(`AI returned no parseable JSON (provider ${result.provider})`);
  }
  const sanitized = sanitizeDeepExtracted(parsed);
  sanitized.provider = sanitized.provider ?? result.provider;
  if (sanitized.provider === null) sanitized.provider = result.provider;
  if (process.env.AI_DEBUG) {
    const keys = Object.keys(parsed);
    console.log(`[extract] ${input.scholarship.slug} provider=${result.provider} outChars=${result.text.length} jsonKeys=${keys.length}`);
    console.log(`  titleAr=${sanitized.titleAr ? 'YES' : 'no'} descAr=${sanitized.descriptionAr ? 'YES' : 'no'} seo=${sanitized.seoDescription ? 'YES' : 'no'} summary=${sanitized.summary ? 'YES' : 'no'} countries=${sanitized.eligibleCountryCodes.length} faqs=${sanitized.faqs.length} contactEmail=${sanitized.contactEmail ?? 'no'}`);
  }
  return sanitized;
}
