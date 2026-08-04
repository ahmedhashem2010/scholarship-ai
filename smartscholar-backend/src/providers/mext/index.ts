import { ProviderAdapter, DiscoveredPage, ExtractedScholarship, ExtractOptions } from '../../acquisition/types';
import { makeBase } from '../util';

export const MEXT_PAGE = 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/';

interface MextType {
  key: string;
  title: string;
  degreeLevels: string[];
  duration: string;
  recommendation: string;
  studyFields?: string[];
  /** Monthly allowance in JPY (official FY2025/2026 rates). */
  monthlyStipend?: number;
  minimumAge?: number;
  maximumAge?: number;
  languageCodes?: string[];
  exams?: string;
}

const TYPES: MextType[] = [
  {
    key: 'research',
    title: 'MEXT Scholarship — Research Students',
    degreeLevels: ['MASTER', 'PHD'],
    duration: 'Irregular course: up to 2 years; regular course: standard period of the graduate school (embassy recommendation). University recommendation duration depends on the university quota (up to the standard school year).',
    recommendation: 'Embassy or university recommendation',
    monthlyStipend: 144000,
    maximumAge: 34,
    languageCodes: ['ja', 'en'],
    exams: 'Japanese and English written examinations',
  },
  {
    key: 'undergraduate',
    title: 'MEXT Scholarship — Undergraduate Students',
    degreeLevels: ['BACHELOR'],
    duration: '5 years including Japanese language training (7 years for medicine, dentistry, pharmacy and veterinary science) under embassy recommendation.',
    recommendation: 'Embassy recommendation',
    monthlyStipend: 117000,
    maximumAge: 24,
    languageCodes: ['ja', 'en'],
    exams: 'Japanese, English, mathematics and science written examinations',
  },
  {
    key: 'teacher-training',
    title: 'MEXT Scholarship — Teacher Training Students',
    degreeLevels: ['BACHELOR'],
    duration: 'Within 1 year and 6 months including Japanese language education.',
    recommendation: 'Embassy recommendation',
    monthlyStipend: 117000,
    maximumAge: 34,
    languageCodes: ['ja', 'en'],
    exams: 'Japanese and English written examinations',
  },
  {
    key: 'japanese-studies',
    title: 'MEXT Scholarship — Japanese Studies Students',
    degreeLevels: ['BACHELOR'],
    duration: '1 year (embassy recommendation), including Japanese language / Japanese culture studies at a university.',
    recommendation: 'Embassy recommendation',
    monthlyStipend: 117000,
    minimumAge: 18,
    maximumAge: 29,
    languageCodes: ['ja'],
    exams: 'Japanese written examination',
  },
  {
    key: 'college-of-technology',
    title: 'MEXT Scholarship — College of Technology Students',
    degreeLevels: ['ASSOCIATE'],
    duration: '4 years including Japanese language training (3 years for students with sufficient Japanese proficiency), with transfer to the third year of a College of Technology.',
    recommendation: 'Embassy recommendation or College of Technology recommendation',
    monthlyStipend: 117000,
    maximumAge: 24,
    languageCodes: ['ja', 'en'],
    exams: 'Japanese, English, mathematics and physics or chemistry written examinations',
  },
  {
    key: 'specialized-training',
    title: 'MEXT Scholarship — Specialized Training College Students',
    degreeLevels: ['ASSOCIATE'],
    duration: '3 years including Japanese language training.',
    recommendation: 'Embassy recommendation',
    monthlyStipend: 117000,
    maximumAge: 24,
    languageCodes: ['ja', 'en'],
    exams: 'Japanese, English and mathematics written examinations',
  },
  {
    key: 'ylp',
    title: 'MEXT Scholarship — Young Leaders Program (YLP)',
    degreeLevels: ['MASTER'],
    duration: '1 year master\'s course at a designated YLP partner university.',
    recommendation: 'Designated YLP universities',
    monthlyStipend: 242000,
    maximumAge: 39,
    languageCodes: ['ja', 'en'],
    studyFields: ['law', 'business administration', 'public administration', 'economics'],
  },
];

const TYPE_BY_KEY = new Map(TYPES.map((t) => [t.key, t]));

export const mextAdapter: ProviderAdapter = {
  id: 'mext',
  name: 'Japanese Government (MEXT) Scholarship',
  website: 'https://www.studyinjapan.go.jp/en/planning/scholarships/',
  defaultMax: 7,

  async discover(): Promise<DiscoveredPage[]> {
    return TYPES.map((t) => ({
      url: `${MEXT_PAGE}#${t.key}`,
      sourceUrl: `${MEXT_PAGE}#${t.key}`,
      title: t.title,
      metadata: { key: t.key },
    }));
  },

  async extract(url: string, _html: string, opts: ExtractOptions = {}): Promise<ExtractedScholarship> {
    const key = (typeof opts.metadata?.key === 'string' && opts.metadata.key) || url.split('#')[1] || 'research';
    const type = TYPE_BY_KEY.get(key) ?? TYPES[0];

    const base = makeBase(url);
    return {
      ...base,
      title: type.title,
      provider: 'MEXT',
      degreeLevels: type.degreeLevels,
      studyFields: type.studyFields ?? [],
      description:
        `Japanese Government (MEXT) Scholarship for ${key === 'research'
          ? 'graduate research students'
          : key === 'undergraduate'
            ? 'undergraduate students'
            : key === 'teacher-training'
              ? 'teacher training students'
              : key === 'japanese-studies'
                ? 'students of Japanese studies'
                : key === 'college-of-technology'
                  ? 'college of technology students'
                  : key === 'specialized-training'
                    ? 'specialized training college students'
                    : 'Young Leaders Program students'}. ` +
        `Official programme of the Government of Japan. Duration: ${type.duration} Recommendation route: ${type.recommendation}.`,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        travelCovered: true,
        monthlyStipend: type.monthlyStipend
          ? { amount: type.monthlyStipend, currency: 'JPY', period: 'monthly' }
          : undefined,
        notes:
          type.monthlyStipend === 144000
            ? 'Monthly allowance ¥143,000–145,000 depending on level (research student ¥143,000, master\'s ¥144,000, doctoral ¥145,000). Tuition exempted and round-trip airfare provided.'
            : 'Monthly allowance (¥117,000/month for this category), tuition exempted and round-trip airfare provided. See official guidelines for current amounts.',
      },
      deadlines: {
        closing: {
          raw: 'Application period varies by route and country (typically spring for embassy recommendation). See the official application guidelines and the Japanese embassy in your country.',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: [],
        minimumAge: type.minimumAge,
        maximumAge: type.maximumAge,
        notes:
          'Open to international students. Age and academic requirements differ per category and recommendation route — see official guidelines.',
      },
      requirements: type.exams
        ? [{ type: 'other', description: `Embassy recommendation written examinations: ${type.exams}`, isMandatory: true }]
        : [],
      documentRequirements: [
        { type: 'application form', isRequired: true },
        { type: 'transcript', isRequired: true },
        { type: 'recommendation letter', isRequired: true },
        { type: 'medical certificate', isRequired: true },
      ],
      benefits: [
        { type: 'tuition', description: 'Tuition exempted' },
        { type: 'travel', description: 'Round-trip airfare provided' },
        type.monthlyStipend
          ? { type: 'monthly stipend', amount: { amount: type.monthlyStipend, currency: 'JPY', period: 'monthly' } }
          : { type: 'monthly stipend', description: 'Monthly allowance per official rates' },
      ],
      application: {
        url: MEXT_PAGE,
        process:
          key === 'ylp'
            ? 'Apply through a designated YLP partner university.'
            : `Apply via the ${type.recommendation.toLowerCase()} route as described in the official guidelines.`,
      },
      contact: { url: MEXT_PAGE },
      languageCodes: type.languageCodes ?? ['ja', 'en'],
      confidence: 0.85,
      parserVersion: 'mext-v2',
    };
  },
};
