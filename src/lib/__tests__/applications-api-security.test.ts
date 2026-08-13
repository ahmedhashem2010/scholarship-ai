// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));
const { prisma } = vi.hoisted(() => ({
  prisma: { application: { findUnique: vi.fn() } },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { GET } from "@/app/api/applications/[id]/route";

const LEGACY_URL =
  "https://test.supabase.co/storage/v1/object/public/documents/user-1/cv.pdf";

function makeApplication() {
  return {
    id: "app-1",
    userId: "user-1",
    scholarshipId: "sch-1",
    status: "IN_PROGRESS",
    progress: 50,
    startedAt: new Date("2026-01-01T00:00:00.000Z"),
    submittedAt: null,
    scholarship: { id: "sch-1", nameEn: "Test", nameAr: "اختبار" },
    documents: [
      {
        id: "appdoc-1",
        applicationId: "app-1",
        documentType: "CV",
        status: "READY",
        aiScore: 8,
        uploadedDocumentId: "doc-1",
        feedback: null,
        uploadedDocument: {
          id: "doc-1",
          fileName: "cv.pdf",
          fileUrl: LEGACY_URL,
        },
      },
      {
        id: "appdoc-2",
        applicationId: "app-1",
        documentType: "TRANSCRIPT",
        status: "NOT_STARTED",
        aiScore: null,
        uploadedDocumentId: null,
        feedback: null,
        uploadedDocument: null,
      },
    ],
  };
}

function mockSession(id: string | null, email = "user@example.com") {
  createApiClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: id ? { id, email } : null },
        error: id ? null : new Error("no session"),
      }),
    },
  });
}

describe("GET /api/applications/[id] — uploaded document URLs stay private", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.application.findUnique.mockResolvedValue(makeApplication());
  });

  it("maps the uploaded document fileUrl to the authenticated route", async () => {
    mockSession("user-1");
    const res = await GET(new NextRequest("http://localhost/api/applications/app-1"), {
      params: { id: "app-1" },
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    const doc = json.data.documents.find((d: { id: string }) => d.id === "appdoc-1");
    expect(doc.uploadedDocument.fileUrl).toBe("/api/documents/doc-1/file");
    expect(JSON.stringify(json)).not.toContain("storage/v1/object/public");
    expect(JSON.stringify(json)).not.toContain(LEGACY_URL);
  });

  it("keeps documents without an upload null", async () => {
    mockSession("user-1");
    const res = await GET(new NextRequest("http://localhost/api/applications/app-1"), {
      params: { id: "app-1" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    const doc = json.data.documents.find((d: { id: string }) => d.id === "appdoc-2");
    expect(doc.uploadedDocument).toBeNull();
  });

  it("returns 403 for another user's application", async () => {
    mockSession("user-2", "attacker@example.com");
    const res = await GET(new NextRequest("http://localhost/api/applications/app-1"), {
      params: { id: "app-1" },
    });
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession(null);
    const res = await GET(new NextRequest("http://localhost/api/applications/app-1"), {
      params: { id: "app-1" },
    });
    expect(res.status).toBe(401);
  });
});
