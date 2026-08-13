import { z } from "zod";

export const APPLICATION_STATUSES = ["IN_PROGRESS", "SUBMITTED"] as const;

export const APPLICATION_DOC_STATUSES = [
  "NOT_STARTED",
  "DRAFT",
  "READY",
  "NEEDS_IMPROVEMENT",
  "IN_REVIEW",
] as const;

export const createApplicationSchema = z.object({
  scholarshipId: z.string().min(1),
});

export const updateApplicationSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
});

export const updateApplicationDocumentSchema = z.object({
  status: z.enum(APPLICATION_DOC_STATUSES).optional(),
  aiScore: z.number().min(0).max(10).nullable().optional(),
  uploadedDocumentId: z.string().min(1).optional(),
  feedback: z.string().optional(),
  markFinal: z.boolean().optional(),
});


