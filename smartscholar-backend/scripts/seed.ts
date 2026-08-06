import { getPrisma, closePrisma, loadEnv, requireEnv, slugify, parseArgs, flagBoolean, flagNumber, today, fmt } from './lib';
import { CONTINENTS, CURRENCIES, LANGUAGES, DEGREES, FIELDS, COUNTRIES, CurrencySeed } from '../src/data/reference';

interface ScholarshipSeed {
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  provider: string;
  providerType: string;
  country: string;
  degree: string;
  fundingType: string;
  closingInDays: number;
  officialWebsite: string;
  isFeatured: boolean;
}

const SCHOLARSHIPS: ScholarshipSeed[] = [
  {
    slug: 'daad-development-related-postgraduate-courses',
    title: 'DAAD Development-Related Postgraduate Courses',
    titleAr: 'منح دااد للدراسات العليا المرتبطة بالتنمية',
    description:
      'Fully funded postgraduate scholarships for students from developing countries, including all Arab League states, to study at German universities. Covers tuition, monthly stipend, health insurance and travel.',
    provider: 'DAAD',
    providerType: 'GOVERNMENT',
    country: 'DE',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 60,
    officialWebsite: 'https://www.daad.de',
    isFeatured: true,
  },
  {
    slug: 'chevening-scholarships',
    title: 'Chevening Scholarships',
    titleAr: 'منح تشيفنينغ',
    description:
      'The UK Government\u2019s global scholarship programme, funding one-year master\u2019s degrees at any UK university. Open to citizens of Chevening-eligible countries including Egypt, Jordan, Lebanon and Morocco.',
    provider: 'UK Foreign, Commonwealth & Development Office',
    providerType: 'GOVERNMENT',
    country: 'GB',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 45,
    officialWebsite: 'https://www.chevening.org',
    isFeatured: true,
  },
  {
    slug: 'fulbright-foreign-student-program',
    title: 'Fulbright Foreign Student Program',
    titleAr: 'برنامج فولبرايت للطلاب الدوليين',
    description:
      'Grants for graduate study in the United States, covering tuition, living costs, health insurance and airfare. Administered by binational Fulbright Commissions, including in Egypt, Jordan, Iraq and the Gulf.',
    provider: 'US Department of State / Bureau of Educational and Cultural Affairs',
    providerType: 'GOVERNMENT',
    country: 'US',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 75,
    officialWebsite: 'https://foreign.fulbrightonline.org',
    isFeatured: true,
  },
  {
    slug: 'kaust-king-abdullah-scholarships',
    title: 'KAUST Scholarships for Master\u2019s and PhD',
    titleAr: 'منح جامعة الملك عبدالله للعلوم والتقنية',
    description:
      'Full funding for MS and PhD study in science, engineering and mathematics at King Abdullah University of Science and Technology in Saudi Arabia. Includes tuition, housing, medical cover and a generous annual stipend.',
    provider: 'King Abdullah University of Science and Technology',
    providerType: 'UNIVERSITY',
    country: 'SA',
    degree: 'doctorate',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 90,
    officialWebsite: 'https://www.kaust.edu.sa',
    isFeatured: true,
  },
  {
    slug: 'erasmus-mundus-joint-masters',
    title: 'Erasmus Mundus Joint Master\u2019s Degrees',
    titleAr: 'منح إيراسموس موندوس للماجستير المشترك',
    description:
      'Fully funded joint master\u2019s programmes delivered by consortia of European universities, open to students from all nationalities including the Arab world. Covers tuition, travel and monthly allowance.',
    provider: 'European Commission',
    providerType: 'INTERNATIONAL_ORGANIZATION',
    country: 'DE',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 120,
    officialWebsite: 'https://www.eacea.ec.europa.eu',
    isFeatured: false,
  },
  {
    slug: 'isdb-merit-scholarship',
    title: 'IsDB Merit Scholarship for High Technology',
    titleAr: 'منحة البنك الإسلامي للتنمية للتقنية العالية',
    description:
      'Scholarships from the Islamic Development Bank for graduate study in high-technology and applied fields for students from OIC member countries, including Egypt, Jordan, Sudan, Morocco and Indonesia.',
    provider: 'Islamic Development Bank',
    providerType: 'INTERNATIONAL_ORGANIZATION',
    country: 'SA',
    degree: 'master',
    fundingType: 'FULLY_FUNDED',
    closingInDays: 50,
    officialWebsite: 'https://www.isdb.org',
    isFeatured: false,
  },
];

async function seedContinents(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, name, nameAr] of CONTINENTS) {
    const row = await prisma.continent.upsert({
      where: { code },
      create: { code, name, nameAr, slug: slugify(name) },
      update: { name, nameAr, slug: slugify(name) },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedCurrencies(prisma: Awaited<ReturnType<typeof getPrisma>>, countryCurrencies: Set<string>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const known = new Map<string, CurrencySeed>(CURRENCIES.map((c) => [c[0], c]));
  const all = new Set<string>([...CURRENCIES.map((c) => c[0]), ...countryCurrencies]);
  for (const code of all) {
    const seed = known.get(code);
    const row = await prisma.currency.upsert({
      where: { code },
      create: {
        code,
        name: seed ? seed[1] : code,
        nameAr: seed ? seed[2] : null,
        symbol: seed ? seed[3] : null,
      },
      update: {
        name: seed ? seed[1] : undefined,
        nameAr: seed ? seed[2] : undefined,
        symbol: seed ? seed[3] : undefined,
      },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedLanguages(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, name, nameAr, nativeName] of LANGUAGES) {
    const row = await prisma.language.upsert({
      where: { code },
      create: { code, name, nameAr, nativeName },
      update: { name, nameAr, nativeName },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedCountries(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  continents: Map<string, string>,
  currencies: Map<string, string>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [code, code3, name, nameAr, phone, continent, currency] of COUNTRIES) {
    const row = await prisma.country.upsert({
      where: { code },
      create: {
        code,
        code3,
        name,
        nameAr,
        phoneCode: phone,
        continentId: continents.get(continent) ?? continents.get('EU')!,
        currencyId: currency ? currencies.get(currency) ?? null : null,
        slug: slugify(name),
      },
      update: {
        code3,
        name,
        nameAr,
        phoneCode: phone,
        continentId: continents.get(continent) ?? continents.get('EU')!,
        currencyId: currency ? currencies.get(currency) ?? null : null,
        slug: slugify(name),
      },
    });
    map.set(code, row.id);
  }
  return map;
}

async function seedDegreeLevels(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [name, nameAr, sort] of DEGREES) {
    const slug = slugify(name);
    const row = await prisma.degreeLevel.upsert({
      where: { slug },
      create: { name, nameAr, slug, sortOrder: sort },
      update: { name, nameAr, sortOrder: sort },
    });
    map.set(slug, row.id);
  }
  return map;
}

async function seedStudyFields(prisma: Awaited<ReturnType<typeof getPrisma>>): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const [slug, name, nameAr] of FIELDS) {
    const row = await prisma.studyField.upsert({
      where: { slug },
      create: { name, nameAr, slug, sortOrder: 0 },
      update: { name, nameAr },
    });
    map.set(slug, row.id);
  }
  for (const [slug, , , parentSlug] of FIELDS) {
    if (!parentSlug) continue;
    const parentId = map.get(parentSlug);
    if (!parentId) continue;
    await prisma.studyField.update({ where: { slug }, data: { parentId } });
  }
  return map;
}

async function seedProviders(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const s of SCHOLARSHIPS) {
    const slug = slugify(s.provider);
    const row = await prisma.provider.upsert({
      where: { slug },
      create: {
        name: s.provider,
        slug,
        providerType: s.providerType as never,
        website: s.officialWebsite,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        status: 'PUBLISHED',
      },
      update: {
        name: s.provider,
        providerType: s.providerType as never,
        website: s.officialWebsite,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        status: 'PUBLISHED',
      },
    });
    map.set(s.provider, row.id);
  }
  return map;
}

async function seedScholarships(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  providers: Map<string, string>,
  countries: Map<string, string>,
  degrees: Map<string, string>,
): Promise<number> {
  const now = today();
  let created = 0;
  let updated = 0;
  for (const s of SCHOLARSHIPS) {
    const closing = new Date(now.getTime() + s.closingInDays * 86400000);
    const opening = new Date(now.getTime() - 10 * 86400000);
    const degreeSlug = s.degree === 'master' ? 'master-s-degree' : s.degree === 'doctorate' ? 'doctorate-phd' : slugify(s.degree);
    const data = {
      title: s.title,
      titleAr: s.titleAr,
      description: s.description,
      providerId: providers.get(s.provider) ?? null,
      countryId: countries.get(s.country) ?? null,
      degreeLevelId: degrees.get(degreeSlug) ?? null,
      fundingType: s.fundingType as never,
      openingDate: opening,
      closingDate: closing,
      officialWebsite: s.officialWebsite,
      status: 'ACTIVE' as const,
      verificationStatus: 'VERIFIED' as const,
      isFeatured: s.isFeatured,
      isFullyFunded: true,
      isActive: true,
      sourceUrl: s.officialWebsite,
    };
    const existing = await prisma.scholarship.findUnique({ where: { slug: s.slug } });
    let scholarshipId: string;
    if (existing) {
      await prisma.scholarship.update({ where: { slug: s.slug }, data });
      scholarshipId = existing.id;
      updated += 1;
    } else {
      scholarshipId = (await prisma.scholarship.create({ data: { ...data, slug: s.slug } })).id;
      created += 1;
    }
    const cycleLabel = `${closing.getFullYear()} cycle`;
    const cycle = await prisma.scholarshipCycle.findFirst({
      where: { scholarshipId, cycleLabel, deletedAt: null },
    });
    const cycleData = {
      cycleLabel,
      openingDate: opening,
      closingDate: closing,
      isCurrent: true,
      status: closing >= now ? 'OPEN' as const : 'CLOSED' as const,
    };
    if (cycle) {
      await prisma.scholarshipCycle.update({ where: { id: cycle.id }, data: cycleData });
    } else {
      await prisma.scholarshipCycle.create({ data: { ...cycleData, scholarshipId } });
    }
  }
  return created;
}

async function seedUniversities(
  prisma: Awaited<ReturnType<typeof getPrisma>>,
  countries: Map<string, string>,
  target: number,
): Promise<number> {
  if (target <= 0) return 0;
  const countryCodes = [...countries.keys()];
  let created = 0;
  for (let n = 0; n < target; n++) {
    const code = countryCodes[n % countryCodes.length];
    const nameAr = countries.get(code);
    const base = slugify(`university of ${code}-${n}`);
    const slug = `${base}-${Math.floor(n / countryCodes.length) + 1}`;
    const exists = await prisma.university.findUnique({ where: { slug } });
    if (exists) continue;
    await prisma.university.create({
      data: {
        name: `University of ${code.toUpperCase()} ${Math.floor(n / countryCodes.length) + 1}`,
        nameAr,
        slug,
        countryId: countries.get(code)!,
        status: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
        isFeatured: false,
      },
    });
    created += 1;
  }
  return created;
}

async function main(): Promise<void> {
  loadEnv();
  requireEnv('DATABASE_URL');
  const { flags } = parseArgs();
  const withScholarships = !flagBoolean(flags, 'no-scholarships', false);
  const universitiesTarget = flagNumber(flags, 'universities', 0);

  const prisma = getPrisma();
  const started = Date.now();

  console.log('[seed] connecting to database...');
  const continents = await seedContinents(prisma);
  const countryCurrencies = new Set<string>();
  for (const [, , , , , , currency] of COUNTRIES) {
    if (currency) countryCurrencies.add(currency);
  }
  const currencies = await seedCurrencies(prisma, countryCurrencies);
  await seedLanguages(prisma);
  const countries = await seedCountries(prisma, continents, currencies);
  const degrees = await seedDegreeLevels(prisma);
  await seedStudyFields(prisma);

  if (withScholarships) {
    const providers = await seedProviders(prisma);
    await seedScholarships(prisma, providers, countries, degrees);
  }

  const universitiesCreated = await seedUniversities(prisma, countries, universitiesTarget);

  const [continentCount, currencyCount, languageCount, countryCount, degreeCount, fieldCount, providerCount, scholarshipCount, universityCount] =
    await Promise.all([
      prisma.continent.count(),
      prisma.currency.count(),
      prisma.language.count(),
      prisma.country.count(),
      prisma.degreeLevel.count(),
      prisma.studyField.count(),
      prisma.provider.count(),
      prisma.scholarship.count(),
      prisma.university.count(),
    ]);

  console.log('[seed] done in %dms', Date.now() - started);
  console.log('  continents          %s', fmt(continentCount));
  console.log('  currencies          %s', fmt(currencyCount));
  console.log('  languages           %s', fmt(languageCount));
  console.log('  countries           %s', fmt(countryCount));
  console.log('  degree levels       %s', fmt(degreeCount));
  console.log('  study fields        %s', fmt(fieldCount));
  console.log('  providers           %s', fmt(providerCount));
  console.log('  scholarships        %s', fmt(scholarshipCount));
  console.log('  universities        %s (+%s generated this run)', fmt(universityCount), fmt(universitiesCreated));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  })
  .finally(() => closePrisma());
