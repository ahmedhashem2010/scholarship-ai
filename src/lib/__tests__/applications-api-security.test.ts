// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));
const { prisma } = vi.hoisted(() => ({
  prisma: {
    application: { findUnique: vi.fn(), update: vi.fn() },
    applicationDocument: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    document: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { GET } from "@/app/api/applications/[id]/route";
import { PATCH } from "@/app/api/applications/[id]/documents/[docId]/route";

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

describe("PATCH /api/applications/[id]/documents/[docId] — ownership enforced", () => {
  function makeAppDoc(overrides: Record<string, unknown> = {}) {
    return {
      id: "appdoc-1",
      applicationId: "app-1",
      documentType: "CV",
      status: "READY",
      aiScore: 8,
      uploadedDocumentId: "doc-1",
      feedback: null,
      application: {
        userId: "user-1",
        submittedAt: null,
        documents: [],
      },
      ...overrides,
    };
  }

  function makePatchRequest(overrides: Record<string, unknown> = {}) {
    return new NextRequest(
      "http://localhost/api/applications/app-victim/documents/appdoc-1",
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uploadedDocumentId: "doc-1", ...overrides }),
      }
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.applicationDocument.findUnique.mockResolvedValue(makeAppDoc());
    prisma.applicationDocument.findMany.mockResolvedValue([]);
    prisma.applicationDocument.update.mockResolvedValue(makeAppDoc());
    prisma.application.update.mockResolvedValue({});
  });

  it("returns 403 when patching another user's application document", async () => {
    mockSession("user-1", "attacker@example.com");
    prisma.applicationDocument.findUnique.mockResolvedValue(
      makeAppDoc({ application: { userId: "user-2", submittedAt: null, documents: [] } })
    );

    const res = await PATCH(makePatchRequest(), { params: { id: "app-victim", docId: "appdoc-1" } });
    expect(res.status).toBe(403);
    expect(prisma.applicationDocument.update).not.toHaveBeenCalled();
    expect(prisma.application.update).not.toHaveBeenCalled();
  });

  it("returns 403 when linking another user's document to your application", async () => {
    mockSession("user-1", "attacker@example.com");
    prisma.document.findUnique.mockResolvedValue({ id: "doc-2", userId: "user-2" });

    const res = await PATCH(makePatchRequest({ uploadedDocumentId: "doc-2" }), {
      params: { id: "app-1", docId: "appdoc-1" },
    });
    expect(res.status).toBe(403);
    expect(prisma.applicationDocument.update).not.toHaveBeenCalled();
  });

  it("returns 404 when the linked document does not exist", async () => {
    mockSession("user-1");
    prisma.document.findUnique.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ uploadedDocumentId: "doc-missing" }), {
      params: { id: "app-1", docId: "appdoc-1" },
    });
    expect(res.status).toBe(404);
  });

  it("updates progress on the document's own application, not the URL-provided id", async () => {
    mockSession("user-1");
    prisma.document.findUnique.mockResolvedValue({ id: "doc-1", userId: "user-1" });
    prisma.applicationDocument.findMany.mockResolvedValue([
      makeAppDoc({ status: "READY" }),
      makeAppDoc({ id: "appdoc-2", status: "NOT_STARTED" }),
    ]);

    const res = await PATCH(makePatchRequest({ status: "READY" }), {
      params: { id: "app-victim", docId: "appdoc-1" },
    });
    expect(res.status).toBe(200);

    // The URL id ("app-victim") must never be used for the progress write.
    expect(prisma.application.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "app-victim" } })
    );
    expect(prisma.application.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "app-1" }, data: { progress: 40 } })
    );
    expect(prisma.applicationDocument.findMany).toHaveBeenCalledWith({
      where: { applicationId: "app-1" },
    });
  });
});
