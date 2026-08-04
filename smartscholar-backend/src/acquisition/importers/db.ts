import { PrismaClient } from '@prisma/client';
import { slugify } from '../../../scripts/lib';

/** Cached lookup/upsert helpers for reference tables. */
export class DbResolver {
  private providers = new Map<string, string>();
  private countries = new Map<string, string>();
  private universities = new Map<string, string>();
  private degreeLevels = new Map<string, string>();
  private studyFields = new Map<string, string>();
  private currencies = new Map<string, string>();
  private languages = new Map<string, string>();

  constructor(private prisma: PrismaClient) {}

  async provider(name: string, website?: string, providerType = 'GOVERNMENT'): Promise<string> {
    const slug = slugify(name);
    const cached = this.providers.get(slug);
    if (cached) return cached;
    const row = await this.prisma.provider.upsert({
      where: { slug },
      create: {
        name,
        slug,
        providerType: providerType as never,
        website: website ?? null,
        isVerified: true,
        verificationStatus: 'VERIFIED',
        status: 'PUBLISHED',
      },
      update: { website: website ?? undefined },
    });
    this.providers.set(slug, row.id);
    return row.id;
  }

  async country(code: string): Promise<string | null> {
    const c = code.toUpperCase();
    const cached = this.countries.get(c);
    if (cached) return cached;
    const row = await this.prisma.country.findUnique({ where: { code: c } });
    if (!row) return null;
    this.countries.set(c, row.id);
    return row.id;
  }

  async university(name: string, countryCode: string | null): Promise<string | null> {
    const key = `${countryCode ?? '?'}:${slugify(name)}`;
    const cached = this.universities.get(key);
    if (cached) return cached;
    const slug = slugify(name);
    const existing = await this.prisma.university.findUnique({ where: { slug } });
    if (existing) {
      this.universities.set(key, existing.id);
      return existing.id;
    }
    const countryId = countryCode ? await this.country(countryCode) : null;
    if (!countryId) return null;
    const row = await this.prisma.university.create({
      data: {
        name,
        slug,
        countryId,
        status: 'PUBLISHED',
        verificationStatus: 'UNVERIFIED',
      },
    });
    this.universities.set(key, row.id);
    return row.id;
  }

  async degreeLevel(slug: string): Promise<string | null> {
    const cached = this.degreeLevels.get(slug);
    if (cached) return cached;
    const row = await this.prisma.degreeLevel.findUnique({ where: { slug } });
    if (!row) return null;
    this.degreeLevels.set(slug, row.id);
    return row.id;
  }

  async studyField(slug: string): Promise<string | null> {
    const cached = this.studyFields.get(slug);
    if (cached) return cached;
    const row = await this.prisma.studyField.findUnique({ where: { slug } });
    if (!row) return null;
    this.studyFields.set(slug, row.id);
    return row.id;
  }

  async currency(code: string): Promise<string | null> {
    const c = code.toUpperCase();
    const cached = this.currencies.get(c);
    if (cached) return cached;
    const row = await this.prisma.currency.findUnique({ where: { code: c } });
    if (!row) return null;
    this.currencies.set(c, row.id);
    return row.id;
  }

  async language(code: string): Promise<string | null> {
    const c = code.toLowerCase();
    const cached = this.languages.get(c);
    if (cached) return cached;
    const row = await this.prisma.language.findUnique({ where: { code: c } });
    if (!row) return null;
    this.languages.set(c, row.id);
    return row.id;
  }
}

export const DEGREE_TYPE_TO_LEVEL_SLUG: Record<string, string> = {
  ASSOCIATE: 'associate-degree',
  BACHELOR: 'bachelors-degree',
  MASTER: 'masters-degree',
  DOCTORATE: 'doctorate-phd',
  DIPLOMA: 'diploma',
  CERTIFICATE: 'certificate',
  SHORT_COURSE: 'short-course',
  EXCHANGE: 'exchange-program',
  LANGUAGE_COURSE: 'language-course',
  RESEARCH: 'research',
  SUMMER_SCHOOL: 'summer-school',
  OTHER: 'other',
};
