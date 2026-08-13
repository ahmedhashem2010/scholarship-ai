// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createApiClient } = vi.hoisted(() => ({ createApiClient: vi.fn() }));

const { prisma } = vi.hoisted(() => ({
  prisma: {
    scholarship: {
      create: vi.fn().mockResolvedValue({ id: "s1" }),
      findUnique: vi.fn().mockResolvedValue({ id: "s1" }),
      update: vi.fn().mockResolvedValue({ id: "s1", nameEn: "Updated" }),
      delete: vi.fn().mockResolvedValue({ id: "s1" }),
    },
  },
}));

vi.mock("@/lib/supabase/api-auth", () => ({ createApiClient }));
vi.mock("@/lib/prisma", () => ({ prisma }));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/scholarships/route";
import { PUT, DELETE } from "@/app/api/scholarships/[id]/route";

const ADMIN_EMAIL = "admin@smartscholar.org";

function mockSession(email: string | null) {
  createApiClient.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: email ? { id: "sess-user", email } : null },
        error: email ? null : new Error("no session"),
      }),
    },
  });
}

const CREATE_BODY = {
  nameAr: "منحة تجريبية",
  nameEn: "Test Scholarship",
  country: "USA",
  degree: "Master",
  deadline: "2026-12-31T23:59:59Z",
};

function createRequest() {
  return new NextRequest("http://localhost/api/scholarships", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(CREATE_BODY),
  });
}

function updateRequest() {
  return new NextRequest("http://localhost/api/scholarships/s1", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nameEn: "Updated" }),
  });
}

function deleteRequest() {
  return new NextRequest("http://localhost/api/scholarships/s1", { method: "DELETE" });
}

describe("scholarship catalogue writes — admin gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAIL = ADMIN_EMAIL;
  });

  describe("POST /api/scholarships", () => {
    it("rejects an unauthenticated caller with 401", async () => {
      mockSession(null);
      const res = await POST(createRequest());
      expect(res.status).toBe(401);
      expect(prisma.scholarship.create).not.toHaveBeenCalled();
    });

    it("rejects a normal user with 403", async () => {
      mockSession("normal@example.com");
      const res = await POST(createRequest());
      expect(res.status).toBe(403);
      expect(prisma.scholarship.create).not.toHaveBeenCalled();
    });

    it("allows the admin session to create a scholarship", async () => {
      mockSession(ADMIN_EMAIL);
      const res = await POST(createRequest());
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(prisma.scholarship.create).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when ADMIN_EMAIL is not configured", async () => {
      delete process.env.ADMIN_EMAIL;
      mockSession("admin@example.com");
      const res = await POST(createRequest());
      expect(res.status).toBe(500);
      expect(prisma.scholarship.create).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/scholarships/[id]", () => {
    it("rejects an unauthenticated caller with 401", async () => {
      mockSession(null);
      const res = await PUT(updateRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(401);
      expect(prisma.scholarship.findUnique).not.toHaveBeenCalled();
    });

    it("rejects a normal user with 403", async () => {
      mockSession("normal@example.com");
      const res = await PUT(updateRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(403);
      expect(prisma.scholarship.findUnique).not.toHaveBeenCalled();
    });

    it("allows the admin session to update a scholarship", async () => {
      mockSession(ADMIN_EMAIL);
      const res = await PUT(updateRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(200);
      expect(prisma.scholarship.update).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when ADMIN_EMAIL is not configured", async () => {
      delete process.env.ADMIN_EMAIL;
      mockSession("admin@example.com");
      const res = await PUT(updateRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(500);
      expect(prisma.scholarship.update).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/scholarships/[id]", () => {
    it("rejects an unauthenticated caller with 401", async () => {
      mockSession(null);
      const res = await DELETE(deleteRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(401);
      expect(prisma.scholarship.findUnique).not.toHaveBeenCalled();
    });

    it("rejects a normal user with 403", async () => {
      mockSession("normal@example.com");
      const res = await DELETE(deleteRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(403);
      expect(prisma.scholarship.findUnique).not.toHaveBeenCalled();
    });

    it("allows the admin session to delete a scholarship", async () => {
      mockSession(ADMIN_EMAIL);
      const res = await DELETE(deleteRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(prisma.scholarship.delete).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when ADMIN_EMAIL is not configured", async () => {
      delete process.env.ADMIN_EMAIL;
      mockSession("admin@example.com");
      const res = await DELETE(deleteRequest(), { params: { id: "s1" } });
      expect(res.status).toBe(500);
      expect(prisma.scholarship.delete).not.toHaveBeenCalled();
    });
  });
});
