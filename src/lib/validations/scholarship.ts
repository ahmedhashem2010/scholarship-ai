import { z } from "zod";
import { SCHOLARSHIP_DEGREES, SCHOLARSHIP_COUNTRIES, SORT_OPTIONS } from "@/lib/constants";

export const scholarshipCreateSchema = z.object({
  nameAr: z
    .string()
    .min(2, "الاسم بالعربية يجب أن يكون على الأقل حرفين")
    .max(200, "الاسم بالعربية يجب أن لا يتجاوز 200 حرف"),
  nameEn: z
    .string()
    .min(2, "English name must be at least 2 characters")
    .max(200, "English name must not exceed 200 characters"),
  country: z.enum(SCHOLARSHIP_COUNTRIES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "يرجى اختيار دولة صالحة" }),
  }),
  university: z.string().max(200).optional().or(z.literal("")),
  degree: z.enum(SCHOLARSHIP_DEGREES as unknown as [string, ...string[]], {
    errorMap: () => ({ message: "يرجى اختيار درجة علمية صالحة" }),
  }),
  deadline: z
    .string()
    .datetime({ message: "صيغة التاريخ غير صالحة (استخدم ISO 8601)" }),
  flagUrl: z.string().optional().or(z.literal("")),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  sourceUrl: z.string().optional().or(z.literal("")),
  // Official links — validated as real URLs so an aggregator listing can never
  // be written into the field the UI renders as the "official" one.
  officialWebsite: z.string().url({ message: "رابط الموقع الرسمي غير صالح" }).optional().or(z.literal("")),
  applicationUrl: z.string().url({ message: "رابط التقديم غير صالح" }).optional().or(z.literal("")),
});

export const scholarshipUpdateSchema = scholarshipCreateSchema.partial();

export const scholarshipQuerySchema = z.object({
  country: z.string().optional(),
  degree: z.string().optional(),
  search: z.string().optional(),
  sort: z.nativeEnum(SORT_OPTIONS).optional(),
  page: z
    .string()
    .transform((val) => Math.max(1, parseInt(val, 10) || 1))
    .optional()
    .default("1"),
  pageSize: z
    .string()
    .transform((val) => Math.min(500, Math.max(1, parseInt(val, 10) || 10)))
    .optional()
    .default("10"),
});

export type ScholarshipCreateInput = z.infer<typeof scholarshipCreateSchema>;
export type ScholarshipUpdateInput = z.infer<typeof scholarshipUpdateSchema>;
export type ScholarshipQueryInput = z.infer<typeof scholarshipQuerySchema>;
