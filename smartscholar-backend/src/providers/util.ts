import { ExtractedScholarship } from '../acquisition/types';
import { clean, firstSentence } from '../shared/text';

export function emptyFunding() {
  return {
    fundingType: 'UNKNOWN' as const,
    fullyFunded: false,
  };
}

export function emptyDeadlines() {
  return {
    opening: undefined,
    closing: undefined,
    closingPerIntake: [],
    results: undefined,
  };
}

export function emptyEligibility(): ExtractedScholarship['eligibility'] {
  return {
    eligibleCountryCodes: [],
  };
}

export function makeBase(url: string): Pick<
  ExtractedScholarship,
  'url' | 'sourceUrl' | 'funding' | 'deadlines' | 'eligibility' | 'requirements' | 'testRequirements' | 'documentRequirements' | 'benefits' | 'contact' | 'application' | 'languageCodes'
> {
  return {
    url,
    sourceUrl: url,
    funding: emptyFunding(),
    deadlines: emptyDeadlines(),
    eligibility: emptyEligibility(),
    requirements: [],
    testRequirements: [],
    documentRequirements: [],
    benefits: [],
    contact: {},
    application: {},
    languageCodes: [],
  };
}

/** Trim a title, dropping common suffixes like "| Website". */
export function cleanTitle(title: string): string {
  const t = clean(title);
  return t.replace(/\s*[|–—-]\s*[^|]{2,40}$/, '').trim() || t;
}

export function descFromText(text: string): string {
  return firstSentence(clean(text), 500);
}
