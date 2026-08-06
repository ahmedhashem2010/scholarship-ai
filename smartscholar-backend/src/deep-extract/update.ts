/**
 * DB writer for deep extraction results.
 *
 * Applies a MergeResult to the live database following the never-overwrite
 * policy: only changed fields are written, related rows are only added, and
 * every run records provenance in `metadata.deepExtract` plus a version snapshot
 * and per-field change log (mirroring scripts/updateScholarships.ts).
 */

import { Prisma, PrismaClient, $Enums } from '@prisma/client';
import { DbResolver } from '../acquisition/importers/db';
import { MergeResult, DeepExtracted, DEEP_EXTRACT_VERSION } from './types';
import { ExistingScholarship } from './merge';

function toDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isoFromDbDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export interface LoadedScholarship {
  id: string;
  slug: string;
  title: string;
  sourceUrl: string | null;
  officialWebsite: string | null;
  provider: { id: string; name: string; contactEmail: string | null; contactPhone: string | null } | null;
  countryCode: string | null;
  metadata: Record<string, unknown>;
  existing: ExistingScholarship;
}

/** Load a scholarship plus its related rows into the merge-ready shape. */
export async function loadExisting(prisma: PrismaClient, slug: string): Promise<LoadedScholarship | null> {
  const sch = await prisma.scholarship.findUnique({
    where: { slug },
    include: {
      country: { select: { code: true } },
      university: { select: { name: true } },
      provider: { select: { id: true, name: true, contactEmail: true, contactPhone: true } },
    },
  });
  if (!sch) return null;

  const [countryLinks, degreeLinks, fieldLinks, languageLinks, docs, tests, reqs, benefits, faqs] = await Promise.all([
    prisma.scholarshipEligibleCountries.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipDegrees.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipFields.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipLanguages.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipDocuments.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipTestRequirements.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipRequirements.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipBenefits.findMany({ where: { scholarshipId: sch.id } }),
    prisma.scholarshipFaqs.findMany({ where: { scholarshipId: sch.id } }),
  ]);

  const [countries, degrees, fields, languages, currencies] = await Promise.all([
    countryLinks.length
      ? prisma.country.findMany({ where: { id: { in: countryLinks.map((l) => l.countryId) } } })
      : Promise.resolve([]),
    degreeLinks.length
      ? prisma.degreeLevel.findMany({ where: { id: { in: degreeLinks.map((l) => l.degreeLevelId) } } })
      : Promise.resolve([]),
    fieldLinks.length
      ? prisma.studyField.findMany({ where: { id: { in: fieldLinks.map((l) => l.studyFieldId) } } })
      : Promise.resolve([]),
    languageLinks.length
      ? prisma.language.findMany({ where: { id: { in: languageLinks.map((l) => l.languageId) } } })
      : Promise.resolve([]),
    benefits.length
      ? prisma.currency.findMany({ where: { id: { in: benefits.map((b) => b.currencyId).filter((x): x is string => !!x) } } })
      : Promise.resolve([]),
  ]);

  const countryIdToCode = new Map(countries.map((c) => [c.id, c.code]));
  const degreeIdToSlug = new Map(degrees.map((d) => [d.id, d.slug]));
  const fieldIdToSlug = new Map(fields.map((f) => [f.id, f.slug]));
  const langIdToCode = new Map(languages.map((l) => [l.id, l.code]));
  const currencyIdToCode = new Map(currencies.map((c) => [c.id, c.code]));

  const metadata = (sch.metadata ?? {}) as Record<string, unknown>;

  return {
    id: sch.id,
    slug: sch.slug,
    title: sch.title,
    sourceUrl: sch.sourceUrl,
    officialWebsite: sch.officialWebsite,
    provider: sch.provider,
    countryCode: sch.country?.code ?? null,
    metadata,
    existing: {
      row: {
        titleAr: sch.titleAr,
        descriptionAr: sch.descriptionAr,
        seoDescription: sch.seoDescription,
        aiSummary: sch.aiSummary,
        aiTips: sch.aiTips,
        applicationProcess: sch.applicationProcess,
        selectionProcess: sch.selectionProcess,
        countryCode: sch.country?.code ?? null,
        city: (metadata.deepExtract as Record<string, unknown> | undefined)?.['city'] as string | null ?? null,
        university: sch.university?.name ?? null,
        durationMonths: sch.durationMonths,
        durationText: sch.durationText,
        openingDate: isoFromDbDate(sch.openingDate),
        closingDate: isoFromDbDate(sch.closingDate),
        interviewDate: isoFromDbDate(sch.interviewDate),
        resultsDate: isoFromDbDate(sch.resultsDate),
        enrollmentDate: isoFromDbDate(sch.enrollmentDate),
        nextDeadline: sch.nextDeadline ? isoFromDbDate(sch.nextDeadline) : null,
        minimumAge: sch.minimumAge,
        maximumAge: sch.maximumAge,
        minimumGpa: sch.minimumGpa ? Number(sch.minimumGpa) : null,
        gpaScale: Number(sch.gpaScale),
        minimumPercentage: sch.minimumPercentage ? Number(sch.minimumPercentage) : null,
        fundingType: sch.fundingType,
        isFullyFunded: sch.isFullyFunded,
        applicationUrl: sch.applicationUrl,
        applicationPortal: (metadata.deepExtract as Record<string, unknown> | undefined)?.['applicationPortal'] as string | null ?? null,
        applicationFeeAmount: sch.applicationFee ? Number(sch.applicationFee) : null,
        applicationFeeCurrency: sch.applicationFeeCurrencyId ? null : null,
        officialPdfUrl: sch.officialPdfUrl,
      },
      related: {
        eligibleCountries: countryLinks.map((l) => countryIdToCode.get(l.countryId)).filter((x): x is string => !!x),
        degreeLevels: degreeLinks.map((l) => degreeIdToSlug.get(l.degreeLevelId)).filter((x): x is string => !!x),
        studyFields: fieldLinks.map((l) => fieldIdToSlug.get(l.studyFieldId)).filter((x): x is string => !!x),
        languageCodes: languageLinks.map((l) => langIdToCode.get(l.languageId)).filter((x): x is string => !!x),
        documents: docs.map((d) => ({ type: d.documentType, name: d.name, isRequired: d.isRequired })),
        testRequirements: tests.map((t) => ({
          type: t.testType,
          minimumScore: t.minimumScore ? String(t.minimumScore) : null,
          minimumBand: t.minimumBand,
          isMandatory: t.isMandatory,
          notes: t.notes,
        })),
        requirements: reqs.map((r) => ({ type: r.requirementType, description: r.description, isMandatory: r.isHardRequirement })),
        benefits: benefits.map((b) => ({
          type: b.benefitType,
          amount: b.amount ? Number(b.amount) : null,
          currency: b.currencyId ? (currencyIdToCode.get(b.currencyId) ?? null) : null,
          period: null,
          description: b.description,
        })),
        faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
      },
    },
  };
}

export interface ApplyOptions {
  dryRun: boolean;
  runAt: string;
  pagesCrawled: string[];
  pdfsAnalyzed: string[];
  crawlErrors: string[];
}

export interface ApplyResult {
  appliedFields: string[];
  addedRelated: Record<string, number>;
  version: number | null;
}

/** Derive the next deadline from per-intake dates or the closing date. */
function deriveNextDeadline(closingPerIntake: Array<{ label: string | null; date: string | null; raw: string | null }>, closingDate: string | null, existing: string | null): Date | null {
  if (existing) return null;
  const today = new Date();
  const candidates: Date[] = [];
  for (const intake of closingPerIntake) {
    const d = toDate(intake.date);
    if (d && d.getTime() >= today.getTime() - 24 * 3600 * 1000) candidates.push(d);
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  const closing = toDate(closingDate);
  if (closing && closing.getTime() >= today.getTime()) candidates.push(closing);
  return candidates.length ? candidates[0]! : null;
}

/**
 * Apply a MergeResult to the DB. In dry-run mode nothing is written.
 * Returns the list of fields that would be / were written.
 */
export async function applyMerge(
  prisma: PrismaClient,
  loaded: LoadedScholarship,
  merge: MergeResult,
  extracted: DeepExtracted,
  opts: ApplyOptions,
): Promise<ApplyResult> {
  const resolver = new DbResolver(prisma);
  const data: Prisma.ScholarshipUncheckedUpdateInput = {};
  const appliedFields: string[] = [];

  const setCol = (col: keyof Prisma.ScholarshipUncheckedUpdateInput, value: unknown, field: string) => {
    if (value === undefined) return;
    (data as Record<string, unknown>)[col] = value;
    if (!appliedFields.includes(field)) appliedFields.push(field);
  };

  // --- scalar columns ---
  if (merge.fields.titleAr.changed) setCol('titleAr', merge.fields.titleAr.value, 'titleAr');
  if (merge.fields.descriptionAr.changed) {
    setCol('descriptionAr', merge.fields.descriptionAr.value, 'descriptionAr');
    setCol('needsEmbedding', true, 'needsEmbedding');
  }
  if (merge.fields.seoDescription.changed) setCol('seoDescription', merge.fields.seoDescription.value, 'seoDescription');
  if (merge.fields.aiSummary.changed) {
    setCol('aiSummary', merge.fields.aiSummary.value, 'aiSummary');
    setCol('needsEmbedding', true, 'needsEmbedding');
  }
  if (merge.fields.aiTips.changed) setCol('aiTips', merge.fields.aiTips.value, 'aiTips');
  if (merge.fields.applicationProcess.changed) setCol('applicationProcess', merge.fields.applicationProcess.value, 'applicationProcess');
  if (merge.fields.selectionProcess.changed) setCol('selectionProcess', merge.fields.selectionProcess.value, 'selectionProcess');
  if (merge.fields.durationMonths.changed) setCol('durationMonths', merge.fields.durationMonths.value, 'durationMonths');
  if (merge.fields.durationText.changed) setCol('durationText', merge.fields.durationText.value, 'durationText');
  if (merge.fields.openingDate.changed) setCol('openingDate', toDate(merge.fields.openingDate.value), 'openingDate');
  if (merge.fields.closingDate.changed) setCol('closingDate', toDate(merge.fields.closingDate.value), 'closingDate');
  if (merge.fields.interviewDate.changed) setCol('interviewDate', toDate(merge.fields.interviewDate.value), 'interviewDate');
  if (merge.fields.resultsDate.changed) setCol('resultsDate', toDate(merge.fields.resultsDate.value), 'resultsDate');
  if (merge.fields.enrollmentDate.changed) setCol('enrollmentDate', toDate(merge.fields.enrollmentDate.value), 'enrollmentDate');
  if (merge.fields.minimumAge.changed) setCol('minimumAge', merge.fields.minimumAge.value, 'minimumAge');
  if (merge.fields.maximumAge.changed) setCol('maximumAge', merge.fields.maximumAge.value, 'maximumAge');
  if (merge.fields.minimumGpa.changed) setCol('minimumGpa', merge.fields.minimumGpa.value !== null ? new Prisma.Decimal(String(merge.fields.minimumGpa.value)) : null, 'minimumGpa');
  if (merge.fields.gpaScale.changed) setCol('gpaScale', merge.fields.gpaScale.value !== null ? new Prisma.Decimal(String(merge.fields.gpaScale.value)) : new Prisma.Decimal('4'), 'gpaScale');
  if (merge.fields.minimumPercentage.changed) setCol('minimumPercentage', merge.fields.minimumPercentage.value !== null ? new Prisma.Decimal(String(merge.fields.minimumPercentage.value)) : null, 'minimumPercentage');
  if (merge.fields.fundingType.changed) setCol('fundingType', merge.fields.fundingType.value ?? undefined, 'fundingType');
  if (merge.fields.fullyFunded.changed) setCol('isFullyFunded', merge.fields.fullyFunded.value, 'isFullyFunded');
  if (merge.fields.applicationUrl.changed) setCol('applicationUrl', merge.fields.applicationUrl.value, 'applicationUrl');
  if (merge.fields.applicationFeeAmount.changed) setCol('applicationFee', merge.fields.applicationFeeAmount.value !== null ? new Prisma.Decimal(String(merge.fields.applicationFeeAmount.value)) : null, 'applicationFeeAmount');
  if (merge.fields.officialPdfUrl.changed) setCol('officialPdfUrl', merge.fields.officialPdfUrl.value, 'officialPdfUrl');

  if (merge.fields.applicationFeeCurrency.changed && merge.fields.applicationFeeCurrency.value) {
    const currencyId = await resolver.currency(merge.fields.applicationFeeCurrency.value);
    if (currencyId) setCol('applicationFeeCurrencyId', currencyId, 'applicationFeeCurrency');
  }

  if (merge.fields.countryCode.changed && merge.fields.countryCode.value) {
    const countryId = await resolver.country(merge.fields.countryCode.value);
    if (countryId) setCol('countryId', countryId, 'countryCode');
  }

  if (merge.fields.university.changed && merge.fields.university.value) {
    const countryCode = merge.fields.countryCode.value ?? loaded.countryCode;
    const universityId = await resolver.university(merge.fields.university.value, countryCode);
    if (universityId) setCol('universityId', universityId, 'university');
  }

  // --- derived nextDeadline ---
  const nextDeadline = deriveNextDeadline(extracted.closingPerIntake, merge.fields.closingDate.value, loaded.existing.row.nextDeadline);
  if (nextDeadline) {
    setCol('nextDeadline', nextDeadline, 'nextDeadline');
  }

  // --- metadata: provenance + non-column fields (city, applicationPortal, contact) ---
  const deepMeta: Record<string, unknown> = {
    version: DEEP_EXTRACT_VERSION,
    runAt: opts.runAt,
    aiProvider: extracted.provider,
    confidence: extracted.confidence,
    pagesCrawled: opts.pagesCrawled,
    pdfsAnalyzed: opts.pdfsAnalyzed,
    crawlErrors: opts.crawlErrors,
    closingPerIntake: extracted.closingPerIntake,
  };
  if (merge.fields.city.changed) deepMeta['city'] = merge.fields.city.value;
  if (merge.fields.applicationPortal.changed) deepMeta['applicationPortal'] = merge.fields.applicationPortal.value;
  if (merge.contact.email || merge.contact.phone || merge.contact.coordinator || merge.contact.officeAddress) {
    deepMeta['contact'] = merge.contact;
  }

  const nextMetadata = { ...loaded.metadata };
  const prevDeep = nextMetadata.deepExtract as Record<string, unknown> | undefined;
  nextMetadata.deepExtract = { ...(prevDeep ?? {}), ...deepMeta };
  if (JSON.stringify(prevDeep ?? {}) !== JSON.stringify(nextMetadata.deepExtract)) {
    if (!appliedFields.includes('metadata')) appliedFields.push('metadata');
  }

  // --- related rows ---
  const addedRelated: Record<string, number> = {};
  const relatedAdds: Promise<void>[] = [];

  const addEligible = async () => {
    const resolved: string[] = [];
    for (const entry of merge.related.eligibleCountries) {
      const id = await resolver.country(entry.code);
      if (id) resolved.push(id);
    }
    if (resolved.length) {
      addedRelated['eligibleCountries'] = resolved.length;
      if (!opts.dryRun) {
        await prisma.scholarshipEligibleCountries.createMany({
          data: resolved.map((countryId) => ({ scholarshipId: loaded.id, countryId })),
          skipDuplicates: true,
        });
      }
    }
  };
  relatedAdds.push(addEligible());

  const addDegrees = async () => {
    const resolved: string[] = [];
    for (const slug of merge.related.degreeLevels) {
      const id = await resolver.degreeLevel(slug);
      if (id) resolved.push(id);
    }
    if (resolved.length) {
      addedRelated['degreeLevels'] = resolved.length;
      if (!opts.dryRun) {
        await prisma.scholarshipDegrees.createMany({
          data: resolved.map((degreeLevelId) => ({ scholarshipId: loaded.id, degreeLevelId })),
          skipDuplicates: true,
        });
        if (loaded.existing.row.titleAr === null || loaded.existing.row.aiSummary === null) {
          await prisma.scholarship.update({ where: { id: loaded.id }, data: { needsEmbedding: true } });
        }
      }
    }
  };
  relatedAdds.push(addDegrees());

  const addFields = async () => {
    const resolved: string[] = [];
    for (const slug of merge.related.studyFields) {
      const id = await resolver.studyField(slug);
      if (id) resolved.push(id);
    }
    if (resolved.length) {
      addedRelated['studyFields'] = resolved.length;
      if (!opts.dryRun) {
        await prisma.scholarshipFields.createMany({
          data: resolved.map((studyFieldId) => ({ scholarshipId: loaded.id, studyFieldId })),
          skipDuplicates: true,
        });
        await prisma.scholarship.update({ where: { id: loaded.id }, data: { needsEmbedding: true } });
      }
    }
  };
  relatedAdds.push(addFields());

  const addLanguages = async () => {
    const resolved: Array<{ languageId: string; isRequired: boolean }> = [];
    for (const lang of merge.related.languageCodes) {
      const id = await resolver.language(lang.code);
      if (id) resolved.push({ languageId: id, isRequired: lang.required });
    }
    if (resolved.length) {
      addedRelated['languageCodes'] = resolved.length;
      if (!opts.dryRun) {
        await prisma.scholarshipLanguages.createMany({
          data: resolved.map((l) => ({ scholarshipId: loaded.id, ...l })),
          skipDuplicates: true,
        });
      }
    }
  };
  relatedAdds.push(addLanguages());

  if (merge.related.documents.length) {
    addedRelated['documents'] = merge.related.documents.length;
    if (!opts.dryRun) {
      relatedAdds.push(
        prisma.scholarshipDocuments.createMany({
          data: merge.related.documents.map((d, i) => ({
            scholarshipId: loaded.id,
            documentType: d.type as never,
            name: d.name,
            isRequired: d.isRequired,
            sortOrder: i,
          })),
        }).then(() => undefined),
      );
    }
  }

  if (merge.related.testRequirements.length) {
    addedRelated['testRequirements'] = merge.related.testRequirements.length;
    if (!opts.dryRun) {
      relatedAdds.push(
        prisma.scholarshipTestRequirements.createMany({
          data: merge.related.testRequirements.map((t) => ({
            scholarshipId: loaded.id,
            testType: t.type as never,
            minimumScore: t.minimumScore ? new Prisma.Decimal(t.minimumScore.replace(/[^\d.]/g, '') || '0') : null,
            minimumBand: t.minimumBand,
            isMandatory: t.isMandatory,
            notes: t.notes,
          })),
          skipDuplicates: true,
        }).then(() => undefined),
      );
    }
  }

  if (merge.related.requirements.length) {
    addedRelated['requirements'] = merge.related.requirements.length;
    if (!opts.dryRun) {
      relatedAdds.push(
        prisma.scholarshipRequirements.createMany({
          data: merge.related.requirements.map((r, i) => ({
            scholarshipId: loaded.id,
            requirementType: r.type as never,
            description: r.description,
            isHardRequirement: r.isMandatory,
            sortOrder: i,
          })),
        }).then(() => undefined),
      );
    }
  }

  const addBenefits = async () => {
    const resolved: Prisma.ScholarshipBenefitsCreateManyInput[] = [];
    for (const b of merge.related.benefits) {
      const currencyId = b.currency ? await resolver.currency(b.currency) : null;
      resolved.push({
        scholarshipId: loaded.id,
        benefitType: b.type as $Enums.benefit_type,
        amount: b.amount !== null && b.amount !== undefined ? new Prisma.Decimal(String(b.amount)) : null,
        currencyId,
        description: b.description,
        isEstimated: false,
      });
    }
    if (resolved.length) {
      addedRelated['benefits'] = resolved.length;
      if (!opts.dryRun) {
        await prisma.scholarshipBenefits.createMany({ data: resolved });
      }
    }
  };
  relatedAdds.push(addBenefits());

  if (merge.related.faqs.length) {
    addedRelated['faqs'] = merge.related.faqs.length;
    if (!opts.dryRun) {
      relatedAdds.push(
        prisma.scholarshipFaqs.createMany({
          data: merge.related.faqs.map((f, i) => ({
            scholarshipId: loaded.id,
            question: f.question,
            answer: f.answer,
            sortOrder: i,
            isPublished: true,
          })),
        }).then(() => undefined),
      );
    }
  }

  const changedCount = appliedFields.length + Object.values(addedRelated).reduce((a, b) => a + b, 0);
  if (opts.dryRun) {
    await Promise.all(relatedAdds);
    return { appliedFields, addedRelated, version: null };
  }
  if (changedCount === 0) {
    return { appliedFields, addedRelated, version: null };
  }

  await Promise.all(relatedAdds);

  // --- scalar + metadata write ---
  if (Object.keys(data).length > 0) {
    await prisma.scholarship.update({ where: { id: loaded.id }, data });
  }
  if (JSON.stringify(loaded.metadata) !== JSON.stringify(nextMetadata)) {
    await prisma.scholarship.update({
      where: { id: loaded.id },
      data: { metadata: nextMetadata as Prisma.InputJsonValue },
    });
  }

  // --- provider contact (only fill empty provider fields) ---
  if (loaded.provider && !opts.dryRun) {
    const contactPatch: Record<string, string> = {};
    if (merge.contact.email && !loaded.provider.contactEmail) contactPatch['contactEmail'] = merge.contact.email;
    if (merge.contact.phone && !loaded.provider.contactPhone) contactPatch['contactPhone'] = merge.contact.phone;
    if (Object.keys(contactPatch).length) {
      await prisma.provider.update({ where: { id: loaded.provider.id }, data: contactPatch as never });
    }
  }

  // --- version + change log ---
  const updated = await prisma.scholarship.findUnique({ where: { id: loaded.id } });
  if (!updated) return { appliedFields, addedRelated, version: null };

  const changeRows: Array<Record<string, unknown>> = [];
  for (const field of appliedFields) {
    if (field === 'metadata' || field === 'needsEmbedding') continue;
    changeRows.push({
      scholarshipId: loaded.id,
      fieldName: field,
      oldValue: null,
      newValue: null,
      changeType: 'UPDATE',
    });
  }
  for (const [cat, count] of Object.entries(addedRelated)) {
    changeRows.push({
      scholarshipId: loaded.id,
      fieldName: `related:${cat}`,
      oldValue: 0,
      newValue: count,
      changeType: 'UPDATE',
    });
  }
  if (changeRows.length) {
    await prisma.scholarshipChangeLog.createMany({ data: changeRows as never });
  }

  const versionAgg = await prisma.scholarshipVersion.aggregate({
    where: { scholarshipId: loaded.id },
    _max: { version: true },
  });
  const version = (versionAgg._max.version ?? 0) + 1;
  await prisma.scholarshipVersion.create({
    data: {
      scholarshipId: loaded.id,
      version,
      snapshot: JSON.parse(JSON.stringify(updated, (_k, v) => (typeof v === 'bigint' ? v.toString() : v))) as Prisma.InputJsonValue,
      changeType: 'UPDATE',
    },
  });

  return { appliedFields, addedRelated, version };
}
