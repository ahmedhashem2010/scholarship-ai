import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const CSC_URL = 'http://www.campuschina.org/';
export const CSC_APPLY_URL = 'http://www.campuschina.org/';
export const CSC_INFO_URL = 'https://www.csc.edu.cn/';

/** Official Chinese Government Scholarship monthly stipends (CNY). */
export const CSC_BACHELOR_STIPEND_CNY = 2500;
export const CSC_MASTER_STIPEND_CNY = 3000;
export const CSC_DOCTORAL_STIPEND_CNY = 3500;

interface CscProgram {
  key: string;
  title: string;
  degreeLevels: string[];
  duration: string;
  durationText: string;
  monthlyStipend: number;
  maximumAge: number;
  degreeRequirement: string;
}

const PROGRAMS: CscProgram[] = [
  {
    key: 'undergraduate',
    title: 'Chinese Government Scholarship – Undergraduate Programme',
    degreeLevels: ['BACHELOR'],
    duration:
      '4–5 years for a bachelor\'s degree (including up to one year of Chinese language study for Chinese-taught programmes).',
    durationText: '4–5 years (including up to 1 year of language study).',
    monthlyStipend: CSC_BACHELOR_STIPEND_CNY,
    maximumAge: 25,
    degreeRequirement: 'A high school diploma (or equivalent) with strong academic results.',
  },
  {
    key: 'master',
    title: 'Chinese Government Scholarship – Master\'s Programme',
    degreeLevels: ['MASTER'],
    duration:
      '2–3 years for a master\'s degree (including up to one year of Chinese language study for Chinese-taught programmes).',
    durationText: '2–3 years (including up to 1 year of language study).',
    monthlyStipend: CSC_MASTER_STIPEND_CNY,
    maximumAge: 35,
    degreeRequirement: 'A bachelor\'s degree (or equivalent) with strong academic results.',
  },
  {
    key: 'doctoral',
    title: 'Chinese Government Scholarship – Doctoral Programme',
    degreeLevels: ['PHD'],
    duration:
      '3–4 years for a doctoral degree (including up to one year of Chinese language study for Chinese-taught programmes).',
    durationText: '3–4 years (including up to 1 year of language study).',
    monthlyStipend: CSC_DOCTORAL_STIPEND_CNY,
    maximumAge: 40,
    degreeRequirement: 'A master\'s degree (or equivalent) with strong academic results.',
  },
];

const PROGRAM_BY_KEY = new Map(PROGRAMS.map((p) => [p.key, p]));

export const cscAdapter: ProviderAdapter = {
  id: 'csc',
  name: 'Chinese Government Scholarship (China Scholarship Council)',
  website: CSC_INFO_URL,
  defaultMax: PROGRAMS.length,
  curated: true,

  async discover(): Promise<DiscoveredPage[]> {
    return PROGRAMS.map((p) => ({
      url: CSC_URL,
      sourceUrl: CSC_URL,
      title: p.title,
      metadata: { key: p.key },
    }));
  },

  async extract(url: string, _html: string, opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const key = (typeof opts.metadata?.key === 'string' && opts.metadata.key) || 'master';
    const program = PROGRAM_BY_KEY.get(key) ?? PROGRAMS[1];

    const base = makeBase(url);
    const degreeName = program.degreeLevels[0] === 'BACHELOR' ? 'bachelor\'s' : program.degreeLevels[0] === 'PHD' ? 'doctoral' : 'master\'s';

    const description =
      `The Chinese Government Scholarship (administered by the China Scholarship Council, CSC) is the flagship scholarship of the People's Republic of China, funded by the Chinese Ministry of Education. It supports international students for full-time ${degreeName} degree study at more than 280 designated Chinese universities. The award covers tuition, on-campus accommodation, a monthly living allowance and comprehensive medical insurance. Duration: ${program.duration}`;

    return {
      ...base,
      title: program.title,
      provider: 'Chinese Government Scholarship (CSC)',
      degreeLevels: program.degreeLevels,
      studyFields: [],
      countryCode: undefined,
      durationText: program.durationText,
      description,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        accommodationCovered: true,
        healthInsurance: true,
        travelCovered: false,
        monthlyStipend: { amount: program.monthlyStipend, currency: 'CNY', period: 'monthly' },
        notes:
          `Full tuition fee waiver; free on-campus accommodation (or an accommodation subsidy); monthly living allowance of CNY ${program.monthlyStipend.toLocaleString('en-US')} for ${degreeName} students; and comprehensive medical insurance for the full scholarship period. International travel is generally not covered.`,
      },
      deadlines: {
        closing: {
          raw: 'Online application via the CSC Online Application System typically opens around early December and closes in mid-to-late April for the following academic year. Type A (bilateral, via the Chinese embassy) and Type B (via designated universities) have separate application windows — check the current call and your host university\'s deadline.',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: [],
        nationalityRestriction:
          'Open to non-Chinese citizens of countries having diplomatic relations with the People\'s Republic of China. Applicants must not currently study at a Chinese institution (with limited exceptions).',
        maximumAge: program.maximumAge,
        degreeRequirement: program.degreeRequirement,
        languageRequirement:
          'Chinese-taught programmes require Chinese proficiency (typically HSK 4–5, or a preparatory Chinese language year is provided); English-taught programmes require English proficiency (IELTS, TOEFL or equivalent) as set by the host university.',
        notes:
          'Applicants choose from the list of designated universities and programmes. Applications are made under a category (Type A via dispatching authorities, Type B via designated universities, Type C via Chinese government programmes) and must be submitted through the CSC Online Application System.',
      },
      requirements: [
        {
          type: 'other',
          description:
            'Applicants must apply under the correct category (Type A via the Chinese embassy / dispatching authority, or Type B directly to a designated university) and submit the CSC form number with their application.',
          isMandatory: true,
        },
      ],
      testRequirements: [],
      documentRequirements: [
        { type: 'diploma', isRequired: true },
        { type: 'transcript', isRequired: true },
        { type: 'passport', isRequired: true },
        { type: 'medical certificate', isRequired: true },
        { type: 'letter of recommendation', isRequired: true },
        ...(program.degreeLevels[0] === 'PHD'
          ? [{ type: 'statement of purpose', name: 'Research proposal', isRequired: true }]
          : [{ type: 'statement of purpose', name: 'Study plan', isRequired: true }]),
        { type: 'ielts', isRequired: false },
      ],
      benefits: [
        { type: 'tuition', description: 'Full tuition fee waiver' },
        { type: 'housing', description: 'Free on-campus accommodation (or accommodation subsidy)' },
        { type: 'monthly stipend', amount: { amount: program.monthlyStipend, currency: 'CNY', period: 'monthly' }, description: `Monthly living allowance for ${degreeName} students` },
        { type: 'health insurance', description: 'Comprehensive medical insurance for the scholarship period' },
      ],
      application: {
        portal: CSC_APPLY_URL,
        url: CSC_URL,
        process:
          'Create an account in the CSC Online Application System (campuschina.org), select your category and designated university, complete the application, obtain the CSC Application Form number, and submit all required documents (including the notarised certificates) to the dispatching authority (embassy) or the designated university before the deadline.',
      },
      contact: { url: CSC_INFO_URL },
      languageCodes: ['zh', 'en'],
      confidence: 0.8,
      parserVersion: 'csc-v1',
    };
  },
};
