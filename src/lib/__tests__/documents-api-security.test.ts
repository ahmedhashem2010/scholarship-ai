// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));
const { createClient: storageCreateClient } = vi.hoisted(() => ({ createClient: vi.fn() }));
const { prisma } = vi.hoisted(() => ({
  prisma: {
    document: { count: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@supabase/supabase-js", () => ({ createClient: storageCreateClient }));

import { GET as GETDocuments } from "@/app/api/documents/route";
import { GET as GETDocument } from "@/app/api/documents/[id]/route";
import { GET as GETFile } from "@/app/api/documents/[id]/file/route";

const LEGACY_URL =
  "https://test.supabase.co/storage/v1/object/public/documents/user-1/cv.pdf";

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "doc-1",
    userId: "user-1",
    fileName: "cv.pdf",
    fileUrl: LEGACY_URL,
    fileType: "application/pdf",
    fileSize: 123,
    documentType: "CV",
    version: 1,
    parentDocumentId: null,
    improvementScore: null,
    uploadedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
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

function mockStorageDownload(body: string) {
  storageCreateClient.mockReturnValue({
    storage: {
      from: () => ({
        download: vi.fn().mockResolvedValue({ data: new Blob([body]), error: null }),
      }),
    },
  });
}

describe("GET /api/documents — no public storage URLs in responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.document.count.mockResolvedValue(1);
    prisma.document.findMany.mockResolvedValue([
      { ...makeRow(), reviews: [], _count: { childVersions: 0 } },
    ]);
  });

  it("maps fileUrl to the authenticated file route and leaks nothing", async () => {
    mockSession("user-1");
    const res = await GETDocuments(new NextRequest("http://localhost/api/documents"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data[0].fileUrl).toBe("/api/documents/doc-1/file");
    expect(JSON.stringify(json)).not.toContain("storage/v1/object/public");
    expect(JSON.stringify(json)).not.toContain(LEGACY_URL);
  });
});

describe("GET /api/documents/[id] — no public storage URLs in responses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.document.findUnique.mockResolvedValue(makeRow());
  });

  it("maps fileUrl to the authenticated file route", async () => {
    mockSession("user-1");
    const res = await GETDocument(new NextRequest("http://localhost/api/documents/doc-1"), {
      params: { id: "doc-1" },
    });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.fileUrl).toBe("/api/documents/doc-1/file");
    expect(JSON.stringify(json)).not.toContain("storage/v1/object/public");
  });
});

describe("GET /api/documents/[id]/file — ownership enforced on every request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.document.findUnique.mockResolvedValue(makeRow({ fileUrl: "user-1/cv.pdf" }));
    mockStorageDownload("pdf bytes");
  });

  it("returns 403 for another user's document", async () => {
    mockSession("user-2", "attacker@example.com");
    const res = await GETFile(new NextRequest("http://localhost/api/documents/doc-1/file"), {
      params: { id: "doc-1" },
    });
    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated", async () => {
    mockSession(null);
    const res = await GETFile(new NextRequest("http://localhost/api/documents/doc-1/file"), {
      params: { id: "doc-1" },
    });
    expect(res.status).toBe(401);
  });

  it("serves the file to the owner using the resolved object path", async () => {
    mockSession("user-1");
    const res = await GETFile(new NextRequest("http://localhost/api/documents/doc-1/file"), {
      params: { id: "doc-1" },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("pdf bytes");
  });

  it("serves legacy-format rows too (public URL stored before the fix)", async () => {
    prisma.document.findUnique.mockResolvedValue(makeRow({ fileUrl: LEGACY_URL }));
    mockSession("user-1");
    const res = await GETFile(new NextRequest("http://localhost/api/documents/doc-1/file"), {
      params: { id: "doc-1" },
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("pdf bytes");
  });
});
