/**
 * Quality measurement for deep extraction.
 *
 * A scholarship's completeness is the fraction of key fields that are populated
 * AFTER the merge (existing values kept + newly added ones). The report then
 * aggregates per-scholarship scores into an overall quality score and flags the
 * bottom-20 scholarships that still need attention.
 */

import { MergeResult, QualityReport, ScholarshipOutcome, FieldDecision, DEEP_EXTRACT_VERSION } from './types';
import { ExistingScholarship } from './merge';

export interface Completeness {
  score: number;
  populated: string[];
  missing: string[];
}

const KEY_FIELDS = [
  'titleAr', 'descriptionAr', 'seoDescription', 'aiSummary', 'aiTips',
  'applicationProcess', 'selectionProcess', 'countryCode', 'city', 'university',
  'durationText', 'durationMonths', 'openingDate', 'closingDate', 'minimumAge',
  'maximumAge', 'minimumGpa', 'minimumPercentage', 'fundingType', 'applicationUrl',
  'officialPdfUrl', 'eligibleCountries', 'degreeLevels', 'studyFields', 'languages',
  'documents', 'testRequirements', 'requirements', 'benefits', 'faqs', 'contact',
];

export function completenessScore(existing: ExistingScholarship, merge: MergeResult): Completeness {
  const populated: string[] = [];
  const missing: string[] = [];
  const f = merge.fields;

  const scalar: Record<string, unknown> = {
    titleAr: f.titleAr.value,
    descriptionAr: f.descriptionAr.value,
    seoDescription: f.seoDescription.value,
    aiSummary: f.aiSummary.value,
    aiTips: f.aiTips.value,
    applicationProcess: f.applicationProcess.value,
    selectionProcess: f.selectionProcess.value,
    countryCode: f.countryCode.value,
    city: f.city.value,
    university: f.university.value,
    durationText: f.durationText.value,
    durationMonths: f.durationMonths.value,
    openingDate: f.openingDate.value,
    closingDate: f.closingDate.value,
    minimumAge: f.minimumAge.value,
    maximumAge: f.maximumAge.value,
    minimumGpa: f.minimumGpa.value,
    minimumPercentage: f.minimumPercentage.value,
    fundingType: f.fundingType.value,
    applicationUrl: f.applicationUrl.value,
    officialPdfUrl: f.officialPdfUrl.value,
  };
  const related: Record<string, number> = {
    eligibleCountries: existing.related.eligibleCountries.length + merge.related.eligibleCountries.length,
    degreeLevels: existing.related.degreeLevels.length + merge.related.degreeLevels.length,
    studyFields: existing.related.studyFields.length + merge.related.studyFields.length,
    languages: existing.related.languageCodes.length + merge.related.languageCodes.length,
    documents: existing.related.documents.length + merge.related.documents.length,
    testRequirements: existing.related.testRequirements.length + merge.related.testRequirements.length,
    requirements: existing.related.requirements.length + merge.related.requirements.length,
    benefits: existing.related.benefits.length + merge.related.benefits.length,
    faqs: existing.related.faqs.length + merge.related.faqs.length,
  };
  const hasContact = !!(merge.contact.email || merge.contact.phone || merge.contact.coordinator || merge.contact.officeAddress);

  for (const key of KEY_FIELDS) {
    let ok: boolean;
    if (key === 'contact') {
      ok = hasContact;
    } else if (key in scalar) {
      ok = !!scalar[key];
    } else {
      ok = (related[key] ?? 0) > 0;
    }
    (ok ? populated : missing).push(key);
  }

  return { score: populated.length / KEY_FIELDS.length, populated, missing };
}

/** Score a scholarship purely from its current DB state (used for --resume runs). */
export function completenessFromExisting(existing: ExistingScholarship): Completeness {
  const field = <T>(value: T): FieldDecision<T> => ({ value, changed: false, source: 'existing' });
  const f = existing.row;
  const merge: MergeResult = {
    fields: {
      titleAr: field(f.titleAr),
      descriptionAr: field(f.descriptionAr),
      seoDescription: field(f.seoDescription),
      aiSummary: field(f.aiSummary),
      aiTips: field(f.aiTips),
      applicationProcess: field(f.applicationProcess),
      selectionProcess: field(f.selectionProcess),
      university: field(f.university),
      countryCode: field(f.countryCode),
      city: field(f.city),
      durationMonths: field(f.durationMonths),
      durationText: field(f.durationText),
      openingDate: field(f.openingDate),
      closingDate: field(f.closingDate),
      interviewDate: field(f.interviewDate),
      resultsDate: field(f.resultsDate),
      enrollmentDate: field(f.enrollmentDate),
      nextDeadline: field(f.nextDeadline ? new Date(`${f.nextDeadline}T00:00:00.000Z`) : null),
      minimumAge: field(f.minimumAge),
      maximumAge: field(f.maximumAge),
      minimumGpa: field(f.minimumGpa),
      gpaScale: field(f.gpaScale),
      minimumPercentage: field(f.minimumPercentage),
      fundingType: field(f.fundingType),
      fullyFunded: field(f.isFullyFunded),
      applicationUrl: field(f.applicationUrl),
      applicationPortal: field(f.applicationPortal),
      applicationFeeAmount: field(f.applicationFeeAmount),
      applicationFeeCurrency: field(f.applicationFeeCurrency),
      officialPdfUrl: field(f.officialPdfUrl),
    },
    related: {
      eligibleCountries: [],
      degreeLevels: [],
      studyFields: [],
      languageCodes: [],
      documents: [],
      testRequirements: [],
      requirements: [],
      benefits: [],
      faqs: [],
    },
    contact: { email: null, phone: null, coordinator: null, officeAddress: null },
    provenance: {
      pagesCrawled: [], pdfsAnalyzed: [], crawlErrors: [], aiProvider: null,
      aiConfidence: 0, closingPerIntake: [], sourceSegments: [],
    },
    changedFields: [],
  };
  return completenessScore(existing, merge);
}

export interface RunSummaryInput {
  dryRun: boolean;
  outcomes: ScholarshipOutcome[];
  totalEligible: number;
}

export function buildReport(input: RunSummaryInput): QualityReport {
  const { outcomes } = input;
  const processed = outcomes.filter((o) => o.status === 'processed').length;
  const noChange = outcomes.filter((o) => o.status === 'no-change').length;
  const skipped = outcomes.filter((o) => o.status === 'skipped').length;
  const failed = outcomes.filter((o) => o.status === 'failed').length;

  const withCompleteness = outcomes.filter((o) => o.completeness > 0);
  const avgCompleteness = withCompleteness.length
    ? withCompleteness.reduce((a, o) => a + o.completeness, 0) / withCompleteness.length
    : 0;

  const bottom20 = [...outcomes]
    .filter((o) => o.status !== 'skipped')
    .sort((a, b) => a.completeness - b.completeness)
    .slice(0, 20)
    .map((o) => ({ slug: o.scholarshipSlug, provider: o.provider, completeness: o.completeness }));

  const withCompletenessData = outcomes.filter((o) => o.missing.length > 0);
  const countMissing = (key: string) => withCompletenessData.filter((o) => o.missing.includes(key)).length;

  // Overall quality score: 0-100. Completeness is 70%, pipeline success 30%.
  const successRate = input.totalEligible
    ? (processed + noChange) / input.totalEligible
    : 0;
  const overallQualityScore = Math.round(avgCompleteness * 70 + successRate * 30);

  return {
    generatedAt: new Date().toISOString(),
    parserVersion: DEEP_EXTRACT_VERSION,
    dryRun: input.dryRun,
    total: input.totalEligible,
    processed,
    skipped,
    failed,
    avgCompleteness: Math.round(avgCompleteness * 100) / 100,
    pdfsAnalyzed: outcomes.reduce((a, o) => a + o.pdfsAnalyzed, 0),
    pagesCrawled: outcomes.reduce((a, o) => a + o.pagesCrawled, 0),
    missingClosingDeadline: countMissing('closingDate'),
    missingEligibility: countMissing('eligibleCountries'),
    missingFunding: countMissing('fundingType'),
    missingDocuments: countMissing('documents'),
    missingContact: countMissing('contact'),
    overallQualityScore,
    bottom20,
    perScholarship: outcomes,
  };
}
