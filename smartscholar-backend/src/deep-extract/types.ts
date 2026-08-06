/** Shared types for the Deep Scholarship Extraction Engine. */

export type DocKind = 'pdf' | 'docx' | 'doc';

export interface CrawledPage {
  url: string;
  title: string | null;
  /** Human-readable page text (HTML stripped, whitespace collapsed). */
  text: string;
  /** Score from the relevance filter (0-1). */
  relevance: number;
}

export interface DetectedDoc {
  url: string;
  kind: DocKind;
  title: string | null;
  /** Extracted text (empty when the file could not be parsed). */
  text: string;
  pageCount: number;
  error: string | null;
}

export interface CrawlResult {
  pages: CrawledPage[];
  docs: DetectedDoc[];
  errors: string[];
}

/** Per-field provenance for the never-overwrite policy. */
export type FieldSource = 'ai' | 'pdf' | 'page' | 'existing' | 'curated';

export interface DeepExtracted {
  /** Result confidence 0-1 from the extraction model. */
  confidence: number;
  /** Parser/engine version stamp. */
  parserVersion: string;
  provider: string | null;

  title: string | null;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  seoDescription: string | null;
  summary: string | null;
  tips: string | null;

  university: string | null;
  faculty: string | null;
  department: string | null;
  campus: string | null;
  city: string | null;
  countryCode: string | null;

  degreeLevels: string[];
  studyFields: string[];
  languageCodes: string[];
  durationMonths: number | null;
  durationText: string | null;

  openingDate: string | null;
  closingDate: string | null;
  closingPerIntake: Array<{ label: string | null; date: string | null; raw: string | null }>;
  interviewDate: string | null;
  resultsDate: string | null;
  enrollmentDate: string | null;

  eligibleCountryCodes: string[];
  nationalityRestriction: string | null;
  residencyRestriction: string | null;
  refugeeEligibility: string | null;
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGpa: number | null;
  gpaScale: number | null;
  minimumPercentage: number | null;
  degreeRequirement: string | null;
  workExperience: string | null;
  researchExperience: string | null;
  graduationYearRestriction: string | null;

  requirements: Array<{ type: string; description: string | null; isMandatory: boolean }>;
  testRequirements: Array<{
    type: string;
    minimumScore: string | null;
    minimumBand: string | null;
    isMandatory: boolean;
    notes: string | null;
  }>;
  documents: Array<{ type: string; name: string | null; isRequired: boolean }>;

  fundingType: string | null;
  tuitionCovered: boolean | null;
  accommodationCovered: boolean | null;
  healthInsurance: boolean | null;
  travelCovered: boolean | null;
  visaSupport: boolean | null;
  monthlyStipendAmount: number | null;
  monthlyStipendCurrency: string | null;
  yearlyStipendAmount: number | null;
  yearlyStipendCurrency: string | null;
  oneTimeGrantAmount: number | null;
  oneTimeGrantCurrency: string | null;
  benefits: Array<{
    type: string;
    amount: number | null;
    currency: string | null;
    period: string | null;
    description: string | null;
  }>;

  applicationPortal: string | null;
  applicationUrl: string | null;
  applicationFeeAmount: number | null;
  applicationFeeCurrency: string | null;
  applicationProcess: string | null;
  selectionProcess: string | null;

  contactEmail: string | null;
  contactPhone: string | null;
  coordinator: string | null;
  officeAddress: string | null;

  faqs: Array<{ question: string; answer: string }>;
}

export interface FieldDecision<T> {
  /** Final value to write. */
  value: T;
  /** Whether this differs from what is already in the DB. */
  changed: boolean;
  /** Source of the final value. */
  source: FieldSource;
}

/** Normalized set of field decisions ready for the DB writer. */
export interface MergeResult {
  fields: {
    titleAr: FieldDecision<string | null>;
    descriptionAr: FieldDecision<string | null>;
    seoDescription: FieldDecision<string | null>;
    aiSummary: FieldDecision<string | null>;
    aiTips: FieldDecision<string | null>;
    applicationProcess: FieldDecision<string | null>;
    selectionProcess: FieldDecision<string | null>;
    university: FieldDecision<string | null>;
    countryCode: FieldDecision<string | null>;
    city: FieldDecision<string | null>;
    durationMonths: FieldDecision<number | null>;
    durationText: FieldDecision<string | null>;
    openingDate: FieldDecision<string | null>;
    closingDate: FieldDecision<string | null>;
    interviewDate: FieldDecision<string | null>;
    resultsDate: FieldDecision<string | null>;
    enrollmentDate: FieldDecision<string | null>;
    nextDeadline: FieldDecision<Date | null>;
    minimumAge: FieldDecision<number | null>;
    maximumAge: FieldDecision<number | null>;
    minimumGpa: FieldDecision<number | null>;
    gpaScale: FieldDecision<number | null>;
    minimumPercentage: FieldDecision<number | null>;
    fundingType: FieldDecision<string | null>;
    fullyFunded: FieldDecision<boolean | null>;
    applicationUrl: FieldDecision<string | null>;
    applicationPortal: FieldDecision<string | null>;
    applicationFeeAmount: FieldDecision<number | null>;
    applicationFeeCurrency: FieldDecision<string | null>;
    officialPdfUrl: FieldDecision<string | null>;
  };
  /** Related rows to add (or to fill gaps on). */
  related: {
    eligibleCountries: { code: string; source: FieldSource }[];
    degreeLevels: string[];
    studyFields: string[];
    languageCodes: { code: string; required: boolean }[];
    documents: Array<{ type: string; name: string | null; isRequired: boolean; source: FieldSource }>;
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
  /** Contact info (stored in metadata + provider row when empty). */
  contact: {
    email: string | null;
    phone: string | null;
    coordinator: string | null;
    officeAddress: string | null;
  };
  provenance: {
    pagesCrawled: string[];
    pdfsAnalyzed: string[];
    crawlErrors: string[];
    aiProvider: string | null;
    aiConfidence: number;
    closingPerIntake: Array<{ label: string | null; date: string | null; raw: string | null }>;
    sourceSegments: string[];
  };
  changedFields: string[];
}

export interface ScholarshipOutcome {
  scholarshipSlug: string;
  provider: string;
  status: 'processed' | 'skipped' | 'failed' | 'no-change';
  changedFields: string[];
  pagesCrawled: number;
  pdfsAnalyzed: number;
  errors: string[];
  confidence: number;
  durationMs: number;
  completeness: number;
  missing: string[];
}

export interface QualityReport {
  generatedAt: string;
  parserVersion: string;
  dryRun: boolean;
  total: number;
  processed: number;
  skipped: number;
  failed: number;
  avgCompleteness: number;
  pdfsAnalyzed: number;
  pagesCrawled: number;
  missingClosingDeadline: number;
  missingEligibility: number;
  missingFunding: number;
  missingDocuments: number;
  missingContact: number;
  overallQualityScore: number;
  bottom20: Array<{ slug: string; provider: string; completeness: number }>;
  perScholarship: ScholarshipOutcome[];
}

export const DEEP_EXTRACT_VERSION = '1.0.0';
