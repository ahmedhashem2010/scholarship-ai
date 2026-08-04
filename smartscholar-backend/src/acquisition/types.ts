export type ProviderId =
  | 'daad'
  | 'erasmus'
  | 'chevening'
  | 'fulbright'
  | 'mext'
  | 'stipendium-hungaricum'
  | 'csc';

/** A discovered scholarship landing page (official source URL). */
export interface DiscoveredPage {
  url: string;
  title?: string;
  /** Canonical / final URL after redirects. */
  sourceUrl: string;
  /** Provider-specific metadata carried from discovery into extraction. */
  metadata?: Record<string, unknown>;
}

export interface ProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  readonly website: string;
  /** Default cap on items imported for this provider (0 = unlimited). */
  readonly defaultMax?: number;
  /**
   * Curated providers extract without fetching the source page (used when the
   * official site blocks automated fetches or the content is hand-curated).
   * The extract() call receives empty HTML.
   */
  readonly curated?: boolean;
  /** Discovery: return candidate scholarship page URLs. */
  discover(): Promise<DiscoveredPage[]>;
  /** Extract a single scholarship from a fetched page. */
  extract(url: string, html: string, opts: ExtractOptions): Promise<ExtractedScholarship>;
}

export interface ExtractOptions {
  /** Current ISO date, used to compute deadlines. */
  now?: Date;
  /** Provider-specific metadata carried from discovery into extraction. */
  metadata?: Record<string, unknown>;
}

export interface Amount {
  amount: number;
  currency: string;
  period?: 'once' | 'monthly' | 'yearly' | 'per-semester' | 'per-year';
}

export interface Funding {
  fundingType?: 'FULLY_FUNDED' | 'PARTIALLY_FUNDED' | 'SELF_FUNDED' | 'UNKNOWN';
  fullyFunded?: boolean;
  tuitionCovered?: boolean;
  monthlyStipend?: Amount;
  yearlyStipend?: Amount;
  oneTimeGrant?: Amount;
  accommodationCovered?: boolean;
  healthInsurance?: boolean;
  travelCovered?: boolean;
  visaSupport?: boolean;
  notes?: string;
}

export interface Deadline {
  label?: string;
  /** ISO date YYYY-MM-DD when known. */
  date?: string;
  /** Human-readable date text when exact date unknown. */
  raw?: string;
  isFallback?: boolean;
}

export interface Deadlines {
  opening?: Deadline;
  closing?: Deadline;
  closingPerIntake?: Deadline[];
  results?: Deadline;
}

export interface Eligibility {
  eligibleCountryCodes: string[];
  nationalityRestriction?: string;
  minimumAge?: number;
  maximumAge?: number;
  minimumGpa?: number;
  gpaScale?: number;
  degreeRequirement?: string;
  workExperience?: string;
  languageRequirement?: string;
  notes?: string;
}

export interface Requirement {
  type: string;
  description?: string;
  isMandatory: boolean;
}

export interface TestRequirement {
  type: string;
  minimumScore?: string;
  isMandatory: boolean;
  notes?: string;
}

export interface DocumentRequirement {
  type: string;
  name?: string;
  isRequired: boolean;
}

export interface Benefit {
  type: string;
  amount?: Amount;
  description?: string;
}

export interface Contact {
  email?: string;
  phone?: string;
  url?: string;
}

export interface Application {
  portal?: string;
  url?: string;
  steps?: string;
  process?: string;
  fee?: Amount;
}

export interface ExtractedScholarship {
  url: string;
  sourceUrl: string;
  title: string;
  provider: string;
  university?: string;
  faculty?: string;
  department?: string;
  countryCode?: string;
  city?: string;
  degreeLevels: string[];
  studyFields: string[];
  durationMonths?: number;
  durationText?: string;
  description?: string;
  funding: Funding;
  deadlines: Deadlines;
  eligibility: Eligibility;
  requirements: Requirement[];
  testRequirements: TestRequirement[];
  documentRequirements: DocumentRequirement[];
  benefits: Benefit[];
  contact: Contact;
  application: Application;
  languageCodes: string[];
  confidence: number;
  parserVersion: string;
}

/** Normalized, DB-ready scholarship. */
export interface NormalizedScholarship {
  title: string;
  titleAr: string | null;
  slug: string;
  provider: string;
  sourceUrl: string;
  originalUrl: string;
  university: string | null;
  countryCode: string | null;
  city: string | null;
  campus: string | null;
  description: string | null;
  degreeLevels: string[];
  studyFields: string[];
  languageCodes: string[];
  durationMonths: number | null;
  durationText: string | null;
  fundingType: string;
  fullyFunded: boolean;
  tuitionCovered: boolean | null;
  monthlyStipendAmount: number | null;
  monthlyStipendCurrency: string | null;
  yearlyStipendAmount: number | null;
  yearlyStipendCurrency: string | null;
  oneTimeGrantAmount: number | null;
  oneTimeGrantCurrency: string | null;
  accommodationCovered: boolean | null;
  healthInsurance: boolean | null;
  travelCovered: boolean | null;
  visaSupport: boolean | null;
  openingDate: string | null;
  closingDate: string | null;
  eligibleCountryCodes: string[];
  minimumAge: number | null;
  maximumAge: number | null;
  minimumGpa: number | null;
  gpaScale: number | null;
  testRequirements: Array<{ type: string; minimumScore?: string; isMandatory: boolean }>;
  documentTypes: Array<{ type: string; isRequired: boolean }>;
  benefits: Array<{ type: string; amount?: number; currency?: string; description?: string }>;
  requirements: Array<{ type: string; description?: string; isMandatory: boolean }>;
  contactEmail: string | null;
  contactPhone: string | null;
  applicationPortal: string | null;
  applicationUrl: string | null;
  applicationProcess: string | null;
  applicationFeeAmount: number | null;
  applicationFeeCurrency: string | null;
  isStructured: boolean;
  extractionConfidence: number;
  parserVersion: string;
  importSourceType: string;
  scrapedAt: string;
}

export interface ImportSummary {
  provider: string;
  discovered: number;
  extracted: number;
  saved: number;
  updated: number;
  skipped: number;
  failed: number;
  durationMs: number;
  errors: Array<{ url?: string; message: string }>;
}
