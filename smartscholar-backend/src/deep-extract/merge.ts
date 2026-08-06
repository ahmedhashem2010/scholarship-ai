/**
 * Merge layer — applies the never-overwrite policy.
 *
 * The DB value always wins when it is already populated. Extraction only fills
 * gaps. Nothing is ever deleted. `isFullyFunded` is the single exception: the
 * schema default is `false`, so a defaulted false is treated as "not set" and
 * may be upgraded to true by extraction, but never downgraded back to false.
 */

import {
  DeepExtracted,
  FieldSource,
  MergeResult,
  FieldDecision,
} from './types';

export interface ExistingScholarship {
  row: {
    titleAr: string | null;
    descriptionAr: string | null;
    seoDescription: string | null;
    aiSummary: string | null;
    aiTips: string | null;
    applicationProcess: string | null;
    selectionProcess: string | null;
    countryCode: string | null;
    city: string | null;
    university: string | null;
    durationMonths: number | null;
    durationText: string | null;
    openingDate: string | null;
    closingDate: string | null;
    interviewDate: string | null;
    resultsDate: string | null;
    enrollmentDate: string | null;
    nextDeadline: string | null;
    minimumAge: number | null;
    maximumAge: number | null;
    minimumGpa: number | null;
    gpaScale: number | null;
    minimumPercentage: number | null;
    fundingType: string | null;
    isFullyFunded: boolean | null;
    applicationUrl: string | null;
    applicationPortal: string | null;
    applicationFeeAmount: number | null;
    applicationFeeCurrency: string | null;
    officialPdfUrl: string | null;
  };
  related: {
    eligibleCountries: string[];
    degreeLevels: string[];
    studyFields: string[];
    languageCodes: string[];
    documents: Array<{ type: string; name: string | null; isRequired: boolean }>;
    testRequirements: Array<{
      type: string;
      minimumScore: string | null;
      minimumBand: string | null;
      isMandatory: boolean;
      notes: string | null;
    }>;
    requirements: Array<{ type: string; description: string | null; isMandatory: boolean }>;
    benefits: Array<{
      type: string;
      amount: number | null;
      currency: string | null;
      period: string | null;
      description: string | null;
    }>;
    faqs: Array<{ question: string; answer: string }>;
  };
}

function decide<T>(existing: T | null | undefined, extracted: T | null | undefined, source: FieldSource): FieldDecision<T | null> {
  const value = (existing ?? extracted ?? null) as T | null;
  const changed = existing === null && extracted !== null && extracted !== undefined;
  return { value, changed, source: changed ? source : 'existing' };
}

function decideFullyFunded(existing: boolean | null, extracted: boolean | null, source: FieldSource): FieldDecision<boolean | null> {
  if (existing === true) return { value: true, changed: false, source: 'existing' };
  if (extracted === true) return { value: true, changed: true, source };
  return { value: existing, changed: false, source: 'existing' };
}

function difference(existing: string[], extracted: string[]): string[] {
  const have = new Set(existing);
  return extracted.filter((v) => v && !have.has(v));
}

export function mergeScholarship(
  existing: ExistingScholarship,
  extracted: DeepExtracted,
  opts: { pdfUrl?: string | null } = {},
): MergeResult {
  const source: FieldSource = 'ai';
  const changedFields: string[] = [];
  const track = (field: string, decision: FieldDecision<unknown>) => {
    if (decision.changed) changedFields.push(field);
  };

  const fields: MergeResult['fields'] = {
    titleAr: decide(existing.row.titleAr, extracted.titleAr, source),
    descriptionAr: decide(existing.row.descriptionAr, extracted.descriptionAr, source),
    seoDescription: decide(existing.row.seoDescription, extracted.seoDescription, source),
    aiSummary: decide(existing.row.aiSummary, extracted.summary, source),
    aiTips: decide(existing.row.aiTips, extracted.tips, source),
    applicationProcess: decide(existing.row.applicationProcess, extracted.applicationProcess, source),
    selectionProcess: decide(existing.row.selectionProcess, extracted.selectionProcess, source),
    university: decide(existing.row.university, extracted.university, source),
    countryCode: decide(existing.row.countryCode, extracted.countryCode, source),
    city: decide(existing.row.city, extracted.city, source),
    durationMonths: decide(existing.row.durationMonths, extracted.durationMonths, source),
    durationText: decide(existing.row.durationText, extracted.durationText, source),
    openingDate: decide(existing.row.openingDate, extracted.openingDate, source),
    closingDate: decide(existing.row.closingDate, extracted.closingDate, source),
    interviewDate: decide(existing.row.interviewDate, extracted.interviewDate, source),
    resultsDate: decide(existing.row.resultsDate, extracted.resultsDate, source),
    enrollmentDate: decide(existing.row.enrollmentDate, extracted.enrollmentDate, source),
    nextDeadline: {
      value: existing.row.nextDeadline ? new Date(`${existing.row.nextDeadline}T00:00:00.000Z`) : null,
      changed: false,
      source: 'existing',
    },
    minimumAge: decide(existing.row.minimumAge, extracted.minimumAge, source),
    maximumAge: decide(existing.row.maximumAge, extracted.maximumAge, source),
    minimumGpa: decide(existing.row.minimumGpa, extracted.minimumGpa, source),
    gpaScale: decide(existing.row.gpaScale, extracted.gpaScale, source),
    minimumPercentage: decide(existing.row.minimumPercentage, extracted.minimumPercentage, source),
    fundingType: decide(existing.row.fundingType, extracted.fundingType, source),
    fullyFunded: decideFullyFunded(existing.row.isFullyFunded, extracted.tuitionCovered && extracted.fundingType === 'FULLY_FUNDED' ? true : null, source),
    applicationUrl: decide(existing.row.applicationUrl, extracted.applicationUrl, source),
    applicationPortal: decide(existing.row.applicationPortal, extracted.applicationPortal, source),
    applicationFeeAmount: decide(existing.row.applicationFeeAmount, extracted.applicationFeeAmount, source),
    applicationFeeCurrency: decide(existing.row.applicationFeeCurrency, extracted.applicationFeeCurrency, source),
    officialPdfUrl: opts.pdfUrl
      ? (existing.row.officialPdfUrl
          ? { value: existing.row.officialPdfUrl, changed: false, source: 'existing' }
          : { value: opts.pdfUrl, changed: true, source: 'pdf' })
      : { value: existing.row.officialPdfUrl, changed: false, source: 'existing' },
  };
  for (const [key, decision] of Object.entries(fields)) track(key, decision);

  const related: MergeResult['related'] = {
    eligibleCountries: difference(existing.related.eligibleCountries, extracted.eligibleCountryCodes).map((code) => ({ code, source: 'ai' as const })),
    degreeLevels: difference(existing.related.degreeLevels, extracted.degreeLevels),
    studyFields: difference(existing.related.studyFields, extracted.studyFields),
    languageCodes: difference(existing.related.languageCodes, extracted.languageCodes).map((code) => ({ code, required: true })),
    documents: extracted.documents
      .filter((d) => !existing.related.documents.some((e) => e.type === d.type))
      .map((d) => ({ ...d, source: 'ai' as const })),
    testRequirements: extracted.testRequirements.filter(
      (t) => !existing.related.testRequirements.some((e) => e.type === t.type),
    ),
    requirements: extracted.requirements.filter(
      (r) => !existing.related.requirements.some((e) => e.type === r.type),
    ),
    benefits: extracted.benefits.filter(
      (b) => !existing.related.benefits.some((e) => e.type === b.type && (e.amount ?? null) === (b.amount ?? null)),
    ),
    faqs: extracted.faqs.filter(
      (f) => !existing.related.faqs.some((e) => e.question.trim().toLowerCase() === f.question.trim().toLowerCase()),
    ),
  };
  if (related.eligibleCountries.length) changedFields.push('eligibleCountries');
  if (related.degreeLevels.length) changedFields.push('degreeLevels');
  if (related.studyFields.length) changedFields.push('studyFields');
  if (related.languageCodes.length) changedFields.push('languageCodes');
  if (related.documents.length) changedFields.push('documents');
  if (related.testRequirements.length) changedFields.push('testRequirements');
  if (related.requirements.length) changedFields.push('requirements');
  if (related.benefits.length) changedFields.push('benefits');
  if (related.faqs.length) changedFields.push('faqs');

  const contact = {
    email: extracted.contactEmail,
    phone: extracted.contactPhone,
    coordinator: extracted.coordinator,
    officeAddress: extracted.officeAddress,
  };

  return {
    fields,
    related,
    contact,
    provenance: {
      pagesCrawled: [],
      pdfsAnalyzed: [],
      crawlErrors: [],
      aiProvider: extracted.provider,
      aiConfidence: extracted.confidence,
      closingPerIntake: extracted.closingPerIntake,
      sourceSegments: [],
    },
    changedFields,
  };
}
