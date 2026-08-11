import type { Scholarship } from "@prisma/client";
import type { SCHOLARSHIP_COUNTRIES, SCHOLARSHIP_DEGREES, SORT_OPTIONS } from "@/lib/constants";

export type { Scholarship };

export type ScholarshipDegree = (typeof SCHOLARSHIP_DEGREES)[number];
export type ScholarshipCountry = (typeof SCHOLARSHIP_COUNTRIES)[number];
export type ScholarshipSortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

export interface ScholarshipFilters {
  country?: string;
  degree?: string;
  search?: string;
  isActive?: boolean;
  sort?: ScholarshipSortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}

export interface ScholarshipCreateInput {
  nameAr: string;
  nameEn: string;
  country: string;
  university?: string;
  degree: string;
  deadline: string;
  flagUrl?: string;
  requirements?: Record<string, unknown>;
  benefits?: Record<string, unknown>;
  sourceUrl?: string;
  officialWebsite?: string;
  applicationUrl?: string;
}

export interface ScholarshipUpdateInput extends Partial<ScholarshipCreateInput> {}
