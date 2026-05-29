import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  error: string,
  status = 400,
  details?: Record<string, string[]>
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function handleApiError(err: unknown): NextResponse<ApiResponse<never>> {
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join(".");
      if (!details[path]) {
        details[path] = [];
      }
      details[path]!.push(issue.message);
    }
    return errorResponse("Validation failed", 422, details);
  }

  if (err instanceof Error) {
    console.error("[API Error]", err.message);
    const isDev = process.env.NODE_ENV === "development";
    return errorResponse(isDev ? err.message : "Internal server error", 500);
  }

  console.error("[API Error] Unknown error", err);
  return errorResponse("An unexpected error occurred", 500);
}


