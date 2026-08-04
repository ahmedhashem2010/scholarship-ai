import { slugify } from '../../../scripts/lib';
import { compact } from '../../shared/json';
import { ExtractedScholarship, NormalizedScholarship } from '../types';
import { parseDate } from './dates';
import { resolveCountry, resolveCountries } from './countries';
import { resolveDegrees, DEGREE_SLUGS } from './degrees';
import { resolveFields } from './fields';
import { resolveLanguages } from './languages';
import { normalizeCurrency } from './money';

const DEGREE_SLUG_TO_TYPE: Record<string, string> = {
  'associate-degree': 'ASSOCIATE',
  'bachelors-degree': 'BACHELOR',
  'masters-degree': 'MASTER',
  'doctorate-phd': 'DOCTORATE',
  'diploma': 'DIPLOMA',
  'certificate': 'CERTIFICATE',
  'short-course': 'SHORT_COURSE',
  'exchange-program': 'EXCHANGE',
  'language-course': 'LANGUAGE_COURSE',
  'research': 'RESEARCH',
  'summer-school': 'SUMMER_SCHOOL',
  'secondary-school': 'OTHER',
  'high-school': 'OTHER',
  'other': 'OTHER',
};

const TEST_TYPE_MAP: Record<string, string> = {
  'IELTS': 'IELTS', 'IELTS ACADEMIC': 'IELTS', 'IELTS ACADEMIC MODULE': 'IELTS',
  'TOEFL': 'TOEFL', 'TOEFL IBT': 'TOEFL',
  'DUOLINGO': 'DUOLINGO', 'DUOLINGO ENGLISH TEST': 'DUOLINGO',
  'SAT': 'SAT', 'ACT': 'ACT', 'GRE': 'GRE', 'GMAT': 'GMAT',
};

const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'transcript': 'TRANSCRIPT', 'academic transcript': 'TRANSCRIPT', 'transcript of records': 'TRANSCRIPT',
  'diploma': 'DIPLOMA', 'degree certificate': 'DIPLOMA',
  'certificate': 'CERTIFICATE',
  'cv': 'CV', 'resume': 'RESUME', 'curriculum vitae': 'CV',
  'motivation letter': 'MOTIVATION_LETTER', 'motivation': 'MOTIVATION_LETTER',
  'statement of purpose': 'STATEMENT_OF_PURPOSE', 'purpose statement': 'STATEMENT_OF_PURPOSE',
  'recommendation': 'LETTER_OF_RECOMMENDATION', 'letter of recommendation': 'LETTER_OF_RECOMMENDATION',
  'reference': 'LETTER_OF_RECOMMENDATION', 'references': 'LETTER_OF_RECOMMENDATION',
  'passport': 'PASSPORT', 'id card': 'ID_CARD',
  'ielts': 'IELTS', 'toefl': 'TOEFL', 'duolingo': 'DUOLINGO', 'sat': 'SAT', 'gre': 'GRE', 'gmat': 'GMAT',
  'portfolio': 'PORTFOLIO', 'work portfolio': 'PORTFOLIO',
  'financial': 'FINANCIAL_STATEMENT', 'financial statement': 'FINANCIAL_STATEMENT',
  'bank statement': 'BANK_STATEMENT',
  'medical': 'MEDICAL_CERTIFICATE', 'medical certificate': 'MEDICAL_CERTIFICATE', 'health certificate': 'MEDICAL_CERTIFICATE',
  'photo': 'PHOTO', 'photograph': 'PHOTO',
  'publication': 'PUBLICATION', 'publications': 'PUBLICATION',
  'work contract': 'WORK_CONTRACT', 'employment certificate': 'WORK_CONTRACT',
  'tax': 'TAX_RETURN',
};

const REQUIREMENT_TYPE_MAP: Record<string, string> = {
  'nationality': 'NATIONALITY',
  'residence': 'RESIDENCE',
  'age': 'AGE',
  'gpa': 'GPA',
  'percentage': 'PERCENTAGE',
  'ielts': 'IELTS', 'toefl': 'TOEFL', 'duolingo': 'DUOLINGO', 'sat': 'SAT', 'act': 'ACT', 'gre': 'GRE', 'gmat': 'GMAT',
  'portfolio': 'PORTFOLIO',
  'interview': 'INTERVIEW',
  'medical': 'MEDICAL_EXAM', 'medical exam': 'MEDICAL_EXAM',
  'work experience': 'WORK_EXPERIENCE', 'experience': 'WORK_EXPERIENCE',
  'gender': 'GENDER',
  'refugee': 'REFUGEE',
  'other': 'OTHER',
};

function toEnumType(value: string, map: Record<string, string>): string | null {
  const key = value.toLowerCase().trim();
  if (map[key]) return map[key];
  for (const [k, v] of Object.entries(map)) {
    if (k === v.toLowerCase()) return v;
    if (key.includes(k)) return v;
  }
  return null;
}

function mapBenefits(extracted: ExtractedScholarship) {
  const benefits = extracted.benefits.map((b) => {
    const type = toEnumType(b.type, {
      'tuition': 'TUITION', 'tuition waiver': 'TUITION', 'full tuition': 'TUITION',
      'tuition discount': 'TUITION_DISCOUNT', 'partial tuition': 'TUITION_DISCOUNT',
      'housing': 'HOUSING', 'accommodation': 'HOUSING', 'room': 'HOUSING', 'dormitory': 'HOUSING',
      'stipend': 'MONTHLY_STIPEND', 'monthly stipend': 'MONTHLY_STIPEND', 'living allowance': 'MONTHLY_STIPEND',
      'yearly stipend': 'YEARLY_STIPEND', 'annual stipend': 'YEARLY_STIPEND',
      'one time': 'ONE_TIME_GRANT', 'one-time': 'ONE_TIME_GRANT', 'grant': 'ONE_TIME_GRANT',
      'insurance': 'INSURANCE', 'health insurance': 'INSURANCE',
      'flight': 'FLIGHT', 'airfare': 'FLIGHT', 'round trip': 'FLIGHT', 'travel': 'TRAVEL_GRANT',
      'books': 'BOOKS',
      'research': 'RESEARCH_GRANT', 'research grant': 'RESEARCH_GRANT', 'research fund': 'RESEARCH_GRANT',
      'visa': 'VISA_SUPPORT', 'visa support': 'VISA_SUPPORT',
      'settlement': 'SETTLEMENT_ALLOWANCE',
      'family': 'FAMILY_ALLOWANCE',
      'application fee': 'APPLICATION_FEE_WAIVER', 'fee waiver': 'APPLICATION_FEE_WAIVER',
      'computer': 'COMPUTER', 'laptop': 'COMPUTER',
      'language': 'LANGUAGE_COURSE', 'language course': 'LANGUAGE_COURSE',
      'other': 'OTHER',
    }) ?? 'OTHER';
    return {
      type,
      amount: b.amount?.amount ?? null,
      currency: normalizeCurrency(b.amount?.currency) ?? null,
      description: b.description ?? null,
    };
  });
  // merge duplicate benefit types (sum amounts where same currency)
  const merged: Array<{ type: string; amount: number | null; currency: string | null; description: string | null }> = [];
  for (const b of benefits) {
    const existing = merged.find((m) => m.type === b.type && m.currency === b.currency);
    if (existing && b.amount !== null) {
      existing.amount = (existing.amount ?? 0) + b.amount;
    } else if (!existing) {
      merged.push({ ...b });
    }
  }
  return merged
    .filter((m) => m.amount !== null || m.description !== null)
    .map((m) => ({
      type: m.type,
      ...(m.amount !== null ? { amount: m.amount } : {}),
      ...(m.currency !== null ? { currency: m.currency } : {}),
      ...(m.description !== null ? { description: m.description } : {}),
    }));
}

function mapDocuments(extracted: ExtractedScholarship) {
  const seen = new Set<string>();
  const out: Array<{ type: string; isRequired: boolean }> = [];
  for (const d of extracted.documentRequirements) {
    const type = toEnumType(d.type, DOCUMENT_TYPE_MAP) ?? 'OTHER';
    const key = type;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ type, isRequired: d.isRequired });
  }
  return out;
}

function mapTestRequirements(extracted: ExtractedScholarship) {
  const out: Array<{ type: string; minimumScore?: string; isMandatory: boolean }> = [];
  for (const t of extracted.testRequirements) {
    const type = toEnumType(t.type, TEST_TYPE_MAP) ?? 'OTHER';
    out.push({
      type,
      minimumScore: t.minimumScore ?? undefined,
      isMandatory: t.isMandatory,
    });
  }
  return out;
}

function mapRequirements(extracted: ExtractedScholarship) {
  const out: Array<{ type: string; description?: string; isMandatory: boolean }> = [];
  for (const r of extracted.requirements) {
    const type = toEnumType(r.type, REQUIREMENT_TYPE_MAP) ?? 'OTHER';
    out.push({
      type,
      description: r.description ?? undefined,
      isMandatory: r.isMandatory,
    });
  }
  return out;
}

function pickDeadline(d: ExtractedScholarship['deadlines'], now: Date) {
  const closing = d.closing?.date ? parseDate(d.closing.date) : null;
  const opening = d.opening?.date ? parseDate(d.opening.date) : null;
  // if closing is in the past and an intake closing exists in the future, prefer future
  let closingDate = closing?.date ?? null;
  if (closing && closing.date < now.toISOString().slice(0, 10)) {
    const future = d.closingPerIntake
      ?.map((x) => parseDate(x.date))
      .filter((x): x is NonNullable<typeof x> => !!x)
      .filter((x) => x.date >= now.toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (future) closingDate = future.date;
  }
  return {
    closingDate,
    openingDate: opening?.date ?? null,
  };
}

/** Convert an extracted scholarship into a normalized, DB-ready record. */
export function normalizeScholarship(extracted: ExtractedScholarship, now = new Date()): NormalizedScholarship {
  const degreeSlugs = resolveDegrees(extracted.degreeLevels);
  const degreeTypes = degreeSlugs.map((s) => DEGREE_SLUG_TO_TYPE[s] ?? 'OTHER');
  const country = resolveCountry(extracted.countryCode);
  const eligibleCountries = resolveCountries(extracted.eligibility.eligibleCountryCodes);
  const fields = resolveFields(extracted.studyFields);
  const languages = resolveLanguages(extracted.languageCodes);
  const { closingDate, openingDate } = pickDeadline(extracted.deadlines, now);

  let fundingType: string = extracted.funding.fundingType ?? 'UNKNOWN';
  if (fundingType !== 'FULLY_FUNDED' && fundingType !== 'PARTIALLY_FUNDED') {
    if (extracted.funding.fullyFunded === true) fundingType = 'FULLY_FUNDED';
    else if (extracted.funding.fullyFunded === false) fundingType = 'PARTIALLY_FUNDED';
  }

  const mStipend = extracted.funding.monthlyStipend;
  const yStipend = extracted.funding.yearlyStipend;
  const oGrant = extracted.funding.oneTimeGrant;

  const title = extracted.title.trim();
  const slug = `${slugify(title)}-${slugify(extracted.provider)}`.slice(0, 190).replace(/-+$/, '');

  const s: NormalizedScholarship = {
    title,
    titleAr: null,
    slug,
    provider: extracted.provider,
    sourceUrl: extracted.sourceUrl || extracted.url,
    originalUrl: extracted.url,
    university: extracted.university ?? null,
    countryCode: country,
    city: extracted.city ?? null,
    campus: null,
    description: extracted.description ?? null,
    degreeLevels: degreeTypes,
    studyFields: fields,
    languageCodes: languages,
    durationMonths: extracted.durationMonths ?? null,
    durationText: extracted.durationText ?? null,
    fundingType,
    fullyFunded: fundingType === 'FULLY_FUNDED',
    tuitionCovered: extracted.funding.tuitionCovered ?? null,
    monthlyStipendAmount: mStipend?.amount ?? null,
    monthlyStipendCurrency: normalizeCurrency(mStipend?.currency) ?? null,
    yearlyStipendAmount: yStipend?.amount ?? null,
    yearlyStipendCurrency: normalizeCurrency(yStipend?.currency) ?? null,
    oneTimeGrantAmount: oGrant?.amount ?? null,
    oneTimeGrantCurrency: normalizeCurrency(oGrant?.currency) ?? null,
    accommodationCovered: extracted.funding.accommodationCovered ?? null,
    healthInsurance: extracted.funding.healthInsurance ?? null,
    travelCovered: extracted.funding.travelCovered ?? null,
    visaSupport: extracted.funding.visaSupport ?? null,
    openingDate,
    closingDate,
    eligibleCountryCodes: eligibleCountries,
    minimumAge: extracted.eligibility.minimumAge ?? null,
    maximumAge: extracted.eligibility.maximumAge ?? null,
    minimumGpa: extracted.eligibility.minimumGpa ?? null,
    gpaScale: extracted.eligibility.gpaScale ?? null,
    testRequirements: mapTestRequirements(extracted),
    documentTypes: mapDocuments(extracted),
    benefits: mapBenefits(extracted),
    requirements: mapRequirements(extracted),
    contactEmail: extracted.contact.email ?? null,
    contactPhone: extracted.contact.phone ?? null,
    applicationPortal: extracted.application.portal ?? null,
    applicationUrl: extracted.application.url ?? null,
    applicationProcess: extracted.application.process ?? null,
    applicationFeeAmount: extracted.application.fee?.amount ?? null,
    applicationFeeCurrency: normalizeCurrency(extracted.application.fee?.currency) ?? null,
    isStructured: extracted.confidence >= 0.5,
    extractionConfidence: extracted.confidence,
    parserVersion: extracted.parserVersion,
    importSourceType: 'SCRAPER',
    scrapedAt: new Date().toISOString(),
  };
  return compact(s) as NormalizedScholarship;
}

export const ALL_DEGREE_SLUGS = DEGREE_SLUGS;
