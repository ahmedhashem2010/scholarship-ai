// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    scholarship: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/scholarships/route";

async function callGet(search = "") {
  const res = await GET(
    new NextRequest(`http://localhost/api/scholarships${search}`)
  );
  return { status: res.status, json: await res.json() };
}

function findManyArg() {
  return prisma.scholarship.findMany.mock.calls[0]![0] as {
    where: { AND: Array<{ id?: { in: string[] } }> };
  };
}

describe("GET /api/scholarships — compare ids filter", () => {
  beforeEach(() => {
    prisma.scholarship.findMany.mockClear();
    prisma.scholarship.count.mockClear();
  });

  it("passes the parsed ids to the id filter", async () => {
    const { json } = await callGet("?ids=clx1%2Cclx2");
    const where = findManyArg().where;

    expect(where.AND.some((clause) => clause.id && clause.id.in?.length === 2)).toBe(true);
    expect(where.AND.find((c) => c.id)?.id?.in).toEqual(["clx1", "clx2"]);
    expect(json.success).toBe(true);
  });

  it("does not set an id filter when ids is absent", async () => {
    await callGet();
    const where = findManyArg().where;
    expect(where.AND.some((clause) => clause.id)).toBe(false);
  });

  it("handles an empty ids param gracefully", async () => {
    await callGet("?ids=");
    const where = findManyArg().where;
    expect(where.AND.some((clause) => clause.id)).toBe(false);
  });

  it("rejects ids that fail to decode instead of throwing", async () => {
    await callGet("?ids=good%2C%zz");
    const where = findManyArg().where;
    expect(where.AND.find((c) => c.id)?.id?.in).toEqual(["good"]);
  });
});
