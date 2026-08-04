import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const CHEVENING_SCHOLARSHIPS_URL = 'https://www.chevening.org/scholarships/';
export const CHEVENING_APPLY_URL = 'https://www.chevening.org/apply/';

export const CHEVENING_PROGRAM_KEY = 'chevening-scholarship';

export const cheveningAdapter: ProviderAdapter = {
  id: 'chevening',
  name: 'Chevening Scholarships (UK Government)',
  website: 'https://www.chevening.org/',
  defaultMax: 1,

  async discover(): Promise<DiscoveredPage[]> {
    return [
      {
        url: CHEVENING_SCHOLARSHIPS_URL,
        sourceUrl: CHEVENING_SCHOLARSHIPS_URL,
        title: 'Chevening Scholarship',
        metadata: { key: CHEVENING_PROGRAM_KEY },
      },
    ];
  },

  async extract(url: string, _html: string, _opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const base = makeBase(url);

    const description =
      'Chevening is the UK Government\'s international awards scheme, funded by the Foreign, Commonwealth & Development Office (FCDO) and partner organisations. Around 1,500 scholars from more than 160 countries are selected each year to study a fully funded one-year master\'s degree at any UK university. Scholars are chosen for their leadership potential and commitment to positive change in their home country, and are expected to return home for at least two years after their award. Duration: 1 year (full-time master\'s).';

    return {
      ...base,
      title: 'Chevening Scholarship',
      provider: 'Chevening (UK Government)',
      degreeLevels: ['MASTER'],
      studyFields: [],
      countryCode: undefined,
      durationText: '1 year (full-time master\'s at any UK university).',
      description,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        travelCovered: true,
        visaSupport: true,
        monthlyStipend: { amount: 1215, currency: 'GBP', period: 'monthly' },
        notes:
          'Fully funded: full tuition fees, a monthly personal living allowance (about £1,215/month outside London and £1,516/month within the London area in recent years, reviewed annually), an arrival allowance, a homeward departure allowance, return economy airfare, the cost of a single visa application and a contribution of up to £75 for TB testing where required. A thesis/dissertation grant and travel top-up may also apply.',
      },
      deadlines: {
        closing: {
          date: '2026-10-06',
          raw: '6 October 2026 at 11:00 UTC (annual call; applications typically open in August and close in early October for study the following autumn).',
        },
      },
      eligibility: {
        eligibleCountryCodes: [],
        nationalityRestriction:
          'Open to citizens of Chevening-eligible countries and territories (160+ countries). British nationals and dual British nationals are not eligible.',
        degreeRequirement:
          'An undergraduate degree (usually equivalent to a UK upper second-class / 2:1 honours degree or above) is required.',
        workExperience: 'At least two years of work experience (2,800 hours of cumulative work experience).',
        languageRequirement:
          'English proficiency at the level required by your chosen UK university course (commonly IELTS 6.5 or equivalent).',
        notes:
          'Applicants must apply to three eligible full-time UK master\'s courses and obtain at least one unconditional offer before the offer deadline. Applicants must return to their home country for at least two years after their scholarship ends. There is no upper age limit.',
      },
      requirements: [
        {
          type: 'other',
          description:
            'Applicants must apply to three eligible full-time master\'s courses at UK universities and receive at least one unconditional offer by the published offer deadline.',
          isMandatory: true,
        },
        {
          type: 'other',
          description:
            'Applicants must demonstrate leadership potential and a clear plan to return home and contribute to their country for at least two years after the award.',
          isMandatory: true,
        },
      ],
      testRequirements: [],
      documentRequirements: [
        { type: 'diploma', isRequired: true },
        { type: 'transcript', isRequired: true },
        { type: 'cv', isRequired: true },
        { type: 'letter of recommendation', isRequired: true },
        { type: 'passport', isRequired: true },
        { type: 'ielts', isRequired: false },
      ],
      benefits: [
        { type: 'tuition', description: 'Full tuition fees at any UK university' },
        { type: 'monthly stipend', amount: { amount: 1215, currency: 'GBP', period: 'monthly' }, description: 'Monthly personal living allowance (higher rate for London)' },
        { type: 'travel', description: 'Return economy airfare from home country to the UK' },
        { type: 'visa support', description: 'Cost of a single UK visa application' },
        { type: 'settlement allowance', description: 'Arrival allowance and homeward departure allowance' },
      ],
      application: {
        portal: CHEVENING_APPLY_URL,
        url: CHEVENING_SCHOLARSHIPS_URL,
        process:
          'Complete the online Chevening application at chevening.org/apply before the deadline, including four essay-style questions, education history and references. Shortlisted candidates are interviewed by a panel at the British embassy or high commission in their country. Successful candidates must secure at least one unconditional UK university offer.',
      },
      contact: { url: 'https://www.chevening.org/' },
      languageCodes: ['en'],
      confidence: 0.9,
      parserVersion: 'chevening-v1',
    };
  },
};
