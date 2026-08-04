import { ProviderAdapter, DiscoveredPage, ExtractedScholarship } from '../../acquisition/types';
import { makeBase } from '../util';

export const MEXT_PAGE = 'https://www.studyinjapan.go.jp/en/planning/scholarships/mext-scholarships/';

interface MextType {
  key: string;
  title: string;
  degreeLevels: string[];
  duration: string;
  recommendation: string;
  studyFields?: string[];
}

const TYPES: MextType[] = [
  {
    key: 'research',
    title: 'MEXT Scholarship — Research Students',
    degreeLevels: ['MASTER', 'PHD'],
    duration: 'Irregular course: up to 2 years; regular course: standard period of the graduate school (embassy recommendation). University recommendation duration depends on the university quota (up to the standard school year).',
    recommendation: 'Embassy or university recommendation',
  },
  {
    key: 'undergraduate',
    title: 'MEXT Scholarship — Undergraduate Students',
    degreeLevels: ['BACHELOR'],
    duration: '5 years including Japanese language training (7 years for medicine, dentistry, pharmacy and veterinary science) under embassy recommendation.',
    recommendation: 'Embassy recommendation',
  },
  {
    key: 'teacher-training',
    title: 'MEXT Scholarship — Teacher Training Students',
    degreeLevels: ['BACHELOR'],
    duration: 'Within 1 year and 6 months including Japanese language education.',
    recommendation: 'Embassy recommendation',
  },
  {
    key: 'japanese-studies',
    title: 'MEXT Scholarship — Japanese Studies Students',
    degreeLevels: ['BACHELOR'],
    duration: '1 year (embassy recommendation), including Japanese language / Japanese culture studies at a university.',
    recommendation: 'Embassy recommendation',
  },
  {
    key: 'college-of-technology',
    title: 'MEXT Scholarship — College of Technology Students',
    degreeLevels: ['ASSOCIATE'],
    duration: '4 years including Japanese language training (3 years for students with sufficient Japanese proficiency), with transfer to the third year of a College of Technology.',
    recommendation: 'Embassy recommendation or College of Technology recommendation',
  },
  {
    key: 'specialized-training',
    title: 'MEXT Scholarship — Specialized Training College Students',
    degreeLevels: ['ASSOCIATE'],
    duration: '3 years including Japanese language training.',
    recommendation: 'Embassy recommendation',
  },
  {
    key: 'ylp',
    title: 'MEXT Scholarship — Young Leaders Program (YLP)',
    degreeLevels: ['MASTER'],
    duration: '1 year master\'s course at a designated YLP partner university.',
    recommendation: 'Designated YLP universities',
    studyFields: ['law', 'business administration', 'public administration', 'economics'],
  },
];

export const mextAdapter: ProviderAdapter = {
  id: 'mext',
  name: 'Japanese Government (MEXT) Scholarship',
  website: 'https://www.studyinjapan.go.jp/en/planning/scholarships/',
  defaultMax: 7,

  async discover(): Promise<DiscoveredPage[]> {
    return TYPES.map((t) => ({
      url: `${MEXT_PAGE}#${t.key}`,
      sourceUrl: MEXT_PAGE,
      title: t.title,
    }));
  },

  async extract(url: string, _html: string): Promise<ExtractedScholarship> {
    const key = (url.split('#')[1] ?? 'research') as string;
    const type = TYPES.find((t) => t.key === key) ?? TYPES[0];

    const base = makeBase(url);
    return {
      ...base,
      title: type.title,
      provider: 'MEXT (Ministry of Education, Culture, Sports, Science and Technology)',
      degreeLevels: type.degreeLevels,
      studyFields: type.studyFields ?? [],
      description:
        'Japanese Government (MEXT) Scholarship for ' +
        (key === 'research'
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
                    : 'Young Leaders Program students') +
        `. Official programme of the Government of Japan. Duration: ${type.duration} Recommendation route: ${type.recommendation}.`,
      funding: {
        fundingType: 'FULLY_FUNDED',
        fullyFunded: true,
        tuitionCovered: true,
        travelCovered: true,
        notes: 'Monthly allowance (approx. 117,000–145,000 JPY/month depending on level), tuition exempted, and round-trip airfare provided. See official guidelines for current amounts.',
      },
      deadlines: {
        closing: {
          raw: 'Application period varies by route and country (typically autumn for embassy recommendation). See the official application guidelines and the Japanese embassy in your country.',
          isFallback: true,
        },
      },
      eligibility: {
        eligibleCountryCodes: [],
        notes: 'Open to international students; nationality, age and academic requirements differ per category and recommendation route — see official guidelines.',
      },
      documentRequirements: [
        { type: 'transcript', isRequired: true },
        { type: 'application form', isRequired: true },
        { type: 'medical certificate', isRequired: true },
        { type: 'recommendation letter', isRequired: true },
      ],
      benefits: [
        { type: 'tuition', description: 'Tuition exempted' },
        { type: 'travel', description: 'Round-trip airfare provided' },
        { type: 'monthly stipend', description: 'Monthly allowance (117,000–145,000 JPY approx.)' },
      ],
      application: {
        url: MEXT_PAGE,
        process:
          key === 'ylp'
            ? 'Apply through a designated YLP partner university.'
            : `Apply via the ${type.recommendation.toLowerCase()} route as described in the official guidelines.`,
      },
      contact: { url: MEXT_PAGE },
      languageCodes: ['ja', 'en'],
      confidence: 0.8,
      parserVersion: 'mext-v1',
    };
  },
};
